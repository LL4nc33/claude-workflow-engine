# Infrastructure Standards

## Infrastructure as Code (IaC)

- All infrastructure defined in code (Terraform/Pulumi)
- State stored remotely (S3 + DynamoDB lock for Terraform)
- Modular structure: separate modules per concern
- Environment isolation: dev/staging/prod as separate state files
- Plan before apply, always review diffs

## Kubernetes Conventions

- Namespace per environment/team
- Resource requests and limits on every container
- Liveness and readiness probes required
- SecurityContext: runAsNonRoot, readOnlyRootFilesystem
- Use Kustomize or Helm for environment-specific config
- Secrets via external-secrets-operator, not plain K8s secrets

## Cloud Architecture (EU-Compliant)

- Primary region: eu-central-1 (Frankfurt)
- Failover region: eu-west-1 (Ireland)
- Data never leaves EU boundaries
- Use managed services where possible (RDS, EKS)
- Enable encryption at rest and in transit

## Monitoring and Observability

- Metrics: Prometheus + Grafana
- Logs: structured JSON, centralized collection
- Traces: OpenTelemetry for distributed tracing
- Alerts: PagerDuty/OpsGenie integration
- SLOs defined for critical services

## Disaster Recovery

- RPO (Recovery Point Objective): defined per service
- RTO (Recovery Time Objective): defined per service
- Regular DR drills (quarterly minimum)
- Automated backups with verified restores
- Runbooks for common failure scenarios
