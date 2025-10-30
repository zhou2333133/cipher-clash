param(
    [switch],
    [switch]
)

Write-Host "[CipherClash] 环境准备开始" -ForegroundColor Cyan

if (-not ) {
    Write-Host "安装合约依赖..." -ForegroundColor Yellow
    Push-Location "\..\contracts"
    if (Test-Path "pnpm-lock.yaml") {
        pnpm install
    } elseif (Test-Path "package-lock.json") {
        npm install
    } else {
        pnpm install
    }
    Pop-Location
}

if (-not ) {
    Write-Host "安装前端依赖..." -ForegroundColor Yellow
    Push-Location "\..\frontend"
    if (Test-Path "pnpm-lock.yaml") {
        pnpm install
    } elseif (Test-Path "package-lock.json") {
        npm install
    } else {
        pnpm install
    }
    Pop-Location
}

Write-Host "完成" -ForegroundColor Green
