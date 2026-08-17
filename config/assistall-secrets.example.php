<?php
// Copy this file to /home/YOUR_CPANEL_USER/.assistall-secrets.php.
// Keep the real file outside public_html and outside the Git repository.
return [
    'turnstile_secret' => 'replace-with-cloudflare-turnstile-secret',
    'turnstile_hostnames' => ['assistall.ai', 'www.assistall.ai'],
    'supabase_function_url' => 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-ingest',
    'website_hmac_secret' => 'replace-with-at-least-32-random-bytes',
    // Enable only after the origin accepts traffic solely from Cloudflare.
    'trust_cloudflare_proxy' => false,
];
