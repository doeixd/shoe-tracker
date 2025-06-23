import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";
import {
  ConditionalMotion,
  ConditionalMotionPresets,
} from "~/components/ui/ConditionalMotion";
import { Button } from "~/components/FormComponents";
import {
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  Zap,
  Heart,
  Rocket,
  Target,
  Trophy,
} from "lucide-react";

export const Route = createFileRoute("/demo-animations")({
  component: DemoAnimations,
});

function DemoAnimations() {
  const { isFirstVisit, resetVisit, clearAllVisits, visitedRoutes } =
    useFirstVisit();

  const demoItems = [
    {
      title: "Card 1",
      description: "This card slides in from the left",
      icon: <Star className="w-6 h-6" />,
    },
    {
      title: "Card 2",
      description: "This card fades up from below",
      icon: <Zap className="w-6 h-6" />,
    },
    {
      title: "Card 3",
      description: "This card scales in smoothly",
      icon: <Heart className="w-6 h-6" />,
    },
    {
      title: "Card 4",
      description: "This card slides in from the right",
      icon: <Rocket className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0, y: -30 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.8 },
          })}
          className="text-center space-y-6"
        >
          <h1 className="text-5xl font-bold text-gray-900">
            First Visit Animation Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            This page demonstrates the first-visit animation system. Animations
            will only play on your first visit. Navigate away and come back to
            see the difference, or use the controls below to reset.
          </p>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white shadow-lg">
            {isFirstVisit ? (
              <>
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <span className="text-lg font-semibold text-yellow-600">
                  First Visit - Animations Active ✨
                </span>
              </>
            ) : (
              <>
                <Eye className="w-6 h-6 text-gray-500" />
                <span className="text-lg font-semibold text-gray-600">
                  Return Visit - Animations Disabled ⚡
                </span>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
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
        </motion.div>

        {/* Method 1: Basic getAnimationProps */}
        <section className="space-y-6">
          <motion.h2
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, x: -50 },
              animate: { opacity: 1, x: 0 },
              transition: { duration: 0.6, delay: 0.2 },
            })}
            className="text-3xl font-bold text-gray-800"
          >
            Method 1: getAnimationProps Utility
          </motion.h2>

          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.5, delay: 0.4 },
            })}
            className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Conditional Animation Example
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              This card uses the getAnimationProps utility function. On first
              visit, it scales in smoothly. On return visits, it appears
              instantly without animation.
            </p>
          </motion.div>
        </section>

        {/* Method 2: ConditionalMotion Wrapper */}
        <section className="space-y-6">
          <ConditionalMotion
            firstVisitAnimation={{
              initial: { opacity: 0, x: 50 },
              animate: { opacity: 1, x: 0 },
              transition: { duration: 0.6, delay: 0.6 },
            }}
          >
            <h2 className="text-3xl font-bold text-gray-800">
              Method 2: ConditionalMotion Wrapper
            </h2>
          </ConditionalMotion>

          <ConditionalMotion
            firstVisitAnimation={{
              initial: { opacity: 0, y: 30 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, delay: 0.8 },
            }}
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-8 rounded-3xl shadow-xl text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">
                  Wrapper Component Example
                </h3>
              </div>
              <p className="text-white/90 leading-relaxed">
                This card uses the ConditionalMotion wrapper component. It's
                perfect for when you want to wrap existing content with
                conditional animations without modifying the underlying
                structure.
              </p>
            </div>
          </ConditionalMotion>
        </section>

        {/* Method 3: Preset Components */}
        <section className="space-y-6">
          <motion.h2
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, x: -50 },
              animate: { opacity: 1, x: 0 },
              transition: { duration: 0.6 },
            })}
            className="text-3xl font-bold text-gray-800"
          >
            Method 3: Preset Components
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.5, delay: 0.2 },
              })}
              className="bg-white p-6 rounded-2xl shadow-lg"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Fade Up</h3>
                <p className="text-sm text-gray-600">Fades in from bottom</p>
              </div>
            </motion.div>

            <motion.div
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.3, delay: 0.3 },
              })}
              className="bg-white p-6 rounded-2xl shadow-lg"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Scale In</h3>
                <p className="text-sm text-gray-600">Scales in with fade</p>
              </div>
            </motion.div>

            <motion.div
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, x: -20 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.4, delay: 0.4 },
              })}
              className="bg-white p-6 rounded-2xl shadow-lg"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Slide Left</h3>
                <p className="text-sm text-gray-600">Slides in from left</p>
              </div>
            </motion.div>

            <motion.div
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, x: 20 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.4, delay: 0.5 },
              })}
              className="bg-white p-6 rounded-2xl shadow-lg"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto">
                  <Rocket className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Slide Right</h3>
                <p className="text-sm text-gray-600">Slides in from right</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Method 4: Staggered Animations */}
        <section className="space-y-6">
          <motion.h2
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5 },
            })}
            className="text-3xl font-bold text-gray-800"
          >
            Method 4: Staggered Animations
          </motion.h2>

          <div className="space-y-4">
            {demoItems.map((item, index) => (
              <motion.div
                key={index}
                {...getAnimationProps(isFirstVisit, {
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.3, delay: index * 0.1 },
                })}
              >
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Debug Information */}
        <motion.section
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.5, delay: 1.5 },
          })}
          className="bg-gray-900 text-white p-8 rounded-3xl space-y-4"
        >
          <h2 className="text-2xl font-bold mb-4">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-mono">
            <div>
              <div className="text-gray-400 mb-2">Current Route</div>
              <div className="text-green-400">{window.location.pathname}</div>
            </div>
            <div>
              <div className="text-gray-400 mb-2">Is First Visit</div>
              <div
                className={isFirstVisit ? "text-yellow-400" : "text-blue-400"}
              >
                {isFirstVisit.toString()}
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-2">Total Visited Routes</div>
              <div className="text-purple-400">{visitedRoutes.length}</div>
            </div>
          </div>

          {visitedRoutes.length > 0 && (
            <div className="mt-6">
              <div className="text-gray-400 mb-3">All Visited Routes:</div>
              <div className="space-y-1">
                {visitedRoutes.map((route, index) => (
                  <div key={index} className="text-green-400">
                    • {route}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">
            How to Test the System
          </h2>
          <div className="space-y-3 text-blue-800">
            <p>
              1. <strong>First Visit:</strong> Notice all the smooth animations
              as elements appear
            </p>
            <p>
              2. <strong>Navigate Away:</strong> Go to another route (Home,
              Shoes, etc.)
            </p>
            <p>
              3. <strong>Return Here:</strong> Come back to this demo page
            </p>
            <p>
              4. <strong>Notice:</strong> Content appears instantly without
              animations
            </p>
            <p>
              5. <strong>Reset:</strong> Use the "Reset This Route" button to
              re-enable animations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
