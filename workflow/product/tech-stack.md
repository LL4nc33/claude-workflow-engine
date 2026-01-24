# Tech Stack

## Core

- Claude Code CLI as the runtime platform
- Claude Code Skills for standards injection
- Claude Code Subagents for specialized execution

## CLI Tools

- TypeScript for type-safe CLI implementation
- Node.js >= 18 as runtime
- No external runtime dependencies beyond `yaml` parser

## Development

- Git for version control
- GitHub for collaboration and releases
- GitHub Actions for CI/CD (planned)

## Infrastructure (for projects using this engine)

- Docker for containerization (optional)
- Kubernetes for scaled deployments (optional)
- Terraform for IaC (optional)

## Standards

- Markdown for all documentation and agent definitions
- YAML for configuration (config.yml, orchestration.yml, index.yml)
- YAML frontmatter in agent/skill/command definitions
