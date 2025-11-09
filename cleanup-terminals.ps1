# Cleanup script to kill all dead Node.js processes
# Run this if you have too many hanging terminals

Write-Host "🧹 Cleaning up dead Node.js processes..." -ForegroundColor Cyan

# Kill all node.exe processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Killed all Node.js processes" -ForegroundColor Green
} else {
    Write-Host "✅ No Node.js processes running" -ForegroundColor Green
}

# Optional: Clean up orphaned PowerShell windows (be careful with this)
# Uncomment if you want to also clean PowerShell processes
# Write-Host "`n🔍 Checking for orphaned PowerShell processes..." -ForegroundColor Cyan
# $currentPID = $PID
# $parentPID = (Get-WmiObject Win32_Process -Filter "ProcessId=$currentPID").ParentProcessId
# Get-Process -Name powershell -ErrorAction SilentlyContinue | Where-Object { 
#     $_.Id -ne $currentPID -and $_.Id -ne $parentPID 
# } | ForEach-Object {
#     Write-Host "Killing PowerShell PID: $($_.Id)" -ForegroundColor Yellow
#     Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
# }

Write-Host "`n✨ Cleanup complete!" -ForegroundColor Green
Write-Host "You can now start Slunt with: npm start" -ForegroundColor Cyan
