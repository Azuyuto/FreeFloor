# CyberFolks / CloudLinux deploy package
# NIE wgrywaj node_modules - panel tworzy symlink po Run NPM Install
# Run: powershell -ExecutionPolicy Bypass -File deploy.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "1/3 npm run build..."
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$out = Join-Path $PSScriptRoot "deploy-cyberfolks"
Write-Host "2/3 Packing to $out (bez node_modules, bez vendor)..."

if (Test-Path $out) {
    Remove-Item -Recurse -Force $out
}
New-Item -ItemType Directory -Force -Path $out | Out-Null

Get-ChildItem ".next\standalone" -Force | Where-Object { $_.Name -ne "node_modules" } | ForEach-Object {
    Copy-Item -Recurse -Force $_.FullName -Destination $out
}

Copy-Item -Recurse -Force ".next\static" (Join-Path $out ".next\static")
Copy-Item -Recurse -Force "public" (Join-Path $out "public")
if (Test-Path "data") {
    Copy-Item -Recurse -Force "data" (Join-Path $out "data")
}

Copy-Item -Force "package.hosting.json" (Join-Path $out "package.json")
Copy-Item -Force "server.hosting.js" (Join-Path $out "server.js")

$nm = Join-Path $out "node_modules"
if (Test-Path $nm) {
    Remove-Item -Recurse -Force $nm
    Write-Host "   Removed accidental node_modules from package."
}

$vendor = Join-Path $out "vendor"
if (Test-Path $vendor) {
    Remove-Item -Recurse -Force $vendor
}

Write-Host "3/3 Done."
Write-Host ""
Write-Host "Upload deploy-cyberfolks/ to:"
Write-Host "  /home/azuyuto/domains/azuyuto.cfolks.pl/free-floor"
Write-Host ""
Write-Host "WAZNE:"
Write-Host "  - NIE wgrywaj node_modules ani vendor/"
Write-Host "  - Na serwerze usun vendor/ i node_modules jesli to zwykle foldery"
Write-Host "  - W panelu Node.js: Run NPM Install, potem Restart (server.js)"
