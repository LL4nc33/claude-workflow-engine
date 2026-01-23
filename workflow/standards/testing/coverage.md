# Testing & Coverage Standards

## Coverage Targets

| Layer | Minimum | Target | Critical Path |
|-------|---------|--------|---------------|
| Unit tests | 70% | 85% | 95% |
| Integration | 50% | 70% | 85% |
| E2E | Key flows | Happy + error paths | All paths |

## Test File Naming

| Framework | Convention | Example |
|-----------|-----------|---------|
| Jest/Vitest | `{module}.test.ts` | `auth.test.ts` |
| Pytest | `test_{module}.py` | `test_auth.py` |
| Go | `{module}_test.go` | `auth_test.go` |

## Test Structure (AAA Pattern)

```typescript
describe('UserService', () => {
  it('should create user with valid data', () => {
    // Arrange
    const input = { email: 'test@example.com', name: 'Test' };

    // Act
    const result = userService.create(input);

    // Assert
    expect(result.id).toBeDefined();
    expect(result.email).toBe(input.email);
  });
});
```

## What to Test

- **Always test:** Business logic, error paths, edge cases, security boundaries
- **Consider testing:** Integration points, data transformations, state machines
- **Skip testing:** Framework internals, trivial getters/setters, generated code

## CI Integration

- Tests must pass before merge (blocking check)
- Coverage report uploaded as PR comment
- Coverage decrease > 2% blocks merge
- Flaky test = broken test (fix or remove)

## Test Data

- Use factories/fixtures, not production data
- Never use real PII in tests
- Seed data should be deterministic (fixed seeds for random)
- Clean up test data after integration tests

## TODO: Additional Sections

- [ ] Mocking strategies and boundaries
- [ ] Performance testing thresholds
- [ ] Security testing integration
- [ ] Visual regression testing (if frontend)
