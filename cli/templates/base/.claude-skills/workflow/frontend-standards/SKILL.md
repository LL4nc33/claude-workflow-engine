---
name: frontend-standards
description: Frontend component and UI standards. Use PROACTIVELY when creating UI components, styling, implementing accessibility, or managing frontend state.
allowed-tools: Read, Grep, Glob, Bash
context: fork
agent: Explore
---

# Frontend Standards

## Instructions

Apply frontend standards from workflow/standards/frontend/ when:
- Creating new UI components
- Implementing component patterns
- Reviewing accessibility (a11y) compliance
- Setting up state management
- Structuring frontend project files

## Key Standards

### Component Structure
- One component per directory with co-located test and styles
- Functional components only (no class components)
- Props always explicitly typed with named interface
- Named exports for reusable, default exports only for pages
- Max 200 lines per component

### Naming
- Components: PascalCase (`UserProfile`)
- Props: `{ComponentName}Props`
- Hooks: `use{Purpose}` (`useAuth`, `useFormState`)
- Handlers: `handle{Event}` internal, `on{Event}` for props
- State: descriptive camelCase (`isLoading`, `userData`)

### Accessibility
- All interactive elements: keyboard accessible
- Images: alt text required
- Forms: labels required for inputs
- Color: never sole information carrier
- Semantic HTML over div soup

### State Management
- Local: useState for component-scoped
- Shared: Context or state library
- Server: React Query / SWR pattern
- URL: Router params for shareable state

## Application Triggers

This skill automatically applies when:
- Files matching `**/components/**`, `**/*.tsx`, `**/*.vue` are modified
- UI/UX discussions occur
- Accessibility requirements are mentioned
- Frontend build or bundler config is touched

## Reference Files
- @workflow/standards/frontend/components.md
