<?php
declare(strict_types=1);

/**
 * Diagnostic intake — receives a self-diagnostic report from the Assistall
 * desktop app and emails it to the support inbox.
 *
 * Threat model: the report is verdicts and counts only, redacted twice before it
 * ever reaches here, so it carries no client data by design. The real risks are
 * therefore abuse of the endpoint — spam/DoS to the support inbox, email header
 * injection, forged or replayed requests — and the rare case where a report
 * arrives with something sensitive in it. Controls, in order of importance:
 *   1. Server-side redaction re-scan: never email a report that still looks
 *      sensitive, and never one whose own redaction_clean flag is not true.
 *   2. Fixed recipients, hardcoded — never taken from the request.
 *   3. Email header-injection proof: the body is plain text, every value
 *      stripped of CR/LF; subject is a constant.
 *   4. HMAC signature + timestamp window + single-use nonce: reject forged,
 *      unsigned, stale or replayed traffic. (On a distributed client the secret
 *      is a first filter and integrity check, not a true auth boundary.)
 *   5. Rate limiting per IP and globally.
 *   6. Strict method / size / content-type / schema validation.
 *   7. Secrets outside the web root; no report content is persisted.
 */

const MAX_REQUEST_BYTES = 32768;
const TIMESTAMP_WINDOW_SECONDS = 300;
const RATE_LIMIT_PER_IP_PER_HOUR = 10;
const RATE_LIMIT_GLOBAL_PER_DAY = 500;

function request_id(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20));
}

function security_headers(): void {
    header('Cache-Control: no-store, max-age=0');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}

function respond(int $status, bool $ok, string $message, string $requestId): never {
    http_response_code($status);
    security_headers();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($ok ? ['ok' => true, 'request_id' => $requestId] : ['ok' => false, 'error' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

function log_code(string $requestId, string $code): void {
    error_log(json_encode(['endpoint' => 'diagnostic-intake', 'request_id' => $requestId, 'code' => $code], JSON_UNESCAPED_SLASHES));
}

function visitor_ip(array $config): string {
    if (($config['trust_cloudflare_proxy'] ?? false) === true && !empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $candidate = trim((string)$_SERVER['HTTP_CF_CONNECTING_IP']);
        if (filter_var($candidate, FILTER_VALIDATE_IP)) return $candidate;
    }
    $candidate = trim((string)($_SERVER['REMOTE_ADDR'] ?? ''));
    return filter_var($candidate, FILTER_VALIDATE_IP) ? $candidate : '0.0.0.0';
}

/** A writable directory outside the web root for rate-limit and nonce state. */
function state_dir(array $config): string {
    $dir = (string)($config['diagnostic_state_dir'] ?? '');
    if ($dir === '' || !is_dir($dir) || !is_writable($dir)) {
        $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'assistall-diagnostic';
        if (!is_dir($dir)) @mkdir($dir, 0700, true);
    }
    return $dir;
}

/** Strip anything that still looks like an email, a Windows/UNC path, or a
 *  credential assignment. Mirrors the app-side redactor: this is the last gate
 *  before the report is emailed. */
function redact(string $text): string {
    $text = preg_replace('/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/', '[email]', $text) ?? $text;
    $text = preg_replace('/\b[A-Za-z]:\\\\[^\s"\']+/', '[path]', $text) ?? $text;
    $text = preg_replace('/\\\\\\\\[^\s"\']+/', '[path]', $text) ?? $text;
    $text = preg_replace('/(?i)(password|pass|token|secret|api[_ -]?key)\s*[:=]\s*[^\s,;]+/', '$1=[redacted]', $text) ?? $text;
    return $text;
}

/** True if the text STILL contains something sensitive after redaction. */
function has_leak(string $text): bool {
    return (bool)preg_match('/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/', $text)
        || (bool)preg_match('/\b[A-Za-z]:\\\\[^\s"\']+/', $text)
        || (bool)preg_match('/\\\\\\\\[^\s"\']+/', $text);
}

/** One-line, injection-proof value for an email body. */
function safe_line(string $value, int $max = 400): string {
    $value = str_replace(["\r", "\n", "\0"], ' ', $value);
    return mb_substr($value, 0, $max, 'UTF-8');
}

// ── request gate ────────────────────────────────────────────────────────────
$requestId = request_id();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'request_rejected', $requestId);
}
$length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($length <= 0 || $length > MAX_REQUEST_BYTES) respond(413, false, 'request_rejected', $requestId);
$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') respond(415, false, 'request_rejected', $requestId);

$secretsPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.assistall-secrets.php';
$config = is_file($secretsPath) ? require $secretsPath : null;
$secret = is_array($config) ? (string)($config['diagnostic_hmac_secret'] ?? '') : '';
if ($secret === '') {
    log_code($requestId, 'missing_configuration');
    respond(503, false, 'temporarily_unavailable', $requestId);
}

$raw = file_get_contents('php://input', false, null, 0, MAX_REQUEST_BYTES + 1);
if (!is_string($raw) || $raw === '' || strlen($raw) > MAX_REQUEST_BYTES) respond(413, false, 'request_rejected', $requestId);

// ── signature, timestamp window, single-use nonce ───────────────────────────
$timestamp = (string)($_SERVER['HTTP_X_ASSISTALL_TIMESTAMP'] ?? '');
$nonce = (string)($_SERVER['HTTP_X_ASSISTALL_NONCE'] ?? '');
$signature = (string)($_SERVER['HTTP_X_ASSISTALL_SIGNATURE'] ?? '');
if (!ctype_digit($timestamp) || !preg_match('/^[a-f0-9]{16,64}$/', $nonce) || !preg_match('/^[a-f0-9]{64}$/', $signature)) {
    log_code($requestId, 'bad_auth_headers');
    respond(400, false, 'request_rejected', $requestId);
}
if (abs(time() - (int)$timestamp) > TIMESTAMP_WINDOW_SECONDS) {
    log_code($requestId, 'stale_timestamp');
    respond(403, false, 'request_rejected', $requestId);
}
$expected = hash_hmac('sha256', $timestamp . '.' . $nonce . '.' . $raw, $secret);
if (!hash_equals($expected, $signature)) {
    log_code($requestId, 'bad_signature');
    respond(403, false, 'request_rejected', $requestId);
}

$stateDir = state_dir(is_array($config) ? $config : []);
// Single-use nonce: reject a replayed body even inside the timestamp window.
// Exclusive create ('x') is atomic, so two concurrent identical requests cannot
// both slip through a check-then-write race.
$nonceFile = $stateDir . DIRECTORY_SEPARATOR . 'nonce_' . preg_replace('/[^a-f0-9]/', '', $nonce);
$nonceHandle = @fopen($nonceFile, 'x');
if ($nonceHandle === false) {
    log_code($requestId, 'replayed_nonce');
    respond(409, false, 'request_rejected', $requestId);
}
@fwrite($nonceHandle, (string)time());
@fclose($nonceHandle);
// Opportunistic cleanup of nonces older than the window.
foreach (glob($stateDir . DIRECTORY_SEPARATOR . 'nonce_*') ?: [] as $old) {
    if (@filemtime($old) < time() - (TIMESTAMP_WINDOW_SECONDS * 2)) @unlink($old);
}

// ── rate limiting (per IP + global), file-based with locking ────────────────
function rate_hit(string $stateDir, string $key, int $limit, int $windowSeconds): bool {
    $file = $stateDir . DIRECTORY_SEPARATOR . 'rl_' . preg_replace('/[^a-z0-9_]/i', '_', $key);
    $now = time();
    $handle = @fopen($file, 'c+');
    if ($handle === false) return true; // fail open on storage error rather than lose the report
    flock($handle, LOCK_EX);
    $data = json_decode((string)stream_get_contents($handle), true);
    $hits = (is_array($data) && ($data['reset'] ?? 0) > $now) ? (array)$data : ['count' => 0, 'reset' => $now + $windowSeconds];
    $hits['count'] = (int)$hits['count'] + 1;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($hits));
    flock($handle, LOCK_UN);
    fclose($handle);
    return $hits['count'] <= $limit;
}
$remoteIp = visitor_ip(is_array($config) ? $config : []);
$ipKey = 'ip_' . substr(hash('sha256', $remoteIp . ($secret)), 0, 24);
if (!rate_hit($stateDir, $ipKey, RATE_LIMIT_PER_IP_PER_HOUR, 3600)
    || !rate_hit($stateDir, 'global', RATE_LIMIT_GLOBAL_PER_DAY, 86400)) {
    log_code($requestId, 'rate_limited');
    respond(429, false, 'request_rejected', $requestId);
}

// ── strict schema validation ────────────────────────────────────────────────
$payload = json_decode($raw, true);
if (!is_array($payload)) respond(400, false, 'request_rejected', $requestId);
$allowedTop = ['app_version', 'summary', 'passed', 'total', 'all_ok', 'redaction_clean', 'checks'];
foreach (array_keys($payload) as $key) {
    if (!in_array($key, $allowedTop, true)) respond(422, false, 'request_rejected', $requestId);
}
$checks = $payload['checks'] ?? null;
if (($payload['redaction_clean'] ?? null) !== true
    || !is_array($checks) || count($checks) === 0 || count($checks) > 40
    || !is_int($payload['passed'] ?? null) || !is_int($payload['total'] ?? null)) {
    respond(422, false, 'request_rejected', $requestId);
}

// ── build the email body; redact once more and refuse on any leak ───────────
$appVersion = safe_line((string)($payload['app_version'] ?? 'unknown'), 32);
$summary = safe_line(redact((string)($payload['summary'] ?? '')), 200);
$lines = ["Assistall self-diagnostic report", "", "Request ID: {$requestId}", "App version: {$appVersion}", "Summary: {$summary}", ""];
foreach ($checks as $check) {
    if (!is_array($check)) respond(422, false, 'request_rejected', $requestId);
    $name = safe_line((string)($check['name'] ?? ''), 60);
    $ok = ($check['ok'] ?? null) === true ? 'PASS' : 'REVIEW';
    $detailRaw = redact((string)($check['detail'] ?? ''));
    if (has_leak($detailRaw) || has_leak($name)) {
        log_code($requestId, 'leak_detected_refused');
        respond(422, false, 'request_rejected', $requestId);
    }
    $lines[] = "[{$ok}] {$name}: " . safe_line($detailRaw, 400);
}
$body = implode("\n", $lines) . "\n";

// ── email to FIXED recipients only ──────────────────────────────────────────
$to = (string)($config['diagnostic_recipient'] ?? 'admin@assistall.ai');
$cc = (string)($config['diagnostic_recipient_cc'] ?? 'kinanh4@gmail.com');
if (!filter_var($to, FILTER_VALIDATE_EMAIL)) $to = 'admin@assistall.ai';
$headers = [
    'From: Assistall Diagnostics <no-reply@assistall.ai>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Assistall-Request-Id: ' . $requestId,
];
if (filter_var($cc, FILTER_VALIDATE_EMAIL)) $headers[] = 'Cc: ' . $cc;
$sent = @mail($to, 'Assistall self-diagnostic report', $body, implode("\r\n", $headers));
log_code($requestId, $sent ? 'accepted' : 'email_failed');
if (!$sent) respond(502, false, 'temporarily_unavailable', $requestId);
respond(201, true, 'accepted', $requestId);
