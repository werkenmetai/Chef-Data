#!/bin/bash
# Exact Online MCP - Claude Desktop Installer (Productie)
# Vereist: OAuth login via browser bij eerste gebruik
#
# Gebruik:
#   curl -fsSL https://praatmetjeboekhouding.nl/install.sh | bash
#   OF: chmod +x install-production.sh && ./install-production.sh

set -e

echo ""
echo "========================================"
echo "  Exact Online MCP - Productie Setup"
echo "========================================"
echo ""

# Config file locatie
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
else
    CONFIG_DIR="$HOME/.config/Claude"
fi
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

# Check of folder bestaat
if [ ! -d "$CONFIG_DIR" ]; then
    echo "[*] Config folder aanmaken: $CONFIG_DIR"
    mkdir -p "$CONFIG_DIR"
fi

# Server configuratie
SERVER_CONFIG='{
  "exact-online": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "https://api.praatmetjeboekhouding.nl/mcp"]
  }
}'

# Check of config file bestaat
if [ -f "$CONFIG_FILE" ]; then
    echo "[*] Bestaande config gevonden, uitbreiden..."

    # Check of jq beschikbaar is
    if command -v jq &> /dev/null; then
        # Gebruik jq om config te mergen
        TEMP_FILE=$(mktemp)
        jq --argjson new "$SERVER_CONFIG" '.mcpServers += $new' "$CONFIG_FILE" > "$TEMP_FILE"
        mv "$TEMP_FILE" "$CONFIG_FILE"
    else
        echo "[!] jq niet gevonden. Handmatige installatie nodig."
        echo ""
        echo "Installeer jq eerst:"
        echo "  macOS: brew install jq"
        echo "  Linux: sudo apt install jq"
        echo ""
        echo "Of voeg dit handmatig toe aan $CONFIG_FILE:"
        echo ""
        echo "$SERVER_CONFIG"
        echo ""
        exit 1
    fi
else
    echo "[*] Nieuwe config aanmaken..."
    echo "{\"mcpServers\": $SERVER_CONFIG}" > "$CONFIG_FILE"
fi

echo ""
echo "[OK] Exact Online MCP toegevoegd!"
echo ""
echo "Volgende stappen:"
echo "  1. Herstart Claude Desktop"
echo "  2. Stel een vraag over je boekhouding"
echo "  3. Log in via de browser (eerste keer)"
echo ""
echo "Voorbeeld vraag: 'Wat is mijn omzet deze maand?'"
echo "Config: $CONFIG_FILE"
echo ""
