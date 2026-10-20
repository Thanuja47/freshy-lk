Copy-Item -Path "public" -Destination ".next\standalone\public" -Recurse -Force -ErrorAction SilentlyContinue
if (!(Test-Path ".next\standalone\.next")) { New-Item -ItemType Directory -Path ".next\standalone\.next" -Force | Out-Null }
Copy-Item -Path ".next\static" -Destination ".next\standalone\.next\static" -Recurse -Force -ErrorAction SilentlyContinue

$serverProcess = Start-Process -FilePath "node" -ArgumentList ".next\standalone\server.js" -PassThru -NoNewWindow
Write-Host "Started standalone server with PID $($serverProcess.Id)"

try {
    Start-Sleep -Seconds 6
    npx playwright test tests/e2e/outstation-order.spec.ts --project="Desktop Chrome"
} finally {
    Write-Host "Stopping standalone server PID $($serverProcess.Id)"
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}
