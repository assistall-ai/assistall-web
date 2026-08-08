$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $root 'index.html'
$cssPath = Join-Path $root 'assets/page.css'
$html = Get-Content -LiteralPath $htmlPath -Raw
$css = Get-Content -LiteralPath $cssPath -Raw

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

$h1Count = [regex]::Matches($html, '(?is)<h1\b').Count
Assert-True ($h1Count -eq 1) "Expected exactly one h1; found $h1Count."

$requiredAssets = @(
  'assets/apple-touch-icon.png',
  'assets/media/workspace-limestone.png',
  'assets/media/workspace-cobalt.png',
  'assets/media/workspace-theme-comparison.png',
  'assets/media/workspace-theme-comparison.mp4'
)

foreach ($asset in $requiredAssets) {
  Assert-True (Test-Path -LiteralPath (Join-Path $root $asset)) "Missing required asset: $asset"
}

$externalSource = '(?is)\b(?:src|href)\s*=\s*["'']https?://(?!(?:www\.)?assistall\.ai(?:[/:]|["'']))'
Assert-True (-not [regex]::IsMatch($html, $externalSource)) 'External page resource found. The public page must not load third-party assets.'

Assert-True ($html -match 'workspace-theme-comparison\.mp4') 'Theme comparison video is not referenced.'
Assert-True ($css -match 'prefers-reduced-motion') 'Reduced-motion fallback is not present in the page stylesheet.'

Write-Output 'SITE_CHECK_PASSED'
