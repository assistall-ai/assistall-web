param(
  [ValidateSet('contract-review', 'shipment-review', 'report-preparation', 'all')]
  [string]$Workflow = 'all',
  [Parameter(Mandatory)] [string]$AppRoot,
  [Parameter(Mandatory)] [string]$OutputRoot,
  [string]$PythonPath = ''
)

$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $PSScriptRoot
$resolvedAppRoot = (Resolve-Path -LiteralPath $AppRoot).Path
$resolvedOutputRoot = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputRoot))
$captureData = Join-Path ([System.IO.Path]::GetTempPath()) ('assistall-capture-' + [guid]::NewGuid())
$rawVideoRoot = Join-Path $captureData 'raw-videos'
$workflows = if ($Workflow -eq 'all') { @('contract-review', 'shipment-review', 'report-preparation') } else { @($Workflow) }

if (-not $PythonPath) {
  $candidates = @(
    (Join-Path $resolvedAppRoot 'venv\Scripts\python.exe'),
    (Join-Path (Split-Path -Parent (Split-Path -Parent $resolvedAppRoot)) 'venv\Scripts\python.exe')
  )
  $PythonPath = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $PythonPath -or -not (Test-Path -LiteralPath $PythonPath)) { throw 'A Python runtime with Playwright is required.' }
foreach ($tool in @('ffmpeg.exe', 'ffprobe.exe')) { if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "$tool is required." } }

$environmentBackup = @{}
foreach ($name in @('WADIH_AI_DATA_DIR', 'SENTINEL_DB', 'DESK_CONFIG', 'DESK_PORT')) { $environmentBackup[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$server = $null
try {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $listener.Start(); $port = $listener.LocalEndpoint.Port; $listener.Stop()
  $env:WADIH_AI_DATA_DIR = $captureData
  $env:SENTINEL_DB = Join-Path $captureData 'inbox_sentinel.db'
  $env:DESK_CONFIG = Join-Path $captureData 'desk_config.enc'
  $env:DESK_PORT = [string]$port
  & $PythonPath (Join-Path $resolvedAppRoot 'approval_desk.py') 'seed-capture-fixtures'
  if ($LASTEXITCODE -ne 0) { throw 'Synthetic fixture seeding failed.' }
  $server = Start-Process -FilePath $PythonPath -ArgumentList @('approval_desk.py', 'serve') -WorkingDirectory $resolvedAppRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $captureData 'server.out.log') -RedirectStandardError (Join-Path $captureData 'server.err.log')
  $baseUrl = "http://127.0.0.1:$port"
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try { if ((Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/setup/status" -TimeoutSec 2).StatusCode -eq 200) { $ready = $true; break } } catch {}
    Start-Sleep -Milliseconds 500
  }
  if (-not $ready) { throw 'The disposable loopback app did not start.' }
  New-Item -ItemType Directory -Force -Path $resolvedOutputRoot | Out-Null
  foreach ($item in $workflows) {
    $rawDir = Join-Path $rawVideoRoot $item
    $result = & $PythonPath (Join-Path $siteRoot 'tools\capture_workflow_media.py') --base-url $baseUrl --workflow $item --video-dir $rawDir | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0 -or -not $result.video_path) { throw "Playwright did not record $item." }
    $mp4 = Join-Path $resolvedOutputRoot "$item.mp4"
    $poster = Join-Path $resolvedOutputRoot "$item.png"
    & ffmpeg.exe -v error -y -i $result.video_path -t 6 -c:v libx264 -profile:v baseline -pix_fmt yuv420p -movflags +faststart -an $mp4
    if ($LASTEXITCODE -ne 0) { throw "FFmpeg could not encode $item." }
    & ffmpeg.exe -v error -y -ss 1 -i $mp4 -frames:v 1 $poster
    if ($LASTEXITCODE -ne 0) { throw "FFmpeg could not create the $item poster." }
    & ffprobe.exe -v error -show_entries format=duration -of default=noprint_wrappers=1 $mp4
  }
}
finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
  foreach ($name in $environmentBackup.Keys) { [Environment]::SetEnvironmentVariable($name, $environmentBackup[$name], 'Process') }
  if (Test-Path -LiteralPath $captureData) { Remove-Item -LiteralPath $captureData -Recurse -Force }
}
