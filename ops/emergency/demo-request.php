<?php
declare(strict_types=1);

http_response_code(503);
header('Retry-After: 3600');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => false, 'error' => 'temporarily_unavailable'], JSON_UNESCAPED_SLASHES);
