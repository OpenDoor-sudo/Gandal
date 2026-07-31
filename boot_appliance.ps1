# ==============================================================================
# boot_appliance.ps1 - Ventuno Q Headless Appliance Windows Startup Sequence
# ==============================================================================

Write-Host "======================================================================"
Write-Host "      INITIATING VENTUNO Q HEADLESS APPLICATION STARTUP SEQUENCE      "
Write-Host "======================================================================"

# 1. Dependency Validation Checks
Write-Host -NoNewline "[CHECK] Verifying Python installation... "
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "PASSED"
} else {
    Write-Host "FAILED"
    Write-Host "Error: python is required to run the Ventuno appliance."
    Exit 1
}

Write-Host -NoNewline "[CHECK] Verifying SQLite database existence... "
if (Test-Path "vault.db") {
    Write-Host "PASSED (vault.db found)"
} else {
    Write-Host "WARNING: SQLite vault.db not found. Running database initializer..."
    python init_vault.py
}

# 2. Private Local Wi-Fi 6 Hotspot Protocol Bridge Initialization
Write-Host "[APPLIANCE] Initializing Hotspot Bridge interface..."
Write-Host "  [INFO] Running in User Mode. Simulating Wi-Fi 6 Hardware Hotspot Protocol Bridge..."
Write-Host "  [INFO] Setting up mock interface: wlan0 (802.11ax / Wi-Fi 6)"
Write-Host "  [INFO] Establishing virtual bridge: br0 <-> wlan0"
Write-Host "  [INFO] Access Point broadcast: SSID 'Ventuno_AP_6' (Channel 36, 5GHz)"
Write-Host "  [SUCCESS] Wi-Fi 6 Hotspot Bridge active: [IP 192.168.10.1]"

# 3. Process Execution & Redirection
Write-Host "[APPLIANCE] Launching dashboard server display_client.py..."
$displayProc = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*display_client.py*" }
if ($displayProc) {
    Write-Host "  [INFO] Stopping existing display_client server (PID: $($displayProc.Id))..."
    Stop-Process -Id $displayProc.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
Start-Process python -ArgumentList "-u display_client.py" -NoNewWindow -RedirectStandardOutput "display_client.log" -RedirectStandardError "display_client.err.log" -WorkingDirectory $PSScriptRoot
Write-Host "  [SUCCESS] display_client.py backgrounded"

Write-Host "[APPLIANCE] Launching state machine engine orchestrator.py..."
$orchProc = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*orchestrator.py*" }
if ($orchProc) {
    Write-Host "  [INFO] Stopping existing orchestrator brain (PID: $($orchProc.Id))..."
    Stop-Process -Id $orchProc.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
Start-Process python -ArgumentList "-u orchestrator.py --npu" -NoNewWindow -RedirectStandardOutput "orchestrator.log" -RedirectStandardError "orchestrator.err.log" -WorkingDirectory $PSScriptRoot
Write-Host "  [SUCCESS] orchestrator.py backgrounded with NPU acceleration"

Write-Host "[APPLIANCE] Launching security sentry sentry_vision.py..."
$sentryProc = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*sentry_vision.py*" }
if ($sentryProc) {
    Write-Host "  [INFO] Stopping existing sentry vision processor (PID: $($sentryProc.Id))..."
    Stop-Process -Id $sentryProc.Id -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
Start-Process python -ArgumentList "-u sentry_vision.py" -NoNewWindow -RedirectStandardOutput "sentry_vision.log" -RedirectStandardError "sentry_vision.err.log" -WorkingDirectory $PSScriptRoot
Write-Host "  [SUCCESS] sentry_vision.py backgrounded"

Write-Host "======================================================================"
Write-Host "          VENTUNO Q HEADLESS INFRASTRUCTURE APPLIANCE ACTIVE          "
Write-Host "======================================================================"
