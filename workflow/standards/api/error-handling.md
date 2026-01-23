# API Error Handling Standards

## Error Hierarchy

```
ApplicationError (base)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── BusinessLogicError (422)
├── RateLimitError (429)
└── InternalError (500)
```

## Error Handling Rules

1. **Never expose internal details** - Stack traces, SQL queries, file paths stay server-side
2. **Always log the full error** - Internal logging gets full context
3. **Use error codes, not just messages** - Codes are stable, messages can change
4. **Include correlation ID** - Every error response includes requestId for tracing
5. **Fail gracefully** - Partial failures return partial results with error details

## Error Response Structure

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable: AUTH_TOKEN_EXPIRED
    message: string;        // Human-readable: "Your session has expired"
    details?: ErrorDetail[]; // Optional field-level errors
    retryable?: boolean;    // Can the client retry?
    retryAfter?: number;    // Seconds until retry (for rate limits)
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

interface ErrorDetail {
  field: string;
  issue: string;
  code?: string;
}
```

## Logging Standards

| Level | Usage |
|-------|-------|
| ERROR | Unhandled exceptions, 5xx responses |
| WARN | Handled errors, rate limits, retries |
| INFO | Request/response lifecycle |
| DEBUG | Request bodies, query details (never in production) |

## GDPR Compliance

- Never log PII (personal identifiable information) in error messages
- Sanitize user input before logging
- Error responses must not leak other users' data
- Retention: Error logs max 30 days, then aggregate/anonymize

## TODO: Additional Sections

- [ ] Circuit breaker patterns
- [ ] Retry strategies with exponential backoff
- [ ] Error aggregation and alerting thresholds
- [ ] Client-side error handling recommendations
