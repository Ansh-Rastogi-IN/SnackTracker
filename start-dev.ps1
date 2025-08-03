$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

$clientJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npx vite --config vite.config.ts
}

Write-Host "Starting servers..."
Write-Host "Backend will be available at http://localhost:3000"
Write-Host "Frontend will be available at http://localhost:5173"

try {
    while ($true) {
        Receive-Job -Job $serverJob, $clientJob | ForEach-Object {
            Write-Host $_
        }
        Start-Sleep -Seconds 1
    }
} finally {
    Stop-Job -Job $serverJob, $clientJob
    Remove-Job -Job $serverJob, $clientJob
} 