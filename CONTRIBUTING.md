# Contributing to Solidity Audit MCP

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building tools to make smart contract security more accessible.

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the bug report template
3. Include:
   - Node.js version
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs or error messages

### Suggesting Features

1. Open a feature request issue
2. Describe the use case and motivation
3. Propose a solution if you have one
4. Be open to discussion

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit with clear messages
7. Push and open a PR

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/solidity-audit-mcp.git
cd solidity-audit-mcp

# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev
```

## Project Structure

```
src/
├── index.ts           # MCP server entry point
├── schemas.ts         # Type definitions and JSON schemas
└── tools/
    ├── utils.ts       # Shared utilities
    ├── detect.ts      # Project detection tool
    ├── build.ts       # Build tool
    ├── test.ts        # Test runner tool
    └── invariants.ts  # Invariant test tool
```

## Coding Standards

- **TypeScript**: Use strict mode, avoid `any`
- **Formatting**: Follow existing code style
- **Comments**: Document complex logic, not obvious code
- **Security**: Validate inputs, sanitize outputs, never trust user data

## Adding New Tools

1. Create a new file in `src/tools/`
2. Define input/output schemas in `src/schemas.ts`
3. Register the tool in `src/index.ts`
4. Add tests
5. Update README documentation

### Tool Requirements

- Clear, detailed description (3-4 sentences minimum)
- Defined `inputSchema` and `outputSchema`
- Input validation
- Timeout handling
- Error handling with informative messages
- Both structured output and text fallback

## Security Considerations

This tool interacts with user codebases and executes commands. When contributing:

- Only allow explicitly allowlisted commands
- Validate all paths to prevent traversal attacks
- Redact potential secrets from output
- Enforce timeouts on all operations
- Never execute arbitrary shell commands

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.ts
```

## Questions?

Open an issue with the "question" label or start a discussion.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
