#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}Solidity Audit Skill for Claude Code${NC}\n"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Claude config directories
CLAUDE_DIR="$HOME/.claude"
SKILLS_DIR="$CLAUDE_DIR/skills/solidity-audit"
COMMANDS_DIR="$CLAUDE_DIR/commands"

# Parse arguments
SKILL_ONLY=false
for arg in "$@"; do
    case $arg in
        --skill-only)
            SKILL_ONLY=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./install.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skill-only    Install only the skill files (no MCP server)"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Default: Installs both skill and MCP server"
            exit 0
            ;;
    esac
done

# Interactive mode if no flags
if [ "$SKILL_ONLY" = false ] && [ -t 0 ]; then
    echo -e "Installation options:\n"
    echo -e "  ${BLUE}1)${NC} Full install - Skill + MCP server (recommended)"
    echo -e "     MCP provides structured build/test/audit tools"
    echo -e ""
    echo -e "  ${BLUE}2)${NC} Skill only - Just the audit methodology"
    echo -e "     Works without MCP, uses manual commands"
    echo ""
    read -p "Choose [1/2] (default: 1): " choice

    if [ "$choice" = "2" ]; then
        SKILL_ONLY=true
    fi
    echo ""
fi

# 1. Build MCP server (unless skill-only)
if [ "$SKILL_ONLY" = false ]; then
    echo -e "${YELLOW}Building MCP server...${NC}"
    cd "$SCRIPT_DIR"
    npm install --silent
    npm run build --silent
    echo -e "${GREEN}✓ MCP server built${NC}\n"
fi

# 2. Create Claude directories
echo -e "${YELLOW}Setting up skill directories...${NC}"
mkdir -p "$SKILLS_DIR/resources"
mkdir -p "$COMMANDS_DIR"

# 3. Symlink skill files
ln -sf "$SCRIPT_DIR/skill/SKILL.md" "$SKILLS_DIR/SKILL.md"
ln -sf "$SCRIPT_DIR/skill/resources/checklist.md" "$SKILLS_DIR/resources/checklist.md"
ln -sf "$SCRIPT_DIR/skill/resources/severity-rubric.md" "$SKILLS_DIR/resources/severity-rubric.md"
ln -sf "$SCRIPT_DIR/skill/resources/report-template.md" "$SKILLS_DIR/resources/report-template.md"
ln -sf "$SCRIPT_DIR/skill/commands/audit.md" "$COMMANDS_DIR/audit.md"
echo -e "${GREEN}✓ Skill files linked${NC}\n"

# 4. Configure MCP server (unless skill-only)
if [ "$SKILL_ONLY" = false ]; then
    MCP_CONFIG="$CLAUDE_DIR/mcp.json"
    MCP_ENTRY="{\"type\":\"stdio\",\"command\":\"node\",\"args\":[\"$SCRIPT_DIR/dist/index.js\"]}"

    if [ -f "$MCP_CONFIG" ]; then
        if grep -q "solidity_audit" "$MCP_CONFIG" 2>/dev/null; then
            echo -e "${YELLOW}⚠ MCP server already configured${NC}\n"
        else
            echo -e "${YELLOW}Adding MCP server to config...${NC}"
            node -e "
            const fs = require('fs');
            const config = JSON.parse(fs.readFileSync('$MCP_CONFIG', 'utf8'));
            config.mcpServers = config.mcpServers || {};
            config.mcpServers.solidity_audit = $MCP_ENTRY;
            fs.writeFileSync('$MCP_CONFIG', JSON.stringify(config, null, 2));
            "
            echo -e "${GREEN}✓ MCP server configured${NC}\n"
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
fi

# Done
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ "$SKILL_ONLY" = true ]; then
    echo -e "${GREEN}Skill installed (without MCP server)${NC}"
else
    echo -e "${GREEN}Full installation complete!${NC}"
fi
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "Restart Claude Code, then try:"
echo -e "  ${YELLOW}\"Audit my smart contracts\"${NC}"
echo -e "  ${YELLOW}/audit${NC}\n"

if [ "$SKILL_ONLY" = true ]; then
    echo -e "${BLUE}Note:${NC} You installed skill-only mode. The skill will guide you"
    echo -e "through manual audits using forge/hardhat commands directly.\n"
    echo -e "To add MCP tools later, run: ${YELLOW}./install.sh${NC}\n"
fi
