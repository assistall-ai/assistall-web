<?php
// Copy this file to /home/YOUR_CPANEL_USER/.assistall-secrets.php.
// Keep the real file outside public_html and outside the Git repository.
return [
    'turnstile_secret' => 'replace-with-cloudflare-turnstile-secret',
    'turnstile_hostnames' => ['assistall.ai', 'www.assistall.ai'],
    'supabase_function_url' => 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/demo-ingest',
    'website_hmac_secret' => 'replace-with-at-least-32-random-bytes',
    // The visitor's address behind Cloudflare is handled in code: CF-Connecting-IP is trusted only
    // from Cloudflare's own servers. The old 'trust_cloudflare_proxy' setting is no longer read.
    // demo-request.php — where the "New Assistall demo request" alert is emailed once a lead is
    // saved in Supabase. Never taken from the request. Falls back to hello@assistall.ai when unset.
    'lead_notify_recipient' => 'you@example.com',

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
