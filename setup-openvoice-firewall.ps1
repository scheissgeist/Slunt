# Setup Windows Firewall for OpenVoice Server
# Run this script as Administrator

Write-Host "Setting up Windows Firewall for OpenVoice Server (Port 5001)..." -ForegroundColor Cyan

# Check if rule already exists
$existingRule = Get-NetFirewallRule -DisplayName "OpenVoice Server (Port 5001)" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "Firewall rule already exists, removing old rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "OpenVoice Server (Port 5001)"
}

# Create new firewall rule
New-NetFirewallRule `
    -DisplayName "OpenVoice Server (Port 5001)" `
    -Direction Inbound `
    -LocalPort 5001 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any `
    -Description "Allows incoming connections to OpenVoice TTS server"

Write-Host "✅ Firewall rule created successfully!" -ForegroundColor Green
Write-Host "OpenVoice server on port 5001 is now accessible from network" -ForegroundColor Green
Write-Host ""
Write-Host "Test from another computer:" -ForegroundColor Cyan
Write-Host "  curl http://192.168.1.82:5001/" -ForegroundColor White
Write-Host "  curl http://192.168.1.82:5001/health" -ForegroundColor White
