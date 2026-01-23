# Frontend Component Standards

## Component File Structure

```
src/components/
├── {ComponentName}/
│   ├── {ComponentName}.tsx       # Component logic
│   ├── {ComponentName}.test.tsx  # Tests
│   ├── {ComponentName}.styles.ts # Styles (if CSS-in-JS)
│   └── index.ts                  # Public export
```

## Naming Conventions

- Components: PascalCase (`UserProfile`, `NavBar`)
- Props interfaces: `{ComponentName}Props`
- Hooks: `use{Purpose}` (camelCase with `use` prefix)
- Event handlers: `handle{Event}` or `on{Event}` (for props)
- State variables: descriptive camelCase (`isLoading`, `userData`)

## Component Patterns

### Functional Components (Default)
```tsx
interface UserCardProps {
  user: User;
  onSelect?: (userId: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div onClick={() => onSelect?.(user.id)}>
      {user.name}
    </div>
  );
}
```

### Rules
- Functional components only (no class components)
- Props interface always explicitly typed
- Default exports only for pages/routes
- Named exports for reusable components
- Max 200 lines per component (extract if larger)

## Accessibility (a11y)

- All interactive elements must be keyboard accessible
- Images require alt text
- Form inputs require labels
- Color alone must not convey information
- Use semantic HTML (`button`, `nav`, `main`, not `div` for everything)

## State Management

- Local state: `useState` for component-scoped
- Shared state: Context or state library (project-dependent)
- Server state: React Query / SWR pattern
- URL state: Router params for shareable state

## TODO: Additional Sections

- [ ] Specific framework choice (React/Vue/Svelte)
- [ ] Design system integration
- [ ] Performance patterns (memo, lazy loading)
- [ ] Internationalization (i18n) approach
