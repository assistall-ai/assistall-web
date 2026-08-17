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

    // diagnostic-intake.php — receives self-diagnostic reports from the app.
    // Must match WADIH_AI_DIAGNOSTIC_SECRET baked into the app build.
    'diagnostic_hmac_secret' => 'replace-with-at-least-32-random-bytes',
    // Where diagnostic reports are emailed. Recipients are never taken from the
    // request; these are the only addresses the endpoint will ever send to.
    'diagnostic_recipient' => 'admin@assistall.ai',
    'diagnostic_recipient_cc' => 'kinanh4@gmail.com',
    // Optional writable directory (outside public_html) for rate-limit and nonce
    // state. Falls back to the system temp directory when unset.
    'diagnostic_state_dir' => '',
];
