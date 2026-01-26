---
name: mcp-usage
description: MCP Tool catalog and usage guide. Use when doing semantic code analysis, symbol navigation, PR review, MCP, Serena, Greptile
---

# MCP Tools - Usage Guide

## Available MCP Servers

### Serena (Semantic Code Analysis)

Serena provides semantic code navigation and manipulation via Language Server.

| Tool | Function | Typical Use |
|------|----------|-------------|
| `get_symbols_overview` | List symbols in a file | Understand file structure |
| `find_symbol` | Find symbol by name path | Locate class/method |
| `find_referencing_symbols` | Find references to a symbol | Track dependencies |
| `replace_symbol_body` | Replace symbol body | Precise code changes |
| `search_for_pattern` | Regex search in codebase | Pattern recognition |
| `insert_after_symbol` | Insert code after a symbol | Add new methods |
| `insert_before_symbol` | Insert code before a symbol | Add imports |
| `rename_symbol` | Rename symbol codebase-wide | Refactoring |
| `read_file` | Read file (with line range) | Get context |

#### Examples

```
# Find all methods of a class
find_symbol(name_path_pattern="MyClass", depth=1, include_body=False)

# Who calls this method?
find_referencing_symbols(name_path="MyClass/myMethod", relative_path="src/service.ts")

# Overview of file structure
get_symbols_overview(relative_path="src/controllers/auth.ts", depth=1)

# Replace method
replace_symbol_body(name_path="MyClass/myMethod", relative_path="src/service.ts", body="...")
```

### Greptile (PR & Code Review)

Greptile provides access to Pull Requests, Code Reviews and review comments.

| Tool | Function | Typical Use |
|------|----------|-------------|
| `list_merge_requests` | List PRs | Check open work |
| `get_merge_request` | Get PR details | Understand PR context |
| `list_merge_request_comments` | List PR comments | Read review feedback |
| `search_greptile_comments` | Search review comments | Find patterns in feedback |
| `trigger_code_review` | Trigger code review | Automatic reviews |
| `list_custom_context` | List custom context | Check org-wide rules |
| `create_custom_context` | Create custom context | New review rules |

#### Examples

```
# Check open PRs
list_merge_requests(state="open")

# PR details with review status
get_merge_request(name="owner/repo", remote="github", defaultBranch="main", prNumber=42)

# Search security comments in reviews
search_greptile_comments(query="authentication vulnerability")
```

## Agent-Tool Matrix

| Agent | Serena Tools | Greptile Tools |
|-------|-------------|----------------|
| **architect** | find_symbol, get_symbols_overview, find_referencing_symbols | - |
| **builder** | find_referencing_symbols, replace_symbol_body, find_symbol, get_symbols_overview | - |
| **devops** | - | - |
| **explainer** | get_symbols_overview, find_symbol | - |
| **guide** | search_for_pattern, get_symbols_overview | - |
| **innovator** | - | - |
| **quality** | find_symbol, get_symbols_overview | search_greptile_comments |
| **researcher** | search_for_pattern, find_symbol, get_symbols_overview | - |
| **security** | - | search_greptile_comments, list_merge_request_comments |

## When MCP Tools vs Standard Tools?

| Situation | Standard Tool | MCP Tool (better) |
|-----------|---------------|-------------------|
| "Where is X called?" | Grep | find_referencing_symbols |
| "What methods does class Y have?" | Read (whole file) | find_symbol + depth=1 |
| "Replace method Z" | Edit (string match) | replace_symbol_body |
| "Rename variable" | Grep + Edit | rename_symbol |
| "Understand file structure" | Read (whole file) | get_symbols_overview |
| "Open PRs?" | Bash(gh pr list) | list_merge_requests |

## Prerequisites

MCP tools are only available when the corresponding servers are configured:
- **Serena:** Requires `.serena/` configuration in project
- **Greptile:** Requires Greptile account and API key

If an MCP server is unavailable, agents automatically fall back to standard tools.
