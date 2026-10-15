<?php
declare(strict_types=1);

const MAX_REQUEST_BYTES = 16384;

function request_id(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20));
}

function wants_json(): bool {
    return stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;
}

function security_headers(): void {
    header('Cache-Control: no-store, max-age=0');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
}

function respond(int $status, bool $ok, string $message, string $requestId): never {
    http_response_code($status);
    security_headers();
    if (wants_json()) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($ok ? ['ok' => true, 'request_id' => $requestId] : ['ok' => false, 'error' => $message], JSON_UNESCAPED_SLASHES);
        exit;
    }
    header('Content-Type: text/html; charset=utf-8');
    $title = $ok ? 'Request received' : 'Please try again';
    $copy = $ok ? 'Your request is saved. We will reply soon.' : 'We could not save your request. Return to the form or email hello@assistall.ai.';
    echo '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . $title . ' — Assistall AI</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E3A3D;color:#FFFDF8;font:18px/1.6 Aptos,"Segoe UI",Arial,sans-serif}.card{width:min(38rem,calc(100% - 3rem));padding:2.5rem;border:1px solid #C8A25D;border-radius:18px}.mark{width:54px;border-radius:10px}h1{font-size:clamp(2.3rem,7vw,4.5rem);line-height:1;margin:.7rem 0}a{color:#172A2C;background:#C8A25D;padding:.8rem 1rem;border-radius:9px;text-decoration:none;font-weight:700;display:inline-block;margin-top:1rem}</style><main class="card"><img class="mark" src="assets/apple-touch-icon.png" alt=""><h1>' . $title . '</h1><p>' . $copy . '</p><a href="/#demo">Return to Assistall</a></main></html>';
    exit;
}

function log_code(string $requestId, string $code): void {
    error_log(json_encode(['request_id' => $requestId, 'code' => $code], JSON_UNESCAPED_SLASHES));
}

function clean_text(mixed $value): string {
    return trim((string)($value ?? ''));
}

function text_length(string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function same_origin_request(): bool {
    $host = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '') return false;
    $fetchSite = strtolower($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '');
    if ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'none'], true)) return false;
    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $header) {
        $value = $_SERVER[$header] ?? '';
        if ($value === '') continue;
        $sourceHost = strtolower((string)parse_url($value, PHP_URL_HOST));
        if ($sourceHost === '' || !hash_equals($host, $sourceHost)) return false;
    }
    return true;
}

function visitor_ip(array $config): string {
    if (($config['trust_cloudflare_proxy'] ?? false) === true && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $candidate = trim((string)$_SERVER['HTTP_CF_CONNECTING_IP']);
        if (filter_var($candidate, FILTER_VALIDATE_IP)) return $candidate;
    }
    $candidate = trim((string)($_SERVER['REMOTE_ADDR'] ?? ''));
    return filter_var($candidate, FILTER_VALIDATE_IP) ? $candidate : '0.0.0.0';
}

function post_form(string $url, array $fields, int $timeout = 8): ?array {
    if (!function_exists('curl_init')) return null;
    $handle = curl_init($url);
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($fields),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $body = curl_exec($handle);
    $status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    if (!is_string($body) || $status < 200 || $status >= 300) return null;
    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : null;
}

function post_signed_json(string $url, string $body, string $timestamp, string $requestId, string $secret): ?array {
    if (!function_exists('curl_init') || !str_starts_with($url, 'https://')) return null;
    $signature = hash_hmac('sha256', $timestamp . '.' . $requestId . '.' . $body, $secret);
    $handle = curl_init($url);
    curl_setopt_array($handle, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json',
            'User-Agent: Assistall-Website/1.0',
            'X-Assistall-Timestamp: ' . $timestamp,
            'X-Assistall-Request-Id: ' . $requestId,
            'X-Assistall-Signature: ' . $signature,
        ],
    ]);
    $response = curl_exec($handle);
    $status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    curl_close($handle);
    if (!is_string($response)) return null;
    $decoded = json_decode($response, true);
    if (!is_array($decoded)) return null;
    $decoded['_http_status'] = $status;
    return $decoded;
}

$requestId = request_id();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'request_rejected', $requestId);
}

$length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($length <= 0 || $length > MAX_REQUEST_BYTES) respond(413, false, 'request_rejected', $requestId);
if (!same_origin_request()) {
    log_code($requestId, 'cross_origin');
    respond(403, false, 'request_rejected', $requestId);
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType === 'application/json') {
    $raw = file_get_contents('php://input', false, null, 0, MAX_REQUEST_BYTES + 1);
    if (!is_string($raw) || strlen($raw) > MAX_REQUEST_BYTES) respond(413, false, 'request_rejected', $requestId);
    $payload = json_decode($raw, true);
    if (!is_array($payload)) respond(400, false, 'check_your_details', $requestId);
} elseif ($contentType === 'application/x-www-form-urlencoded') {
    $payload = $_POST;
} else {
    respond(415, false, 'request_rejected', $requestId);
}

$secretsPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.assistall-secrets.php';
$config = is_file($secretsPath) ? require $secretsPath : null;
if (!is_array($config)) {
    log_code($requestId, 'missing_configuration');
    respond(503, false, 'temporarily_unavailable', $requestId);
}

$name = clean_text($payload['name'] ?? '');
$email = strtolower(clean_text($payload['email'] ?? ''));
$company = clean_text($payload['company'] ?? '');
$workNeed = clean_text($payload['work_need'] ?? '');
$honeypot = clean_text($payload['website'] ?? '');
$startedAt = (int)clean_text($payload['started_at'] ?? '0');
$turnstileToken = clean_text($payload['cf-turnstile-response'] ?? '');
$now = (int)round(microtime(true) * 1000);

$valid = $honeypot === ''
    && text_length($name) >= 1 && text_length($name) <= 100
    && text_length($email) >= 3 && text_length($email) <= 254
    && filter_var($email, FILTER_VALIDATE_EMAIL) !== false
    && !preg_match('/[\r\n]/', $email)
    && text_length($company) >= 1 && text_length($company) <= 160
    && text_length($workNeed) >= 1 && text_length($workNeed) <= 2000
    && $startedAt > 0 && ($now - $startedAt) >= 3000 && ($now - $startedAt) <= 86400000
    && text_length($turnstileToken) >= 1 && text_length($turnstileToken) <= 2048;
if (!$valid) {
    log_code($requestId, $honeypot !== '' ? 'honeypot' : 'invalid_payload');
    respond(422, false, 'check_your_details', $requestId);
}

$remoteIp = visitor_ip($config);
$turnstile = post_form('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
    'secret' => (string)($config['turnstile_secret'] ?? ''),
    'response' => $turnstileToken,
    'remoteip' => $remoteIp,
    'idempotency_key' => $requestId,
]);
$allowedHosts = array_map('strtolower', (array)($config['turnstile_hostnames'] ?? ['assistall.ai', 'www.assistall.ai']));
$turnstileHost = strtolower((string)($turnstile['hostname'] ?? ''));
if (($turnstile['success'] ?? false) !== true
    || !in_array($turnstileHost, $allowedHosts, true)
    || ($turnstile['action'] ?? '') !== 'demo') {
    log_code($requestId, 'turnstile_rejected');
    respond(403, false, 'request_rejected', $requestId);
}

$internalBody = json_encode([
    'name' => $name,
    'email' => $email,
    'company' => $company,
    'work_need' => $workNeed,
    'ip' => $remoteIp,
    'source' => 'assistall.ai',
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if (!is_string($internalBody)) respond(500, false, 'temporarily_unavailable', $requestId);

$timestamp = (string)$now;
$ingest = post_signed_json(
    (string)($config['supabase_function_url'] ?? ''),
    $internalBody,
    $timestamp,
    $requestId,
    (string)($config['website_hmac_secret'] ?? '')
);
if (($ingest['ok'] ?? false) !== true) {
    $status = (int)($ingest['_http_status'] ?? 503);
    log_code($requestId, $status === 429 ? 'rate_limited' : 'ingest_rejected');
    respond($status === 429 ? 429 : 503, false, $status === 429 ? 'request_rejected' : 'temporarily_unavailable', $requestId);
}

$safeName = str_replace(["\r", "\n"], ' ', $name);
$safeCompany = str_replace(["\r", "\n"], ' ', $company);
$mailBody = "New Assistall demo request\n\nRequest ID: {$requestId}\nName: {$safeName}\nEmail: {$email}\nCompany: {$safeCompany}\n\nWork slowing the team down:\n{$workNeed}\n";
$mailHeaders = [
    'From: Assistall Website <no-reply@assistall.ai>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
    'X-Assistall-Request-Id: ' . $requestId,
];
if (!@mail('hello@assistall.ai', 'New Assistall demo request', $mailBody, implode("\r\n", $mailHeaders))) {
    log_code($requestId, 'email_failed_lead_saved');
} else {
    log_code($requestId, 'accepted');
}
respond(201, true, 'accepted', $requestId);
