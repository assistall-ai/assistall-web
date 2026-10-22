$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$html = Get-Content -LiteralPath (Join-Path $root 'index.html') -Raw
$css = Get-Content -LiteralPath (Join-Path $root 'assets/page.css') -Raw
$script = Get-Content -LiteralPath (Join-Path $root 'assets/site.js') -Raw
$php = Get-Content -LiteralPath (Join-Path $root 'demo-request.php') -Raw
$headers = Get-Content -LiteralPath (Join-Path $root '.htaccess') -Raw
$migration = Get-Content -LiteralPath (Join-Path $root 'supabase/migrations/20260816000100_create_website_demo_leads.sql') -Raw
$edgeFunction = Get-Content -LiteralPath (Join-Path $root 'supabase/functions/demo-ingest/index.ts') -Raw

function Assert-True {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { throw $Message }
}

$h1Count = [regex]::Matches($html, '(?is)<h1\b').Count
Assert-True ($h1Count -eq 1) "Expected exactly one h1; found $h1Count."

$requiredFiles = @(
  'assets/apple-touch-icon.png',
  'assets/media/showcase/flow-connect.webp',
  'assets/media/showcase/cap-inbox.webp',
  'assets/media/workflows/build-a-workflow.mp4',
  'assets/media/workflows/ready-made-workflow.mp4',
  'assets/media/workflows/approve-a-run.mp4',
  'assets/media/workflows/company-board.mp4',
  'assets/media/workflows/reply-approval.mp4',
  'assets/site.js',
  'demo-request.php',
  'privacy.html',
  'security.html',
  '.well-known/security.txt',
  '.htaccess',
  '.user.ini',
  'config/assistall-secrets.example.php',
  'supabase/functions/demo-ingest/index.ts',
  'supabase/functions/demo-ingest/validation.js',
  'supabase/migrations/20260816000100_create_website_demo_leads.sql'
)
foreach ($file in $requiredFiles) {
  Assert-True (Test-Path -LiteralPath (Join-Path $root $file)) "Missing required file: $file"
}

$externalSource = '(?is)\b(?:src|href)\s*=\s*["'']https?://(?!(?:www\.)?assistall\.ai(?:[/:]|["'']))'
Assert-True (-not [regex]::IsMatch($html, $externalSource)) 'Unexpected third-party page asset found. Turnstile must load only through the controlled script integration.'

foreach ($id in @('how-it-works', 'capabilities', 'connections', 'product', 'human-value', 'trust', 'demo')) {
  Assert-True ($html -match ('id=["'']' + [regex]::Escape($id) + '["'']')) "Missing continuous-story section: $id"
}
Assert-True ($html -match 'data-connector-mark="microsoft"') 'The stable connector marks are not mounted.'
Assert-True (-not ($html -match 'connector-icons\.svg|<use\b|textLength=')) 'A distorted external connector sprite remains on the page.'
Assert-True ($html -match 'data-workflow-evidence') 'The Living Work Queue is not mounted.'
foreach ($workflow in @('build', 'library', 'approve', 'board', 'reply')) {
  Assert-True ($html -match ('data-workflow-tab=["'']' + [regex]::Escape($workflow) + '["'']')) "Missing workflow tab marker: $workflow"
  Assert-True ($html -match ('data-workflow-panel=["'']' + [regex]::Escape($workflow) + '["'']')) "Missing workflow panel marker: $workflow"
}
Assert-True (([regex]::Matches($html, 'data-workflow-video')).Count -eq 5) 'The Living Work Queue must include the five recorded clips.'
Assert-True ($html -match 'data-hero-signal') 'The hero signal scene is not mounted.'
Assert-True ($html -match 'data-hero-hub') 'The hero hub is not mounted.'
Assert-True ($html -match 'data-scroll-link') 'Section navigation has no slow-glide marker.'
Assert-True ($script -match 'calculateScrollDuration') 'Section glide script is not present.'
Assert-True ($script -match 'planHeroSignals') 'Hero signal lines are not planned.'
Assert-True ($script -match 'heroSignalSchedule') 'Hero light timetable is not present.'
Assert-True ($css -match '\.hero-hub \{') 'The hero hub has no styling.'
Assert-True (-not ($script -match 'hero-engine__face|foreignObject|hero-engine__(?:orbit|intake)')) 'A removed 3D cube, intake hole or orbit remains in the hero.'
Assert-True (-not ($script -match 'syncHeroLayers|getScreenCTM|HERO_OUTPUT_BOUNDS')) 'The removed hybrid hero coordinate bridge remains in the renderer.'
Assert-True ($script -match 'heroSignalState') 'The hero signal state is missing.'
Assert-True ($script -match 'hero-signal__line') 'The hero signal lines are missing.'
Assert-True ($css -match 'hero-signal__pulses { filter: drop-shadow') 'The hero light glow is missing.'
Assert-True ($css -match 'hero__film') 'The translucent teal readability film is missing.'
Assert-True ($script -match 'enableWorkflowEvidence') 'The workflow evidence controller is not present.'
Assert-True ($script -match "addEventListener\('ended'") 'Clips do not hand over to the next one when they end.'
Assert-True ($script -match 'shouldRotateWorkflow') 'Workflow rotation guards are not present.'
Assert-True ($script -match 'enableConnectorKeyboardScroll') 'Connector keyboard scrolling is not wired.'
Assert-True ($script -match 'getConnectorScrollTarget') 'Connector keyboard scroll bounds are not present.'
Assert-True ($css -match 'prefers-reduced-motion') 'Reduced-motion fallback is not present.'

Assert-True ($html -match 'assistall-turnstile-sitekey') 'The public Turnstile site-key mount is missing.'
Assert-True ($html -match 'data-turnstile-widget') 'The Turnstile form slot is missing.'
Assert-True ($script -match 'challenges\.cloudflare\.com/turnstile/v0/api\.js') 'Managed Turnstile is not loaded.'
Assert-True ($php -match 'MAX_REQUEST_BYTES') 'The form endpoint has no body-size limit.'
Assert-True ($php -match 'same_origin_request') 'The form endpoint has no same-origin gate.'
Assert-True ($php -match 'hash_hmac') 'The form endpoint does not sign the Edge Function request.'
Assert-True ($php -match 'dirname\(__DIR__\).*\.assistall-secrets\.php') 'Secrets are not loaded from outside public_html.'
Assert-True ($headers -match 'Content-Security-Policy') 'Content Security Policy is missing.'
Assert-True ($headers -match "frame-ancestors 'none'") 'Clickjacking protection is missing from CSP.'
Assert-True ($migration -match 'force row level security') 'Forced RLS is missing.'
Assert-True ($migration -match 'revoke all on table public\.demo_requests from public, anon, authenticated') 'Browser roles were not revoked from demo requests.'
Assert-True (-not ($migration -match 'create policy')) 'Public-facing database policies must not be created for private lead tables.'
Assert-True ($edgeFunction -match 'verifyHmacSignature') 'The Edge Function does not verify the cPanel signature.'
Assert-True ($edgeFunction -match 'hashIdentifier') 'The Edge Function does not hash abuse identifiers.'

$publicSurface = $html + "`n" + $script + "`n" + $css
foreach ($secretMarker in @('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'turnstile_secret', 'website_hmac_secret')) {
  Assert-True (-not ($publicSurface -match [regex]::Escape($secretMarker))) "Secret marker exposed in public page assets: $secretMarker"
}

Write-Output 'SITE_CHECK_PASSED'
