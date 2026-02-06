# Exact Online MCP - Claude Desktop Installer
# Voegt de demo MCP server toe aan Claude Desktop configuratie

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Exact Online MCP - Demo Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Config file locatie
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
$configDir = Split-Path $configPath

# Check of Claude Desktop folder bestaat
if (-not (Test-Path $configDir)) {
    Write-Host "[*] Claude folder aanmaken: $configDir" -ForegroundColor Gray
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# De server configuratie die we willen toevoegen
$newServer = @{
    command = "npx"
    args = @("-y", "mcp-remote", "https://api.praatmetjeboekhouding.nl/mcp/exa_demo")
}

# Lees of maak config
if (Test-Path $configPath) {
    Write-Host "[*] Bestaande config gevonden, uitbreiden..." -ForegroundColor Gray
    $configText = Get-Content $configPath -Raw

    # Parse JSON
    try {
        $config = $configText | ConvertFrom-Json -AsHashtable
    } catch {
        # Fallback voor oudere PowerShell
        $config = $configText | ConvertFrom-Json
        # Convert to hashtable
        $hash = @{}
        $config.PSObject.Properties | ForEach-Object { $hash[$_.Name] = $_.Value }
        $config = $hash
    }
} else {
    Write-Host "[*] Nieuwe config aanmaken..." -ForegroundColor Gray
    $config = @{}
}

# Zorg dat mcpServers bestaat
if (-not $config.ContainsKey("mcpServers") -or $null -eq $config["mcpServers"]) {
    $config["mcpServers"] = @{}
}

# Converteer mcpServers naar hashtable als nodig
if ($config["mcpServers"] -isnot [hashtable]) {
    $servers = @{}
    if ($config["mcpServers"]) {
        $config["mcpServers"].PSObject.Properties | ForEach-Object {
            $servers[$_.Name] = $_.Value
        }
    }
    $config["mcpServers"] = $servers
}

# Check of al bestaat
if ($config["mcpServers"].ContainsKey("exact-online-demo")) {
    Write-Host "[!] exact-online-demo bestaat al" -ForegroundColor Yellow
    $response = Read-Host "    Overschrijven? (j/n)"
    if ($response -ne "j" -and $response -ne "J") {
        Write-Host "[*] Geannuleerd" -ForegroundColor Gray
        exit 0
    }
}

# Voeg server toe
$config["mcpServers"]["exact-online-demo"] = $newServer

# Schrijf config (UTF8 zonder BOM - belangrijk voor Claude Desktop!)
$json = $config | ConvertTo-Json -Depth 10
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($configPath, $json, $utf8NoBom)

Write-Host ""
Write-Host "[OK] Exact Online MCP Demo toegevoegd!" -ForegroundColor Green
Write-Host ""
Write-Host "Config inhoud:" -ForegroundColor Gray
Get-Content $configPath | Write-Host -ForegroundColor DarkGray
Write-Host ""
Write-Host "Volgende stappen:" -ForegroundColor Cyan
Write-Host "  1. Herstart Claude Desktop" -ForegroundColor White
Write-Host "  2. Open een nieuwe chat" -ForegroundColor White
Write-Host "  3. Vraag: 'Welke facturen staan open?'" -ForegroundColor White
Write-Host ""
Write-Host "Demo bedrijf: Bakkerij De Gouden Croissant B.V." -ForegroundColor Gray
Write-Host ""
