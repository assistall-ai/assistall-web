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

// Cloudflare's published edge server ranges (https://www.cloudflare.com/ips/, checked 21 October 2026).
// Review them if Cloudflare announces a change.
const CLOUDFLARE_RANGES = [
    '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
    '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
    '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
    '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
    '2a06:98c0::/29', '2c0f:f248::/32',
];

/** Whether a valid IPv4 or IPv6 address falls inside a CIDR range. */
function ip_in_range(string $ip, string $cidr): bool {
    [$subnet, $bits] = explode('/', $cidr, 2);
    $address = inet_pton($ip);
    $network = inet_pton($subnet);
    if ($address === false || $network === false || strlen($address) !== strlen($network)) return false;
    $bits = (int)$bits;
    $whole = intdiv($bits, 8);
    if ($whole > 0 && strncmp($address, $network, $whole) !== 0) return false;
    $rest = $bits % 8;
    if ($rest === 0) return true;
    $mask = (0xFF << (8 - $rest)) & 0xFF;
    return (ord($address[$whole]) & $mask) === (ord($network[$whole]) & $mask);
}

function from_cloudflare(string $ip): bool {
    foreach (CLOUDFLARE_RANGES as $range) {
        if (ip_in_range($ip, $range)) return true;
    }
    return false;
}

/**
 * The visitor's address. Behind Cloudflare the connection comes from a Cloudflare server and the
 * visitor's real address arrives in CF-Connecting-IP. That header is trusted only when the request
 * really comes from a Cloudflare server, so anyone reaching the origin directly cannot forge it.
 * (If the host already restores the visitor's address into REMOTE_ADDR, that is used as it is.)
 */
function visitor_ip(array $config): string {
    $peer = trim((string)($_SERVER['REMOTE_ADDR'] ?? ''));
    if (!filter_var($peer, FILTER_VALIDATE_IP)) return '0.0.0.0';
    if (from_cloudflare($peer)) {
        $candidate = trim((string)($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''));
        if (filter_var($candidate, FILTER_VALIDATE_IP)) return $candidate;
    }
    return $peer;
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

const LEAD_NOTIFY_DEFAULT_RECIPIENT = 'hello@assistall.ai';
const LEAD_NOTIFY_SUBJECT = 'New Assistall demo request';

/** One-line value for an email: no line breaks or NUL bytes. */
function safe_line(string $value): string {
    return str_replace(["\r", "\n", "\0"], ' ', $value);
}

/**
 * The new-lead alert. The recipient comes only from the secrets file ('lead_notify_recipient'),
 * never from the request; the subject is fixed; every short field is a single line; and nothing
 * else from the configuration reaches the message.
 */
function lead_notification(array $config, string $requestId, string $name, string $email, string $company, string $workNeed): array {
    $to = trim((string)($config['lead_notify_recipient'] ?? ''));
    if (filter_var($to, FILTER_VALIDATE_EMAIL) === false) $to = LEAD_NOTIFY_DEFAULT_RECIPIENT;
    $body = "New Assistall demo request\n\n"
        . 'Request ID: ' . safe_line($requestId) . "\n"
        . 'Name: ' . safe_line($name) . "\n"
        . 'Email: ' . safe_line($email) . "\n"
        . 'Company: ' . safe_line($company) . "\n\n"
        . "Work slowing the team down:\n"
        . str_replace(["\r\n", "\r", "\0"], ["\n", "\n", ''], $workNeed) . "\n\n"
        . "The full record is in Supabase (public.demo_requests). Reply to this email to answer the visitor.\n";
    $headers = [
        'From: Assistall Website <no-reply@assistall.ai>',
        'Reply-To: ' . safe_line($email),
        'Content-Type: text/plain; charset=UTF-8',
        'X-Assistall-Request-Id: ' . safe_line($requestId),
    ];
    return ['to' => $to, 'subject' => LEAD_NOTIFY_SUBJECT, 'body' => $body, 'headers' => implode("\r\n", $headers)];
}

/**
 * Runs at shutdown, after respond() has sent the 201. Where the host supports it (PHP-FPM or
 * LiteSpeed) the visitor's connection is finished first, so a slow or broken mail server never
 * delays or fails the submission. The lead is already saved; a failed alert only logs a code.
 */
function send_lead_notification(array $config, string $requestId, string $name, string $email, string $company, string $workNeed): void {
    try {
        if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
        elseif (function_exists('litespeed_finish_request')) litespeed_finish_request();
        $message = lead_notification($config, $requestId, $name, $email, $company, $workNeed);
        $sent = @mail($message['to'], $message['subject'], $message['body'], $message['headers']);
        log_code($requestId, $sent ? 'lead_notified' : 'lead_notify_failed');
    } catch (\Throwable) {
        log_code($requestId, 'lead_notify_failed');
    }
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

// The lead is saved. The alert email is sent only now, and only after the visitor has their answer.
log_code($requestId, 'accepted');
register_shutdown_function('send_lead_notification', $config, $requestId, $name, $email, $company, $workNeed);
respond(201, true, 'accepted', $requestId);
