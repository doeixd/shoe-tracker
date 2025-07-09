import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Footprints,
  Clock,
  BarChart3,
  Trophy,
  Target,
  Activity,
  Sparkles,
} from "lucide-react";

interface DashboardLoadingProps {
  message?: string;
  showProgress?: boolean;
  holdDelay?: number;
}

export function DashboardLoading({
  message = "Loading your dashboard...",
  showProgress = true,
  holdDelay = 800,
}: DashboardLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const loadingSteps = [
    { icon: Footprints, label: "Loading your shoes...", color: "text-blue-500" },
    { icon: Activity, label: "Fetching recent runs...", color: "text-green-500" },
    { icon: BarChart3, label: "Calculating stats...", color: "text-purple-500" },
    { icon: Trophy, label: "Preparing insights...", color: "text-yellow-500" },
  ];

  // Progressive loading animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Progress simulation
  useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 95);
      });
    }, 200);

    // Step progression
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1200);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [showProgress, loadingSteps.length]);

  const currentStepData = loadingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {showContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              {/* App Logo/Brand */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center mb-4">
                  <motion.div
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut"
                    }}
                  >
                    <Footprints className="w-10 h-10 text-white" />
                  </motion.div>

                  {/* Sparkle effects */}
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                </div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  🏃‍♂️ MyShoeTracker
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-gray-600 text-sm"
                >
                  Track your running journey
                </motion.p>
              </motion.div>

              {/* Loading Spinner with Step Indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mb-8"
              >
                <div className="relative mx-auto w-24 h-24 mb-6">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>

                  {/* Animated progress ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-transparent"
                    style={{
                      background: `conic-gradient(from 0deg, #3b82f6 0deg, #8b5cf6 ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`,
                      borderRadius: "50%",
                      mask: "radial-gradient(circle, transparent 20px, black 22px)",
                      WebkitMask: "radial-gradient(circle, transparent 20px, black 22px)",
                    }}
                  />

                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      key={currentStep}
                      initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
                      transition={{ duration: 0.5 }}
                      className={`p-2 rounded-full bg-white shadow-lg ${currentStepData.color}`}
                    >
                      <currentStepData.icon className="w-6 h-6" />
                    </motion.div>
                  </div>
                </div>

                {/* Progress percentage */}
                {showProgress && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 1 }}
                    className="text-2xl font-bold text-gray-900 mb-2"
                  >
                    {Math.round(progress)}%
                  </motion.div>
                )}
              </motion.div>

              {/* Loading Message and Step */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="space-y-3"
              >
                <motion.h3
                  key={`message-${currentStep}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.4 }}
                  className="text-lg font-semibold text-gray-900"
                >
                  {message}
                </motion.h3>

                <motion.p
                  key={`step-${currentStep}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className={`text-sm font-medium ${currentStepData.color}`}
                >
                  {currentStepData.label}
                </motion.p>
              </motion.div>

              {/* Step Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="flex justify-center gap-2 mt-8"
              >
                {loadingSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? "bg-blue-500 scale-125"
                        : index < currentStep
                        ? "bg-green-400"
                        : "bg-gray-300"
                    }`}
                    animate={{
                      scale: index === currentStep ? 1.25 : 1,
                      opacity: index <= currentStep ? 1 : 0.4,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </motion.div>

              {/* Subtle loading tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 2 }}
                className="mt-12 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 shadow-sm"
              >
                <p className="text-xs text-gray-600 leading-relaxed">
                  💡 <strong>Tip:</strong> Log your runs regularly to get the most accurate mileage tracking and shoe wear insights.
                </p>
              </motion.div>

              {/* Background Pattern */}
              <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-blue-200/30 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -100, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 3,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Enhanced loading for initial auth state
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
      >
        {/* Animated Logo */}
        <motion.div
          className="relative mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center mb-8"
          animate={{
            rotateY: [0, 180, 360],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Footprints className="w-12 h-12 text-white" />

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl opacity-50 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-3xl font-bold text-gray-900 mb-3"
        >
          🏃‍♂️ MyShoeTracker
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-gray-600 mb-8"
        >
          Setting up your personalized experience
        </motion.p>

        {/* Animated dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DashboardLoading;
