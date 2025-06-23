# First Visit Animations

This guide explains how to implement animations that only show on the first visit to each route in your application.

## Overview

The first visit animation system tracks which routes users have visited and conditionally applies animations only on the first visit. This creates a smoother user experience by avoiding repetitive animations on return visits while still providing engaging intro animations for new content.

## Features

- **Route-based tracking**: Each route is tracked independently
- **Persistent storage**: Visit history is stored in localStorage
- **Multiple implementation methods**: Choose the approach that best fits your needs
- **Preset animations**: Common animation patterns ready to use
- **Staggered animations**: Support for list items and complex layouts
- **Development controls**: Reset and debug utilities

## Quick Start

### 1. Basic Hook Usage

```tsx
import { useFirstVisit } from '~/hooks/useFirstVisit';
import { motion } from 'motion/react';

function MyComponent() {
  const { isFirstVisit } = useFirstVisit();

  return (
    <motion.div
      initial={isFirstVisit ? { opacity: 0, y: 20 } : false}
      animate={isFirstVisit ? { opacity: 1, y: 0 } : false}
      transition={isFirstVisit ? { duration: 0.5 } : { duration: 0 }}
    >
      Content that animates on first visit
    </motion.div>
  );
}
```

### 2. Using the Utility Function (Recommended)

```tsx
import { useFirstVisit, getAnimationProps } from '~/hooks/useFirstVisit';
import { motion } from 'motion/react';

function MyComponent() {
  const { isFirstVisit } = useFirstVisit();

  return (
    <motion.div
      {...getAnimationProps(isFirstVisit, {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
      })}
    >
      Content with cleaner animation props
    </motion.div>
  );
}
```

### 3. Using the Wrapper Component (Easiest)

```tsx
import { ConditionalMotion } from '~/components/ui/ConditionalMotion';

function MyComponent() {
  return (
    <ConditionalMotion
      firstVisitAnimation={{
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
      }}
    >
      Content with wrapper component
    </ConditionalMotion>
  );
}
```

## Implementation Methods

### Method 1: Basic Hook

**Best for**: Simple cases where you need full control over animation logic.

```tsx
const { isFirstVisit, markAsVisited, resetVisit } = useFirstVisit();

// Manual control
if (isFirstVisit) {
  // Show animation
} else {
  // Skip animation
}
```

### Method 2: getAnimationProps Utility

**Best for**: Existing motion.div components that you want to make conditional.

```tsx
const { isFirstVisit } = useFirstVisit();

<motion.div
  {...getAnimationProps(isFirstVisit, {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  })}
  className="my-component"
>
  Content
</motion.div>
```

### Method 3: ConditionalMotion Component

**Best for**: New components or when you want a clean wrapper approach.

```tsx
<ConditionalMotion
  firstVisitAnimation={{
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  }}
  className="my-component"
>
  Content
</ConditionalMotion>
```

### Method 4: Preset Components

**Best for**: Common animation patterns with minimal code.

```tsx
import { ConditionalMotionPresets } from '~/components/ui/ConditionalMotion';

// Fade up from bottom
<ConditionalMotionPresets.FadeUp>
  Content
</ConditionalMotionPresets.FadeUp>

// Scale in with fade
<ConditionalMotionPresets.ScaleIn>
  Content
</ConditionalMotionPresets.ScaleIn>

// Slide in from left
<ConditionalMotionPresets.SlideInLeft>
  Content
</ConditionalMotionPresets.SlideInLeft>

// Slide in from right
<ConditionalMotionPresets.SlideInRight>
  Content
</ConditionalMotionPresets.SlideInRight>
```

## Advanced Usage

### Staggered Animations

For lists or grids where items should animate in sequence:

```tsx
<ConditionalMotionPresets.StaggerChildren staggerDelay={0.1}>
  {items.map((item, index) => (
    <ConditionalMotionPresets.StaggerChild key={index}>
      <div className="card">
        {item.title}
      </div>
    </ConditionalMotionPresets.StaggerChild>
  ))}
</ConditionalMotionPresets.StaggerChildren>
```

### Route-Specific Tracking

Track different routes independently:

```tsx
// Track a specific route instead of current route
const { isFirstVisit } = useFirstVisit({ route: '/specific-route' });

// Or track sub-sections within a route
const { isFirstVisit: isFirstCardVisit } = useFirstVisit({ 
  route: '/collections/cards' 
});
const { isFirstVisit: isFirstListVisit } = useFirstVisit({ 
  route: '/collections/list' 
});
```

### Custom Animations

Create reusable animation components:

```tsx
import { useConditionalMotion } from '~/components/ui/ConditionalMotion';

function MyComponent() {
  const ConditionalCard = useConditionalMotion({
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    transition: { duration: 0.6 }
  });

  return (
    <ConditionalCard className="card">
      Card content with custom animation
    </ConditionalCard>
  );
}
```

## Migration Guide

### Converting Existing Animations

**Before:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

**After (Method 2 - Recommended):**
```tsx
const { isFirstVisit } = useFirstVisit();

<motion.div
  {...getAnimationProps(isFirstVisit, {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  })}
>
  Content
</motion.div>
```

**After (Method 3 - Alternative):**
```tsx
<ConditionalMotion
  firstVisitAnimation={{
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }}
>
  Content
</ConditionalMotion>
```

### Batch Migration Script

For large-scale migration, consider this approach:

1. Identify all `motion.div` components with animations
2. Add the `useFirstVisit` hook at the component level
3. Replace animation props with `getAnimationProps` wrapper
4. Test each route to ensure animations work correctly

## Best Practices

### 1. Animation Timing

- Keep first-visit animations under 1 second
- Use easing curves for natural motion
- Consider reduced motion preferences

```tsx
const animationConfig = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { 
    duration: 0.5,
    ease: "easeOut"  // Natural easing
  }
};
```

### 2. Performance Considerations

- Animations are automatically disabled on return visits
- Use `transform` properties (x, y, scale) over layout properties
- Avoid animating expensive properties like `height` or `width`

### 3. Accessibility

The system respects user motion preferences:

```tsx
// Consider adding respect for prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const animationConfig = {
  initial: prefersReducedMotion ? false : { opacity: 0, y: 20 },
  animate: prefersReducedMotion ? false : { opacity: 1, y: 0 },
  transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }
};
```

### 4. Testing

- Use the `reset` option to test animations during development
- Clear localStorage to test first-visit behavior
- Test on different devices and connection speeds

## Development Tools

### Reset Controls

```tsx
function DevControls() {
  const { resetVisit, clearAllVisits } = useFirstVisit();

  return (
    <div className="dev-controls">
      <button onClick={resetVisit}>Reset Current Route</button>
      <button onClick={clearAllVisits}>Clear All Visits</button>
    </div>
  );
}
```

### Debug Information

```tsx
function DebugInfo() {
  const { isFirstVisit, visitedRoutes } = useFirstVisit();

  return (
    <div className="debug-info">
      <p>First Visit: {isFirstVisit.toString()}</p>
      <p>Visited Routes: {visitedRoutes.length}</p>
      <ul>
        {visitedRoutes.map(route => (
          <li key={route}>{route}</li>
        ))}
      </ul>
    </div>
  );
}
```

## API Reference

### useFirstVisit Hook

```tsx
interface FirstVisitOptions {
  route?: string;           // Custom route to track
  reset?: boolean;          // Reset visit status
  disablePersistence?: boolean; // Disable localStorage
}

function useFirstVisit(options?: FirstVisitOptions): {
  isFirstVisit: boolean;    // Whether this is the first visit
  markAsVisited: () => void; // Manually mark as visited
  resetVisit: () => void;   // Reset visit status
  clearAllVisits: () => void; // Clear all visit history
  visitedRoutes: string[];  // Array of all visited routes
}
```

### getAnimationProps Function

```tsx
function getAnimationProps(
  isFirstVisit: boolean,
  animationProps: {
    initial?: any;
    animate?: any;
    transition?: any;
    exit?: any;
  }
): MotionProps | { initial: false; animate: false; /* ... */ }
```

### ConditionalMotion Component

```tsx
interface ConditionalMotionProps {
  firstVisitAnimation?: {
    initial?: any;
    animate?: any;
    transition?: any;
    exit?: any;
  };
  route?: string;
  disablePersistence?: boolean;
  children: React.ReactNode;
  as?: keyof typeof motion | React.ComponentType<any>;
  // ... other motion props
}
```

## Common Patterns

### Card Grids

```tsx
function CardGrid({ items }) {
  const { isFirstVisit } = useFirstVisit();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3, delay: index * 0.1 }
          })}
          className="card"
        >
          {item.content}
        </motion.div>
      ))}
    </div>
  );
}
```

### Page Headers

```tsx
function PageHeader({ title, description }) {
  return (
    <ConditionalMotionPresets.FadeUp>
      <div className="page-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </ConditionalMotionPresets.FadeUp>
  );
}
```

### Form Sections

```tsx
function FormSection({ children }) {
  return (
    <ConditionalMotion
      firstVisitAnimation={{
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.4 }
      }}
      className="form-section"
    >
      {children}
    </ConditionalMotion>
  );
}
```

## Troubleshooting

### Animations Not Working

1. **Check if route is being tracked correctly**
   ```tsx
   const { isFirstVisit, visitedRoutes } = useFirstVisit();
   console.log('First visit:', isFirstVisit);
   console.log('Current route:', window.location.pathname);
   console.log('Visited routes:', visitedRoutes);
   ```

2. **Clear localStorage if testing**
   ```tsx
   localStorage.removeItem('visited_routes');
   ```

3. **Verify animation props are being applied**
   ```tsx
   const animationProps = getAnimationProps(isFirstVisit, yourAnimation);
   console.log('Animation props:', animationProps);
   ```

### Performance Issues

1. **Reduce animation complexity on mobile**
2. **Use transform properties instead of layout properties**
3. **Consider disabling animations for slow connections**

### Storage Issues

1. **localStorage not available**: System gracefully falls back to session-only tracking
2. **Storage quota exceeded**: Implement cleanup for old routes
3. **Privacy mode**: Animations work but won't persist between sessions

## Examples

See `src/components/examples/FirstVisitAnimationExample.tsx` for a comprehensive demonstration of all implementation methods.

## Contributing

When adding new animation patterns:

1. Add them to `ConditionalMotionPresets`
2. Document the pattern in this guide
3. Add examples to the demo component
4. Test across different devices and browsers