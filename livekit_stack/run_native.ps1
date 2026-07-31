# run_native.ps1 - Boot Native WebRTC Socratic Tutor Stack
$ErrorActionPreference = "Stop"

Write-Host '==========================================================' -ForegroundColor Cyan
Write-Host '   VENTUNO Q — NATIVE WINDOWS APPLIANCE ENGINE            ' -ForegroundColor Cyan
Write-Host '==========================================================' -ForegroundColor Cyan

# 1. Start LiveKit Server in the background
Write-Host 'Launching LiveKit WebRTC Server...' -ForegroundColor Yellow
if (-not (Test-Path ".\livekit-server.exe")) {
    Write-Host 'ERROR: livekit-server.exe not found. Please run .\setup_native.ps1 first.' -ForegroundColor Red
    exit 1
}

# Kill any leftover livekit-server process to avoid port conflicts
Stop-Process -Name 'livekit-server' -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Spawn LiveKit Server in a minimized background process
Start-Process -FilePath ".\livekit-server.exe" -ArgumentList "--config .\livekit.yaml" -WindowStyle Minimized

# Wait up to 10s for port 7880 to confirm the server is ready
Write-Host 'Waiting for LiveKit server to bind port 7880...' -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 1
    $listening = netstat -ano 2>$null | Select-String ':7880'
    if ($listening) {
        Write-Host 'LiveKit server is ready on port 7880!' -ForegroundColor Green
        $ready = $true
        break
    }
}
if (-not $ready) {
    Write-Host 'WARNING: LiveKit server did not bind to port 7880 in time.' -ForegroundColor Red
}

# 2. Check Ollama Status
Write-Host ''
Write-Host 'Verifying local Qwen inference engine (Ollama)...' -ForegroundColor Yellow
try {
    $resp = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -ErrorAction Stop
    Write-Host 'Ollama connection successful! Local models detected.' -ForegroundColor Green
} catch {
    Write-Host 'WARNING: Ollama is not responding on http://localhost:11434/.' -ForegroundColor Red
    Write-Host 'Please download and start Ollama for Windows from https://ollama.com/' -ForegroundColor Yellow
}

# 3. Load Keys from .env
Write-Host ''
Write-Host 'Importing credentials from environment configurations...' -ForegroundColor Yellow
if (Test-Path "..\.env") {
    Get-Content "..\.env" | Foreach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split('=', 2)
            if ($parts.Count -eq 2) {
                $k = $parts[0].Trim()
                $v = $parts[1].Trim().Trim('"').Trim("'")
                [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
            }
        }
    }
    Write-Host 'API Keys loaded from .env' -ForegroundColor Green
}

# 4. Set LiveKit connection variables
$env:LIVEKIT_URL = "ws://localhost:7880"
$env:LIVEKIT_API_KEY = "devkey"
$env:LIVEKIT_API_SECRET = "secretsecretsecretsecretsecretsecretsecret"

# 5. Boot Python Voice Agent using Python 3.11
Write-Host ''
Write-Host 'Starting Socratic Voice Agent using Python 3.11...' -ForegroundColor Green
py -3.11 agent/tutor_agent.py start
