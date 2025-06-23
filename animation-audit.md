# Animation Audit Report

Generated on: 2025-06-23T20:06:27.821Z

## Summary

- **Total files scanned**: 91
- **Files with animations**: 26
- **Total animation matches**: 844

## Pattern Distribution

| Pattern | Count | Description |
|---------|-------|-------------|
| motion.div | 154 | Motion div components |
| motion components | 176 | Any motion component |
| initial prop | 132 | Components with initial animation prop |
| animate prop | 224 | Components with animate prop |
| transition prop | 133 | Components with transition prop |
| framer-motion import | 25 | Files importing framer-motion |

## Migration Recommendations

### High Priority Files (Most animations)

#### src/components/Onboarding.tsx (156 animations)

- **motion.div**: 31 instances
  ```tsx
  <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
  <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-8"
          >
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
  ```
- **motion components**: 38 instances
  ```tsx
  <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
  <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-8"
          >
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
  ```
- **initial prop**: 25 instances
  ```tsx
  initial={{ opacity: 0, scale: 0.9 }
  initial={{ opacity: 0, y: 20 }
  initial={{ opacity: 0, y: 40 }
  ```
- **animate prop**: 32 instances
  ```tsx
  animate={{ opacity: 1, scale: 1 }
  animate={{ rotate: 360 }
  animate={{ opacity: 1, y: 0 }
  ```
- **transition prop**: 29 instances
  ```tsx
  transition={{ duration: 3, repeat: Infinity, ease: "linear" }
  transition={{ delay: 0.2 }
  transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion, AnimatePresence } from "motion/react"
  ```

#### src/components/loading/PageSkeletons.tsx (124 animations)

- **motion.div**: 10 instances
  ```tsx
  <motion.div
      initial={animate ? { opacity: 0.6 } : {}}
      animate={animate ? { opacity: [0.6, 1, 0.6] } : {}}
      transition={animate ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      } : {}}
      className={`bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
    />
  <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
  <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
  ```
- **motion components**: 10 instances
  ```tsx
  <motion.div
      initial={animate ? { opacity: 0.6 } : {}}
      animate={animate ? { opacity: [0.6, 1, 0.6] } : {}}
      transition={animate ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      } : {}}
      className={`bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
    />
  <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
  <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
  ```
- **initial prop**: 10 instances
  ```tsx
  initial={animate ? { opacity: 0.6 }
  initial={{ opacity: 0, y: 10 }
  initial={{ opacity: 0, y: 20 }
  ```
- **animate prop**: 83 instances
  ```tsx
  animate={animate ? { opacity: [0.6, 1, 0.6] }
  animate={{ opacity: 1, y: 0 }
  animate={animate}
  ```
- **transition prop**: 10 instances
  ```tsx
  transition={animate ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }
  transition={{ duration: 0.2, ease: "easeOut" }
  transition={{ duration: 0.5, delay: 0.1 }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion } from "motion/react"
  ```

#### src/components/ImageHandler.tsx (66 animations)

- **motion.div**: 15 instances
  ```tsx
  <motion.div
        className={cn(
          "relative border-2 border-dashed rounded-3xl transition-all duration-300 overflow-hidden",
          isDragOver && !disabled
            ? "border-primary-400 bg-primary-50 shadow-glow"
            : showError
              ? "border-red-300 bg-red-50"
              : hasImage
                ? "border-gray-200 bg-white shadow-soft"
                : "border-gray-200 hover:border-primary-300 hover:bg-gray-50",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!hasImage ? triggerFileSelect : undefined}
        whileHover={!disabled && !hasImage ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !hasImage ? { scale: 0.98 } : undefined}
      >
  <motion.div
              key="image-preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative will-change-transform"
            >
  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center"
                  >
  ```
- **motion components**: 17 instances
  ```tsx
  <motion.div
        className={cn(
          "relative border-2 border-dashed rounded-3xl transition-all duration-300 overflow-hidden",
          isDragOver && !disabled
            ? "border-primary-400 bg-primary-50 shadow-glow"
            : showError
              ? "border-red-300 bg-red-50"
              : hasImage
                ? "border-gray-200 bg-white shadow-soft"
                : "border-gray-200 hover:border-primary-300 hover:bg-gray-50",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!hasImage ? triggerFileSelect : undefined}
        whileHover={!disabled && !hasImage ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !hasImage ? { scale: 0.98 } : undefined}
      >
  <motion.div
              key="image-preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative will-change-transform"
            >
  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center"
                  >
  ```
- **initial prop**: 9 instances
  ```tsx
  initial={{ opacity: 0, scale: 0.98 }
  initial={{ opacity: 0 }
  initial={{ width: 0 }
  ```
- **animate prop**: 14 instances
  ```tsx
  animate={{ opacity: 1, scale: 1 }
  animate={{ opacity: 1 }
  animate={{ rotate: 360 }
  ```
- **transition prop**: 10 instances
  ```tsx
  transition={{ duration: 0.15, ease: "easeOut" }
  transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }
  transition={{ duration: 0.3 }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion, AnimatePresence } from "motion/react"
  ```

#### src/routes/shoes.index.tsx (62 animations)

- **motion.div**: 13 instances
  ```tsx
  <motion.div
      className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
      onClick={() =>
  <motion.div
          className={cn(
            "w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center",
            checked
              ? "bg-primary-600 border-primary-600"
              : "bg-white border-gray-300 hover:border-gray-400",
          )}
          animate={{
            scale: checked ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
        >
  <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
  ```
- **motion components**: 13 instances
  ```tsx
  <motion.div
      className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
      onClick={() =>
  <motion.div
          className={cn(
            "w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center",
            checked
              ? "bg-primary-600 border-primary-600"
              : "bg-white border-gray-300 hover:border-gray-400",
          )}
          animate={{
            scale: checked ? [1, 1.2, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
        >
  <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
  ```
- **initial prop**: 11 instances
  ```tsx
  initial={{ scale: 0, opacity: 0 }
  initial={{ opacity: 0, y: 20 }
  initial={{ opacity: 0, y: 20 }
  ```
- **animate prop**: 12 instances
  ```tsx
  animate={{
            scale: checked ? [1, 1.2, 1] : 1,
          }
  animate={{ scale: 1, opacity: 1 }
  animate={{ opacity: 1, y: 0 }
  ```
- **transition prop**: 12 instances
  ```tsx
  transition={{ duration: 0.2 }
  transition={{ duration: 0.1 }
  transition={{ duration: 0.5 }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion, AnimatePresence } from "motion/react"
  ```

#### src/routes/index.tsx (61 animations)

- **motion.div**: 12 instances
  ```tsx
  <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
  <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
  <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
  ```
- **motion components**: 12 instances
  ```tsx
  <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
  <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
  <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
  ```
- **initial prop**: 12 instances
  ```tsx
  initial={{ opacity: 0, y: 10 }
  initial={{ opacity: 0, y: 20 }
  initial={{ opacity: 0, y: 20 }
  ```
- **animate prop**: 12 instances
  ```tsx
  animate={{ opacity: 1, y: 0 }
  animate={{ opacity: 1, y: 0 }
  animate={{ opacity: 1, y: 0 }
  ```
- **transition prop**: 12 instances
  ```tsx
  transition={{ duration: 0.2, ease: "easeOut" }
  transition={{ duration: 0.5, delay: 0.1 }
  transition={{ duration: 0.3, delay: 0.15 }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion, AnimatePresence } from "motion/react"
  ```

#### src/routes/runs.index.tsx (51 animations)

- **motion.div**: 10 instances
  ```tsx
  <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
  <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
  <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
  ```
- **motion components**: 10 instances
  ```tsx
  <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
  <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
  <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
  ```
- **initial prop**: 10 instances
  ```tsx
  initial={{ opacity: 0, y: 20 }
  initial={{ opacity: 0, y: 20 }
  initial={{ opacity: 0, y: 20 }
  ```
- **animate prop**: 10 instances
  ```tsx
  animate={{ opacity: 1, y: 0 }
  animate={{ opacity: 1, y: 0 }
  animate={{ opacity: 1, y: 0 }
  ```
- **transition prop**: 10 instances
  ```tsx
  transition={{ duration: 0.5 }
  transition={{ duration: 0.5, delay: 0.1 }
  transition={{ duration: 0.3, delay: 0.15 }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion, AnimatePresence } from "motion/react"
  ```

#### src/components/loading/EnhancedLoading.tsx (41 animations)

- **motion.div**: 8 instances
  ```tsx
  <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
  <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
  <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
  ```
- **motion components**: 10 instances
  ```tsx
  <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
  <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
  <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
  ```
- **initial prop**: 7 instances
  ```tsx
  initial={{ opacity: 0 }
  initial={{ opacity: 0 }
  initial={{ opacity: 0 }
  ```
- **animate prop**: 8 instances
  ```tsx
  animate={{ opacity: 1 }
  animate={{ opacity: 1 }
  animate={{ opacity: 1 }
  ```
- **transition prop**: 7 instances
  ```tsx
  transition={{ duration: 0.2 }
  transition={{ duration: 0.3 }
  transition={{ duration: 0.3 }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion, AnimatePresence } from "motion/react"
  ```

#### src/routes/collections.$collectionId.tsx (41 animations)

- **motion.div**: 8 instances
  ```tsx
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-6"
          >
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
  <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
  ```
- **motion components**: 8 instances
  ```tsx
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-6"
          >
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
  <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
  ```
- **initial prop**: 8 instances
  ```tsx
  initial={{ opacity: 0, y: 20 }
  initial={{ opacity: 0, y: 20 }
  initial={{ opacity: 0, y: 20 }
  ```
- **animate prop**: 8 instances
  ```tsx
  animate={{ opacity: 1, y: 0 }
  animate={{ opacity: 1, y: 0 }
  animate={{ opacity: 1, y: 0 }
  ```
- **transition prop**: 8 instances
  ```tsx
  transition={{ duration: 0.5 }
  transition={{ duration: 0.5, delay: 0.1 }
  transition={{ duration: 0.5, delay: 0.2 }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion } from "motion/react"
  ```

#### src/components/loading/RouteHolding.tsx (38 animations)

- **motion.div**: 9 instances
  ```tsx
  <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl"
          >
  <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  background: `conic-gradient(from 0deg, transparent 0%, #3b82f6 ${progress}%, transparent ${progress}%)`,
                  clipPath: "circle(50%)",
                }}
              >
  <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[200px]"
            >
  ```
- **motion components**: 9 instances
  ```tsx
  <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl"
          >
  <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  background: `conic-gradient(from 0deg, transparent 0%, #3b82f6 ${progress}%, transparent ${progress}%)`,
                  clipPath: "circle(50%)",
                }}
              >
  <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[200px]"
            >
  ```
- **initial prop**: 8 instances
  ```tsx
  initial={{ opacity: 0, scale: 0.9 }
  initial={{ opacity: 0 }
  initial={{ opacity: 0 }
  ```
- **animate prop**: 9 instances
  ```tsx
  animate={{ opacity: 1, scale: 1 }
  animate={{ rotate: 360 }
  animate={{ opacity: 1 }
  ```
- **transition prop**: 2 instances
  ```tsx
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }
  transition={{ duration: 0.5, ease: "easeOut" }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion, AnimatePresence } from "motion/react"
  ```

#### src/routes/shoes.$shoeId.tsx (35 animations)

- **motion.div**: 6 instances
  ```tsx
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-6"
          >
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
  <motion.div
                      className={cn(
                        "h-3 rounded-full transition-all duration-300",
                        shoeData.stats.usageLevel === "new" ||
                          shoeData.stats.usageLevel === "good"
                          ? "bg-green-500"
                          : shoeData.stats.usageLevel === "moderate"
                            ? "bg-yellow-500"
                            : shoeData.stats.usageLevel === "high"
                              ? "bg-orange-500"
                              : "bg-red-500",
                      )}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, shoeData.stats.usagePercentage)}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
  ```
- **motion components**: 7 instances
  ```tsx
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-6"
          >
  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
  <motion.div
                      className={cn(
                        "h-3 rounded-full transition-all duration-300",
                        shoeData.stats.usageLevel === "new" ||
                          shoeData.stats.usageLevel === "good"
                          ? "bg-green-500"
                          : shoeData.stats.usageLevel === "moderate"
                            ? "bg-yellow-500"
                            : shoeData.stats.usageLevel === "high"
                              ? "bg-orange-500"
                              : "bg-red-500",
                      )}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, shoeData.stats.usagePercentage)}%`,
                      }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
  ```
- **initial prop**: 7 instances
  ```tsx
  initial={{ opacity: 0, y: 20 }
  initial={{ opacity: 0, y: 20 }
  initial={{ width: 0 }
  ```
- **animate prop**: 7 instances
  ```tsx
  animate={{ opacity: 1, y: 0 }
  animate={{ opacity: 1, y: 0 }
  animate={{
                        width: `${Math.min(100, shoeData.stats.usagePercentage)}
  ```
- **transition prop**: 7 instances
  ```tsx
  transition={{ duration: 0.5 }
  transition={{ duration: 0.5, delay: 0.1 }
  transition={{ duration: 0.8, delay: 0.3 }
  ```
- **framer-motion import**: 1 instances
  ```tsx
  import { motion } from "motion/react"
  ```


## Implementation Guide

### Step 1: Import the Hook

Add this import to files with animations:

```tsx
import { useFirstVisit, getAnimationProps } from '~/hooks/useFirstVisit';
```

### Step 2: Use the Hook

Add the hook at the component level:

```tsx
function MyComponent() {
  const { isFirstVisit } = useFirstVisit();

  // ... rest of component
}
```

### Step 3: Update Motion Components

**Before:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

**After:**
```tsx
<motion.div
  {...getAnimationProps(isFirstVisit, {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  })}
>
```

### Alternative: Use ConditionalMotion

```tsx
import { ConditionalMotion } from '~/components/ui/ConditionalMotion';

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

## All Files with Animations

### src/components/CollectionForm.tsx

**Total animations**: 6

- motion.div: 1
- motion components: 1
- initial prop: 1
- animate prop: 1
- transition prop: 1
- framer-motion import: 1

### src/components/EditCollectionForm.tsx

**Total animations**: 6

- motion.div: 1
- motion components: 1
- initial prop: 1
- animate prop: 1
- transition prop: 1
- framer-motion import: 1

### src/components/EditRunForm.tsx

**Total animations**: 6

- motion.div: 1
- motion components: 1
- initial prop: 1
- animate prop: 1
- transition prop: 1
- framer-motion import: 1

### src/components/ImageHandler.tsx

**Total animations**: 66

- motion.div: 15
- motion components: 17
- initial prop: 9
- animate prop: 14
- transition prop: 10
- framer-motion import: 1

### src/components/Onboarding.tsx

**Total animations**: 156

- motion.div: 31
- motion components: 38
- initial prop: 25
- animate prop: 32
- transition prop: 29
- framer-motion import: 1

### src/components/RunForm.tsx

**Total animations**: 6

- motion.div: 1
- motion components: 1
- initial prop: 1
- animate prop: 1
- transition prop: 1
- framer-motion import: 1

### src/components/examples/FirstVisitAnimationExample.tsx

**Total animations**: 15

- motion.div: 4
- motion components: 4
- initial prop: 2
- animate prop: 2
- transition prop: 2
- framer-motion import: 1

### src/components/loading/EnhancedLoading.tsx

**Total animations**: 41

- motion.div: 8
- motion components: 10
- initial prop: 7
- animate prop: 8
- transition prop: 7
- framer-motion import: 1

### src/components/loading/LoadingErrorBoundary.tsx

**Total animations**: 9

- motion.div: 1
- motion components: 4
- initial prop: 1
- animate prop: 1
- transition prop: 1
- framer-motion import: 1

### src/components/loading/PageSkeletons.tsx

**Total animations**: 124

- motion.div: 10
- motion components: 10
- initial prop: 10
- animate prop: 83
- transition prop: 10
- framer-motion import: 1

### src/components/loading/ProgressiveLoading.tsx

**Total animations**: 16

- motion.div: 3
- motion components: 5
- initial prop: 3
- animate prop: 3
- transition prop: 1
- framer-motion import: 1

### src/components/loading/RouteHolding.tsx

**Total animations**: 38

- motion.div: 9
- motion components: 9
- initial prop: 8
- animate prop: 9
- transition prop: 2
- framer-motion import: 1

### src/components/ui/Cards.tsx

**Total animations**: 1

- framer-motion import: 1

### src/components/ui/ConditionalMotion.tsx

**Total animations**: 1

- framer-motion import: 1

### src/components/ui/EnhancedImage.tsx

**Total animations**: 23

- motion.div: 2
- motion components: 5
- initial prop: 5
- animate prop: 5
- transition prop: 5
- framer-motion import: 1

### src/components/ui/ShoeCard.tsx

**Total animations**: 20

- motion.div: 4
- motion components: 6
- initial prop: 2
- animate prop: 2
- transition prop: 5
- framer-motion import: 1

### src/components/ui/ShoeCardSkeleton.tsx

**Total animations**: 11

- motion.div: 2
- motion components: 2
- initial prop: 2
- animate prop: 2
- transition prop: 2
- framer-motion import: 1

### src/hooks/useFirstVisit.ts

**Total animations**: 7

- motion.div: 2
- motion components: 2
- initial prop: 1
- animate prop: 1
- transition prop: 1

### src/routes/collections.$collectionId.tsx

**Total animations**: 41

- motion.div: 8
- motion components: 8
- initial prop: 8
- animate prop: 8
- transition prop: 8
- framer-motion import: 1

### src/routes/collections.index.tsx

**Total animations**: 11

- motion.div: 5
- motion components: 5
- framer-motion import: 1

### src/routes/index.tsx

**Total animations**: 61

- motion.div: 12
- motion components: 12
- initial prop: 12
- animate prop: 12
- transition prop: 12
- framer-motion import: 1

### src/routes/loading-demo.tsx

**Total animations**: 25

- motion.div: 4
- motion components: 4
- initial prop: 4
- animate prop: 8
- transition prop: 4
- framer-motion import: 1

### src/routes/runs.index.tsx

**Total animations**: 51

- motion.div: 10
- motion components: 10
- initial prop: 10
- animate prop: 10
- transition prop: 10
- framer-motion import: 1

### src/routes/runs.new.tsx

**Total animations**: 6

- motion.div: 1
- motion components: 1
- initial prop: 1
- animate prop: 1
- transition prop: 1
- framer-motion import: 1

### src/routes/shoes.$shoeId.tsx

**Total animations**: 35

- motion.div: 6
- motion components: 7
- initial prop: 7
- animate prop: 7
- transition prop: 7
- framer-motion import: 1

### src/routes/shoes.index.tsx

**Total animations**: 62

- motion.div: 13
- motion components: 13
- initial prop: 11
- animate prop: 12
- transition prop: 12
- framer-motion import: 1


## Next Steps

1. **Review high-priority files** listed above
2. **Start with route-level components** (pages in src/routes/)
3. **Test each migration** by visiting routes and checking animations
4. **Use development controls** to reset visits during testing
5. **Consider accessibility** and reduced motion preferences

## Development Commands

```bash
# Reset all visits for testing
localStorage.removeItem('visited_routes');

# Or use the hook's reset functions
const { resetVisit, clearAllVisits } = useFirstVisit();
```

---

*Report generated by find-animations.js*
