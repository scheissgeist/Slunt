# Setup Windows Firewall Rules for Slunt
# Run this script AS ADMINISTRATOR on the computer running Slunt (192.168.1.82)

Write-Host "Setting up Windows Firewall rules for Slunt..." -ForegroundColor Cyan
Write-Host ""

# Port 3000 - Main Slunt server
Write-Host "Adding rule for port 3000 (Slunt main server)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Slunt Server (TCP 3000)" `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort 3000 `
        -Profile Any `
        -Enabled True `
        -ErrorAction Stop
    Write-Host "✓ Port 3000 rule added successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add port 3000 rule: $($_.Exception.Message)" -ForegroundColor Red
}

# Port 3001 - Alternate Slunt server port
Write-Host "Adding rule for port 3001 (Slunt alternate port)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "Slunt Server (TCP 3001)" `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort 3001 `
        -Profile Any `
        -Enabled True `
        -ErrorAction Stop
    Write-Host "✓ Port 3001 rule added successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add port 3001 rule: $($_.Exception.Message)" -ForegroundColor Red
}

# Port 3002 - OpenVoice AI voice server
Write-Host "Adding rule for port 3002 (OpenVoice server)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "OpenVoice Server (TCP 3002)" `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort 3002 `
        -Profile Any `
        -Enabled True `
        -ErrorAction Stop
    Write-Host "✓ Port 3002 rule added successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add port 3002 rule: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Firewall setup complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing if ports are accessible..." -ForegroundColor Yellow
Write-Host ""

# Test if server is listening
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$port3002 = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "✓ Server is listening on port 3000" -ForegroundColor Green
} else {
    Write-Host "⚠ Server is NOT listening on port 3000 (is Slunt running?)" -ForegroundColor Yellow
}

if ($port3001) {
    Write-Host "✓ Server is listening on port 3001" -ForegroundColor Green
} else {
    Write-Host "⚠ Server is NOT listening on port 3001" -ForegroundColor Yellow
}

if ($port3002) {
    Write-Host "✓ OpenVoice server is listening on port 3002" -ForegroundColor Green
} else {
    Write-Host "⚠ OpenVoice is NOT listening on port 3002" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart Slunt server (npm start)" -ForegroundColor White
Write-Host "2. From gaming computer (192.168.1.75), test with:" -ForegroundColor White
Write-Host "   Test-NetConnection -ComputerName 192.168.1.82 -Port 3000" -ForegroundColor Gray
Write-Host "   Test-NetConnection -ComputerName 192.168.1.82 -Port 3002" -ForegroundColor Gray
Write-Host "3. Open browser and go to:" -ForegroundColor White
Write-Host "   http://192.168.1.82:3001/voice" -ForegroundColor Gray
Write-Host ""
