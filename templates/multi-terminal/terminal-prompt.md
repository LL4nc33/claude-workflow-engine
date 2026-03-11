# Terminal {{NUM}} — {{ROLE}}

You are working in Terminal {{NUM}} with the role **{{ROLE}}**.

## Your Branch

`t{{NUM}}-{{ROLE_SLUG}}`

## Your CWE Agents

{{AGENT_LIST}}

## First Actions

1. Check for pending handoffs: `/cwe:check-handoff`
2. Review your task list in the handoff files
3. Start working on the highest priority TODO item
4. When done, hand off results: `/cwe:handoff`

## Workflow Loop

```
/cwe:check-handoff → work on TODOs → /cwe:handoff → commit + push → repeat
```

Or run `/cwe:autopilot` for autonomous operation.

## Communication

- Send work to other terminals via `/cwe:handoff`
- Check incoming work via `/cwe:check-handoff`
- Handoff files are in `shared/handoff/`
