#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Uninstalling Solidity Audit Skill...${NC}\n"

CLAUDE_DIR="$HOME/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills/solidity-audit"
MCP_CONFIG="$CLAUDE_DIR/mcp.json"

# Remove skill directory
if [ -d "$SKILLS_DIR" ]; then
    rm -rf "$SKILLS_DIR"
    echo -e "${GREEN}✓ Removed skill files${NC}"
fi

# Remove command
if [ -L "$CLAUDE_DIR/commands/audit.md" ]; then
    rm "$CLAUDE_DIR/commands/audit.md"
    echo -e "${GREEN}✓ Removed /audit command${NC}"
fi

# Remove from MCP config
if [ -f "$MCP_CONFIG" ] && grep -q "solidity_audit" "$MCP_CONFIG" 2>/dev/null; then
    node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('$MCP_CONFIG', 'utf8'));
    if (config.mcpServers) {
        delete config.mcpServers.solidity_audit;
    }
    fs.writeFileSync('$MCP_CONFIG', JSON.stringify(config, null, 2));
    "
    echo -e "${GREEN}✓ Removed MCP server from config${NC}"
fi

echo -e "\n${GREEN}Uninstall complete.${NC} Restart Claude Code to apply changes."
