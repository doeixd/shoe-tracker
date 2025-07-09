# BackButton Component System

A unified back button system that provides consistent styling and behavior across the entire application.

## Overview

The BackButton system replaces all inconsistent back button implementations throughout the app with a single, configurable component that maintains design consistency and proper navigation behavior.

## Components

### `BackButton` (Base Component)

The main component that handles all back button functionality.

```tsx
import { BackButton } from "~/components/ui/BackButton";

<BackButton
  to="/shoes"
  context="shoes"
  variant="ghost"
  size="sm"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `to` | `string` | - | The route to navigate to when clicked |
| `search` | `Record<string, any>` | `{}` | Search parameters for the navigation |
| `label` | `string` | - | Custom label for the button |
| `variant` | `"ghost" \| "secondary" \| "outline"` | `"ghost"` | Visual variant of the button |
| `size` | `"sm" \| "md" \| "lg"` | `"sm"` | Size of the button |
| `showIcon` | `boolean` | `true` | Whether to show the arrow icon |
| `onClick` | `() => void` | - | Custom onClick handler (overrides navigation) |
| `className` | `string` | - | Additional CSS classes |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `useHistoryBack` | `boolean` | `false` | Whether to use browser history back instead of navigation |
| `fullWidth` | `boolean` | `false` | Full width button (useful for forms) |
| `context` | `"shoes" \| "runs" \| "collections" \| "analytics" \| "general"` | `"general"` | Context for generating appropriate label |

### Preset Components

#### Detail Page Back Buttons

Pre-configured back buttons for specific sections:

```tsx
import { BackToShoes, BackToRuns, BackToCollections, BackToAnalytics, BackToHome } from "~/components/ui/BackButton";

// Usage in detail pages
<BackToShoes />
<BackToRuns />
<BackToCollections />
<BackToAnalytics />
<BackToHome />
```

#### Form Back Buttons

```tsx
import { FormBackButton } from "~/components/ui/BackButton";

// In forms with cancel functionality
<FormBackButton
  onCancel={() => {
    // Handle form cancellation
    navigate({ to: "/previous-route" });
  }}
  disabled={isSubmitting}
/>
```

#### Error Page Back Buttons

```tsx
import { ErrorBackButton } from "~/components/ui/BackButton";

// In error boundaries and 404 pages
<ErrorBackButton />
```

## Design Patterns

### Detail Pages

For detail pages (shoes, runs, collections), use the contextual preset components:

```tsx
// ✅ Good
<BackToShoes />

// ❌ Avoid
<Button onClick={() => navigate('/shoes')}>
  <ArrowLeft /> Back to Shoes
</Button>
```

### Forms

For forms, use `FormBackButton` with proper cancel handling:

```tsx
// ✅ Good
<FormBackButton
  onCancel={() => {
    if (onCancel) {
      onCancel();
    } else {
      navigate({ to: "/fallback-route" });
    }
  }}
  disabled={isSubmitting}
/>

// ❌ Avoid
<Button variant="outline" onClick={handleCancel}>
  Cancel
</Button>
```

### Error Pages

For error pages and 404s, use `ErrorBackButton`:

```tsx
// ✅ Good
<ErrorBackButton />

// ❌ Avoid
<button onClick={() => window.history.back()}>
  Go Back
</button>
```

## Styling Guidelines

### Variants

- **`ghost`**: For detail pages and subtle navigation (default for detail pages)
- **`secondary`**: For forms and secondary actions (default for forms)
- **`outline`**: For error pages and standalone actions

### Contextual Labels

The component automatically generates appropriate labels based on context:

- `context="shoes"` → "Back to Shoes"
- `context="runs"` → "Back to Runs"  
- `context="collections"` → "Back to Collections"
- `context="analytics"` → "Back to Analytics"
- `context="general"` → "Back"

### Custom Labels

Override the contextual label when needed:

```tsx
<BackButton 
  to="/custom-route"
  label="Return to Dashboard"
/>
```

## Navigation Behavior

### Route Navigation (Recommended)

```tsx
<BackButton to="/shoes" search={{ modal: false }} />
```

### Custom onClick Handler

```tsx
<BackButton onClick={() => {
  // Custom logic
  handleUnsavedChanges();
  navigate({ to: "/somewhere" });
}} />
```

### Browser History Back

```tsx
<ErrorBackButton useHistoryBack={true} />
```

## Migration Guide

### Before (Inconsistent)

```tsx
// Various implementations across the app
<Button variant="ghost" onClick={() => navigate('/shoes')}>
  <ArrowLeft className="w-4 h-4" />
  Back to Shoes
</Button>

<button onClick={() => window.history.back()}>
  Go Back
</button>

<Button variant="outline" onClick={onCancel}>
  Cancel
</Button>
```

### After (Unified)

```tsx
// Consistent implementations
<BackToShoes />
<ErrorBackButton />
<FormBackButton onCancel={onCancel} />
```

## Benefits

1. **Consistency**: All back buttons look and behave the same way
2. **Maintainability**: Single source of truth for back button logic
3. **Accessibility**: Consistent keyboard navigation and ARIA labels
4. **Type Safety**: Proper TypeScript definitions prevent errors
5. **Performance**: Optimized navigation with proper state management
6. **Mobile-Friendly**: Consistent touch targets and responsive design

## Examples

### Detail Page Header

```tsx
function ShoeDetail() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackToShoes />
      </div>
      {/* Rest of component */}
    </div>
  );
}
```

### Form Footer

```tsx
function EditShoeForm({ shoe, onCancel }) {
  return (
    <form>
      {/* Form fields */}
      
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <FormBackButton
          onCancel={() => {
            onCancel?.() || navigate({ 
              to: "/shoes/$shoeId", 
              params: { shoeId: shoe.id } 
            });
          }}
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
```

### Error Boundary

```tsx
function ErrorFallback({ error }) {
  return (
    <div className="text-center space-y-4">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <div className="flex gap-2 justify-center">
        <ErrorBackButton />
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
```
