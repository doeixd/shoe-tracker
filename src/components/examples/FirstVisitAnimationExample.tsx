import React from 'react';
import { motion } from 'motion/react';
import { useFirstVisit, getAnimationProps } from '~/hooks/useFirstVisit';
import { ConditionalMotion, ConditionalMotionPresets } from '~/components/ui/ConditionalMotion';
import { Button } from '~/components/FormComponents';
import { Sparkles, RefreshCw, Eye, EyeOff } from 'lucide-react';

/**
 * Comprehensive example showing different ways to implement first-visit animations
 *
 * This component demonstrates:
 * 1. Basic hook usage with motion.div
 * 2. Using the getAnimationProps utility
 * 3. ConditionalMotion wrapper component
 * 4. Preset animation components
 * 5. Staggered animations
 * 6. Manual visit tracking controls
 */
export function FirstVisitAnimationExample() {
  const { isFirstVisit, resetVisit, clearAllVisits, visitedRoutes } = useFirstVisit();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            First Visit Animation Examples
          </h1>
          <p className="text-lg text-gray-600">
            Animations that only show on the first visit to this route
          </p>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 text-sm">
            {isFirstVisit ? (
              <>
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-600 font-medium">First Visit - Animations Active</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Return Visit - Animations Disabled</span>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              onClick={resetVisit}
              icon={<RefreshCw className="w-4 h-4" />}
              variant="outline"
              size="sm"
            >
              Reset This Route
            </Button>
            <Button
              onClick={clearAllVisits}
              icon={<EyeOff className="w-4 h-4" />}
              variant="outline"
              size="sm"
            >
              Clear All Visits
            </Button>
          </div>
        </div>

        {/* Method 1: Basic Hook Usage */}
        <ExampleSection title="Method 1: Basic Hook Usage">
          <BasicHookExample />
        </ExampleSection>

        {/* Method 2: getAnimationProps Utility */}
        <ExampleSection title="Method 2: getAnimationProps Utility">
          <GetAnimationPropsExample />
        </ExampleSection>

        {/* Method 3: ConditionalMotion Component */}
        <ExampleSection title="Method 3: ConditionalMotion Component">
          <ConditionalMotionExample />
        </ExampleSection>

        {/* Method 4: Preset Components */}
        <ExampleSection title="Method 4: Preset Components">
          <PresetComponentsExample />
        </ExampleSection>

        {/* Method 5: Staggered Animations */}
        <ExampleSection title="Method 5: Staggered Animations">
          <StaggeredAnimationExample />
        </ExampleSection>

        {/* Debug Info */}
        <div className="bg-gray-900 text-white p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4">Debug Info</h3>
          <div className="space-y-2 text-sm font-mono">
            <div>Current Route: {window.location.pathname}</div>
            <div>Is First Visit: {isFirstVisit.toString()}</div>
            <div>Visited Routes: {visitedRoutes.length}</div>
            <div className="mt-4">
              <div className="text-gray-400 mb-2">All Visited Routes:</div>
              {visitedRoutes.length > 0 ? (
                <ul className="space-y-1">
                  {visitedRoutes.map((route, index) => (
                    <li key={index} className="text-green-400">• {route}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">None</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExampleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function BasicHookExample() {
  const { isFirstVisit } = useFirstVisit();

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Code:</h4>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`const { isFirstVisit } = useFirstVisit();

<motion.div
  initial={isFirstVisit ? { opacity: 0, y: 20 } : false}
  animate={isFirstVisit ? { opacity: 1, y: 0 } : false}
  transition={isFirstVisit ? { duration: 0.5 } : { duration: 0 }}
>
  Content
</motion.div>`}
        </pre>
      </div>

      <motion.div
        initial={isFirstVisit ? { opacity: 0, y: 20 } : false}
        animate={isFirstVisit ? { opacity: 1, y: 0 } : false}
        transition={isFirstVisit ? { duration: 0.5 } : { duration: 0 }}
        className="bg-white p-6 rounded-2xl shadow-sm border"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Basic Hook Example
        </h3>
        <p className="text-gray-600">
          This card uses the basic hook pattern with conditional animation props.
        </p>
      </motion.div>
    </div>
  );
}

function GetAnimationPropsExample() {
  const { isFirstVisit } = useFirstVisit();

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Code:</h4>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`const { isFirstVisit } = useFirstVisit();

<motion.div
  {...getAnimationProps(isFirstVisit, {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  })}
>
  Content
</motion.div>`}
        </pre>
      </div>

      <motion.div
        {...getAnimationProps(isFirstVisit, {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.3 }
        })}
        className="bg-white p-6 rounded-2xl shadow-sm border"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          getAnimationProps Example
        </h3>
        <p className="text-gray-600">
          This card uses the getAnimationProps utility for cleaner code.
        </p>
      </motion.div>
    </div>
  );
}

function ConditionalMotionExample() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Code:</h4>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`<ConditionalMotion
  firstVisitAnimation={{
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  }}
  className="bg-white p-6 rounded-2xl shadow-sm border"
>
  Content
</ConditionalMotion>`}
        </pre>
      </div>

      <ConditionalMotion
        firstVisitAnimation={{
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.4 }
        }}
        className="bg-white p-6 rounded-2xl shadow-sm border"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ConditionalMotion Example
        </h3>
        <p className="text-gray-600">
          This card uses the ConditionalMotion wrapper component.
        </p>
      </ConditionalMotion>
    </div>
  );
}

function PresetComponentsExample() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Code:</h4>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`<ConditionalMotionPresets.FadeUp className="...">
  Fade Up Content
</ConditionalMotionPresets.FadeUp>

<ConditionalMotionPresets.ScaleIn className="...">
  Scale In Content
</ConditionalMotionPresets.ScaleIn>

<ConditionalMotionPresets.SlideInLeft className="...">
  Slide In Left Content
</ConditionalMotionPresets.SlideInLeft>`}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ConditionalMotionPresets.FadeUp className="bg-white p-6 rounded-2xl shadow-sm border">
          <h4 className="font-medium text-gray-900 mb-2">Fade Up</h4>
          <p className="text-sm text-gray-600">Fades in from bottom</p>
        </ConditionalMotionPresets.FadeUp>

        <ConditionalMotionPresets.ScaleIn className="bg-white p-6 rounded-2xl shadow-sm border">
          <h4 className="font-medium text-gray-900 mb-2">Scale In</h4>
          <p className="text-sm text-gray-600">Scales in with fade</p>
        </ConditionalMotionPresets.ScaleIn>

        <ConditionalMotionPresets.SlideInLeft className="bg-white p-6 rounded-2xl shadow-sm border">
          <h4 className="font-medium text-gray-900 mb-2">Slide In Left</h4>
          <p className="text-sm text-gray-600">Slides in from left</p>
        </ConditionalMotionPresets.SlideInLeft>
      </div>
    </div>
  );
}

function StaggeredAnimationExample() {
  const items = [
    { title: "First Item", desc: "This appears first" },
    { title: "Second Item", desc: "This appears second" },
    { title: "Third Item", desc: "This appears third" },
    { title: "Fourth Item", desc: "This appears fourth" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Code:</h4>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`<ConditionalMotionPresets.StaggerChildren staggerDelay={0.1}>
  {items.map((item, index) => (
    <ConditionalMotionPresets.StaggerChild key={index}>
      <div className="bg-white p-4 rounded-xl">
        {item.title}
      </div>
    </ConditionalMotionPresets.StaggerChild>
  ))}
</ConditionalMotionPresets.StaggerChildren>`}
        </pre>
      </div>

      <ConditionalMotionPresets.StaggerChildren staggerDelay={0.1} className="space-y-3">
        {items.map((item, index) => (
          <ConditionalMotionPresets.StaggerChild key={index}>
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          </ConditionalMotionPresets.StaggerChild>
        ))}
      </ConditionalMotionPresets.StaggerChildren>
    </div>
  );
}

export default FirstVisitAnimationExample;
