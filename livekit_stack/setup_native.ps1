# setup_native.ps1 - Native Windows LiveKit Setup (No-Docker)
$ErrorActionPreference = "Stop"

# 1. Download and Extract LiveKit Server Binary
$livekitVersion = "1.7.2"
$zipUrl = "https://github.com/livekit/livekit/releases/download/v${livekitVersion}/livekit_${livekitVersion}_windows_amd64.zip"
$zipPath = Join-Path $PSScriptRoot "livekit_server.zip"
$extractPath = $PSScriptRoot

Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host '   VENTUNO Q — NATIVE WINDOWS LIVEKIT SETUP ENGINE        ' -ForegroundColor Cyan
Write-Host '==========================================================' -ForegroundColor Cyan

Write-Host "Downloading LiveKit Server v${livekitVersion} for Windows..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

Write-Host 'Extracting Server Binary...' -ForegroundColor Yellow
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

Write-Host 'Cleaning up archives...' -ForegroundColor Yellow
Remove-Item $zipPath -Force

Write-Host "LiveKit Server binary successfully installed to: $extractPath\livekit-server.exe" -ForegroundColor Green

# 2. Install Host Python Requirements using Python 3.11
Write-Host ''
Write-Host 'Installing Socratic Tutor Agent Python requirements on the host using Python 3.11...' -ForegroundColor Yellow
$reqPath = Join-Path $PSScriptRoot "agent\requirements.txt"
py -3.11 -m pip install -r $reqPath

Write-Host ''
Write-Host '==========================================================' -ForegroundColor Green
Write-Host '   NATIVE WINDOWS SETUP COMPLETED SUCCESSFULLY!           ' -ForegroundColor Green
Write-Host '==========================================================' -ForegroundColor Green
Write-Host 'Follow these two quick steps to run the WebRTC Tutor:'
Write-Host '1. Install Ollama for Windows: Download and run the 1-click installer from https://ollama.com/'
Write-Host '2. Boot the environment by running: .\run_native.ps1'
