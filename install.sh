#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Installing Solidity Audit Skill for Claude Code${NC}\n"

# Get script directory (where the repo is)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Claude config directories
CLAUDE_DIR="$HOME/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills/solidity-audit"
COMMANDS_DIR="$CLAUDE_DIR/commands"

# 1. Build MCP server
echo -e "${YELLOW}Building MCP server...${NC}"
cd "$SCRIPT_DIR"
npm install
npm run build
echo -e "${GREEN}✓ MCP server built${NC}\n"

# 2. Create Claude directories
echo -e "${YELLOW}Setting up skill directories...${NC}"
mkdir -p "$SKILLS_DIR/resources"
mkdir -p "$COMMANDS_DIR"

# 3. Symlink skill files (so updates are automatic)
ln -sf "$SCRIPT_DIR/skill/SKILL.md" "$SKILLS_DIR/SKILL.md"
ln -sf "$SCRIPT_DIR/skill/resources/checklist.md" "$SKILLS_DIR/resources/checklist.md"
ln -sf "$SCRIPT_DIR/skill/resources/severity-rubric.md" "$SKILLS_DIR/resources/severity-rubric.md"
ln -sf "$SCRIPT_DIR/skill/resources/report-template.md" "$SKILLS_DIR/resources/report-template.md"
ln -sf "$SCRIPT_DIR/skill/commands/audit.md" "$COMMANDS_DIR/audit.md"
echo -e "${GREEN}✓ Skill files linked${NC}\n"

# 4. Configure MCP server
MCP_CONFIG="$CLAUDE_DIR/mcp.json"
MCP_ENTRY="{\"type\":\"stdio\",\"command\":\"node\",\"args\":[\"$SCRIPT_DIR/dist/index.js\"]}"

if [ -f "$MCP_CONFIG" ]; then
    # Check if already configured
    if grep -q "solidity_audit" "$MCP_CONFIG" 2>/dev/null; then
        echo -e "${YELLOW}⚠ MCP server already configured in $MCP_CONFIG${NC}"
    else
        echo -e "${YELLOW}Adding MCP server to existing config...${NC}"
        # Use node to safely merge JSON
        node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('$MCP_CONFIG', 'utf8'));
        config.mcpServers = config.mcpServers || {};
        config.mcpServers.solidity_audit = $MCP_ENTRY;
        fs.writeFileSync('$MCP_CONFIG', JSON.stringify(config, null, 2));
        "
        echo -e "${GREEN}✓ MCP server added to config${NC}\n"
    fi
else
    echo -e "${YELLOW}Creating MCP config...${NC}"
    echo "{\"mcpServers\":{\"solidity_audit\":$MCP_ENTRY}}" | node -e "
    const fs = require('fs');
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
        fs.writeFileSync('$MCP_CONFIG', JSON.stringify(JSON.parse(data), null, 2));
    });
    "
    echo -e "${GREEN}✓ MCP config created${NC}\n"
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Installation complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "Restart Claude Code, then try:"
echo -e "  ${YELLOW}\"Audit my smart contracts\"${NC}"
echo -e "  ${YELLOW}/audit${NC}\n"
