# Containerization Standards

## Dockerfile Best Practices

- Multi-stage builds: separate build and runtime
- Use Alpine-based images where possible
- Run as non-root user (never root in production)
- Include HEALTHCHECK instruction
- Order layers: dependencies first, source code last (cache optimization)
- Use .dockerignore to exclude unnecessary files

## Image Security

- Scan images with trivy/snyk before push
- No secrets in image layers (use runtime injection)
- Pin base image versions (no `latest` tag)
- Minimize attack surface: remove shells, package managers in final stage
- Set read-only filesystem where possible

## Docker Compose (Development)

```yaml
# Standard compose structure
services:
  app:
    build: .
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app        # Hot reload
      - /app/node_modules  # Preserve container modules
    depends_on:
      db:
        condition: service_healthy
```

## Container Resource Limits

- Always set CPU and memory limits
- Requests: what the container needs normally
- Limits: maximum allowed (prevent noisy neighbors)
- Start conservative, adjust based on monitoring

## Registry Conventions

- Use GHCR (ghcr.io) for GitHub-integrated projects
- Tag format: `{registry}/{org}/{app}:{git-sha}`
- Keep last 10 versions, prune older images
- Separate registries for dev/staging/production
