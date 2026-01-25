# Use Case: Systematic Debugging with the Debug Agent

A practical example of troubleshooting sporadic 500 errors in a production environment -- without the full 5-phase workflow.

## Scenario

Your Express.js API has been returning sporadic HTTP 500 errors since yesterday. The affected endpoint is `GET /api/users/:id/profile`. The problem does not occur on every request but only under certain conditions that are still unclear.

**Symptoms:**

- Approximately 5% of requests to this endpoint fail
- The error has been occurring since yesterday at 14:30
- Monitoring shows no memory or CPU anomalies
- Other endpoints are not affected

**Question:** Do you need the full 5-phase workflow or can you use the builder agent directly?

---

## Decision: Full Workflow or Debug Agent Directly?

### Use the builder agent directly when:

- The problem is clearly localized (one endpoint, one service)
- It is a bug, not a new feature
- No fundamental architecture decisions are needed
- The fix is expected to affect few files

### Use the full workflow when:

- The bug points to a fundamental design problem
- The fix requires changes across multiple services/systems
- New standards or patterns need to be introduced
- The problem is recurring and needs an architectural solution

In our case: **Debug agent directly.** The bug is localized, we need investigation and a targeted fix.

---

## Walkthrough with the Debug Agent

### Phase 1: Reflect

The builder agent starts with the situation analysis:

```markdown
## Situation Analysis

- Expected behavior: GET /api/users/:id/profile returns 200 with user profile
- Actual behavior: Sporadic 500, approximately 5% of requests
- Onset: Yesterday at 14:30
- Reproducible: Yes, but not deterministic
- Affected area: Only this one endpoint
```

**Initial questions from the builder agent:**

```
- What was deployed yesterday at 14:30? (git log --since="yesterday 14:00")
- Are there new dependencies or configuration changes?
- Which user IDs are affected? All or specific ones?
```

### Phase 2: Formulate Hypotheses

```markdown
## Hypotheses (by likelihood)

1. Null reference on optional profile fields
   Evidence: Sporadic = not all users affected, could be due to data differences

2. Race condition on cache invalidation
   Evidence: Timing-dependent, not deterministic

3. Database connection pool exhausted
   Evidence: Would explain sporadic behavior, but other endpoints would also be affected

4. External service timeout (e.g. avatar URL validation)
   Evidence: Could be network-dependent, should be visible in logs
```

### Phase 3: Diagnose

**Step 1: Git forensics -- What changed?**

```bash
git log --oneline --since="yesterday 12:00"
```

Result:

```
a3f2c1d feat: add social links to user profile
b891e2a chore: update prisma to 5.8.0
c72d4f6 fix: typo in email template
```

Commit `a3f2c1d` is suspicious -- it modifies exactly the affected area.

```bash
git diff b891e2a..a3f2c1d -- src/services/user.service.ts
```

Result:

```diff
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
-     include: { profile: true }
+     include: { profile: true, socialLinks: true }
    });

+   const formattedLinks = user.socialLinks.map(link => ({
+     platform: link.platform,
+     url: link.url,
+   }));

    return {
      ...user.profile,
+     socialLinks: formattedLinks,
    };
  }
```

**Step 2: Validate hypothesis 1**

The problem is visible: `user.socialLinks.map()` -- if a user has no `socialLinks`, `user.socialLinks` is either `null` or `undefined` (depending on the Prisma relation type). Calling `.map()` on `null` throws a TypeError.

**Step 3: Gather proof**

```bash
# Which users have no socialLinks?
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users u LEFT JOIN social_links sl ON u.id = sl.user_id WHERE sl.id IS NULL;"
```

Result: 847 out of 16,230 users have no social links -- that is approximately 5.2%, which matches the error rate exactly.

**Log confirmation:**

```bash
grep "TypeError" logs/app-$(date +%Y-%m-%d).log | head -5
```

```
[2024-01-22 14:31:02] TypeError: Cannot read properties of null (reading 'map')
    at UserService.getProfile (src/services/user.service.ts:47:38)
    at async ProfileController.get (src/controllers/profile.controller.ts:12:20)
```

### Phase 4: Isolate

**Minimal reproduction case:**

```typescript
// test: User without socialLinks triggers the bug
const userWithoutLinks = await prisma.user.findFirst({
  where: { socialLinks: { none: {} } }
});

const response = await request(app)
  .get(`/api/users/${userWithoutLinks.id}/profile`)
  .set("Authorization", `Bearer ${token}`);

// Expected: 200, Actual: 500
expect(response.status).toBe(200);
```

**Root cause confirmed:** Null reference on `user.socialLinks` when a user has no social links stored.

### Phase 5: Fix

**Minimal fix in `src/services/user.service.ts`:**

```typescript
async getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, socialLinks: true }
  });

  if (!user) {
    return null;
  }

  const formattedLinks = (user.socialLinks ?? []).map(link => ({
    platform: link.platform,
    url: link.url,
  }));

  return {
    ...user.profile,
    socialLinks: formattedLinks,
  };
}
```

Changes:

1. Null check for the entire user (defensive, was not present before either)
2. Nullish coalescing (`??`) for socialLinks -- empty array as fallback

**Regression test added:**

```typescript
// tests/integration/user-profile.test.ts
describe("GET /api/users/:id/profile", () => {
  it("returns profile without social links", async () => {
    const user = await createTestUser({ withSocialLinks: false });
    const token = generateToken(user.id);

    const res = await request(app)
      .get(`/api/users/${user.id}/profile`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.socialLinks).toEqual([]);
  });

  it("returns profile with social links", async () => {
    const user = await createTestUser({
      withSocialLinks: true,
      links: [{ platform: "github", url: "https://github.com/testuser" }]
    });
    const token = generateToken(user.id);

    const res = await request(app)
      .get(`/api/users/${user.id}/profile`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.socialLinks).toHaveLength(1);
    expect(res.body.data.socialLinks[0].platform).toBe("github");
  });

  it("returns 404 for non-existent user", async () => {
    const token = generateToken("existing-user-id");

    const res = await request(app)
      .get("/api/users/non-existent-uuid/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
```

---

## Bug Report

```markdown
## Bug Report: Sporadic 500 Errors on GET /api/users/:id/profile

### Symptoms
Approximately 5% of requests to the profile endpoint return HTTP 500.
TypeError: Cannot read properties of null (reading 'map').

### Root Cause
Commit a3f2c1d introduced social links into the profile response.
The code assumes every user has socialLinks (non-null).
847 users have no social links, leading to a null reference error.

### Fix Applied
- Nullish coalescing operator for socialLinks (fallback to empty array)
- Defensive null check for the entire user
- File: src/services/user.service.ts

### Prevention
- Extend code review checklist with "null safety for optional relations"
- ALWAYS handle Prisma relations that are optional with a fallback
- Standard rule: Always secure new includes with a test for "relation does not exist"

### Regression Test
tests/integration/user-profile.test.ts
- Test for user without social links
- Test for user with social links
- Test for non-existent user
```

---

## Result

| Step | Duration | Result |
|------|----------|--------|
| Reflect | 2 min | Symptoms and timeline documented |
| Hypotheses | 3 min | 4 hypotheses formulated |
| Diagnose | 10 min | Root cause found in commit a3f2c1d |
| Isolate | 5 min | Reproduction case created |
| Fix | 10 min | Fix + 3 regression tests |
| **Total** | **~30 min** | Bug fixed and secured |

---

## Variations

### Race Condition Instead of Null Reference

If hypothesis 2 (race condition) were correct, the debugging approach would be different:

- Diagnostic logging with timestamps at critical points
- Concurrency tests with multiple parallel requests
- Possibly lock mechanisms or optimistic concurrency control

### Bug Requires Architectural Change

If the bug reveals that the system is fundamentally designed incorrectly (e.g. synchronous instead of asynchronous processing), switch to the full workflow:

1. Debug agent documents the problem and analysis
2. Architect agent creates an ADR for the new architecture
3. Spec is written for the redesign
4. Tasks are created and orchestrated

### Heisenbug (Disappears Under Observation)

For bugs that only occur in production:

- Use distributed tracing (OpenTelemetry)
- Structured logging with correlation IDs
- Feature flags for controlled rollback
- Canary deployments for the fix

---

## Related Documentation

- [Workflow Phases](../workflow.md) -- When the full workflow makes sense
- [Agents Reference](../agents.md) -- Debug agent capabilities
- [How-To: Debugging Strategies](../how-to/develop-new-feature.md) -- Additional debugging patterns
