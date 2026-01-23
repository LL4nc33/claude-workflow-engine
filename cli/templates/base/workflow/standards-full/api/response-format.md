# API Response Format Standards

## Standard Response Envelope

All API responses follow a consistent envelope structure:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "timestamp": "2026-01-23T12:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [
      { "field": "email", "issue": "Invalid format" }
    ]
  },
  "meta": {
    "timestamp": "2026-01-23T12:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET/PUT/PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Validation error, malformed request |
| 401 | Authentication required |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state mismatch) |
| 422 | Unprocessable entity (business logic) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Pagination

```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8
  }
}
```

## Error Codes Convention

- Format: `{DOMAIN}_{ERROR_TYPE}` (UPPER_SNAKE_CASE)
- Examples: `AUTH_TOKEN_EXPIRED`, `USER_NOT_FOUND`, `RATE_LIMIT_EXCEEDED`
- Always include machine-readable code AND human-readable message

## TODO: Additional Sections

- [ ] Rate limiting headers (X-RateLimit-*)
- [ ] HATEOAS links format (if applicable)
- [ ] Versioning strategy details
- [ ] Content negotiation rules
