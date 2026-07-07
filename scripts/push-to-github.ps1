# Push to GitHub when HTTPS to github.com is blocked on your network.
# Uses SSH over port 443 (ssh.github.com).

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PubKeyPath = Join-Path $env:USERPROFILE ".ssh\id_ed25519.pub"

if (-not (Test-Path $PubKeyPath)) {
    Write-Host "No SSH key found. Generate one with:"
    Write-Host '  ssh-keygen -t ed25519 -C "your@email.com" -f "$env:USERPROFILE\.ssh\id_ed25519" -N ""'
    exit 1
}

$pubKey = Get-Content $PubKeyPath -Raw
Set-Clipboard -Value $pubKey.Trim()
Write-Host "SSH public key copied to clipboard."
Write-Host ""
Write-Host $pubKey.Trim()
Write-Host ""
Write-Host "Opening GitHub SSH key settings..."
Start-Process "https://github.com/settings/ssh/new"
Write-Host ""
Write-Host "1. Title: Booking AI Voice Agent"
Write-Host "2. Paste the key (Ctrl+V) and click Add SSH key"
Read-Host "Press Enter after adding the key to GitHub"

Push-Location $RepoRoot
git remote set-url origin git@github.com:smoothsoftwareengineer/Booking_AI_VOICE_AGENT.git
git push -u origin main
Pop-Location
