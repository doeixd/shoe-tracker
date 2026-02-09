import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCreateCollectionMutation, useCreateShoeMutation } from "~/queries";
import { Button, Input, Textarea, ColorPicker } from "./FormComponents";
import { useAuth } from "./AuthProvider";
import { motion, AnimatePresence } from "motion/react";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";
import {
  Footprints,
  Plus,
  X,
  CheckCircle,
  Sparkles,
  Target,
  BarChart3,
  FolderOpen,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "./ui/ui";
import {
  COLLECTION_ICON_OPTIONS,
  DEFAULT_COLLECTION_ICON,
  getCollectionIcon,
} from "~/lib/collectionIcons";

interface OnboardingProps {
  onComplete: () => void;
}

function withAlpha(hexColor: string | undefined, alpha: number) {
  const hex = (hexColor || "#3b82f6").replace("#", "");
  const normalized = hex.length === 3
    ? hex.split("").map((char) => `${char}${char}`).join("")
    : hex;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(59, 130, 246, ${alpha})`;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const createCollectionMutation = useCreateCollectionMutation();
  const createShoeMutation = useCreateShoeMutation();
  const { isFirstVisit } = useFirstVisit({ route: "/onboarding" });

  const [step, setStep] = useState(1);
  const [createdCollections, setCreatedCollections] = useState<any[]>([]);
  const [collections, setCollections] = useState([
    {
      name: "Road",
      description: "Daily training and road running shoes",
      color: "#3b82f6",
      icon: "footprints",
    },
    {
      name: "Trail",
      description: "Off-road and trail running shoes",
      color: "#16a34a",
      icon: "mountain",
    },
    {
      name: "Racing",
      description: "Competition and tempo run shoes",
      color: "#ef4444",
      icon: "trophy",
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle auth edge cases
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Please sign in to continue");
      navigate({ to: "/auth/signin", search: { redirect: "/" } });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Beautiful loading screen
  if (authLoading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-radial from-primary-100/30 to-transparent rounded-full animate-pulse-gentle" />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-radial from-blue-100/30 to-transparent rounded-full animate-pulse-gentle"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <motion.div
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
          })}
          className="text-center relative z-10"
        >
          <motion.div
            animate={isFirstVisit ? { rotate: 360 } : {}}
            transition={
              isFirstVisit
                ? { duration: 3, repeat: Infinity, ease: "linear" }
                : {}
            }
            className="w-20 h-20 mx-auto mb-8"
          >
            <div className="w-full h-full rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 flex items-center justify-center shadow-large floating-element">
              <Footprints className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.2 },
            })}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <motion.div
                animate={isFirstVisit ? { scale: [1, 1.2, 1] } : {}}
                transition={
                  isFirstVisit
                    ? {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    : {}
                }
                className="w-2 h-2 bg-primary-500 rounded-full"
              />
              <motion.div
                animate={isFirstVisit ? { scale: [1, 1.2, 1] } : {}}
                transition={
                  isFirstVisit
                    ? {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.2,
                      }
                    : {}
                }
                className="w-2 h-2 bg-primary-400 rounded-full"
              />
              <motion.div
                animate={isFirstVisit ? { scale: [1, 1.2, 1] } : {}}
                transition={
                  isFirstVisit
                    ? {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.4,
                      }
                    : {}
                }
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            </div>
            <h3 className="text-2xl font-bold text-gradient">
              Setting up your running journey
            </h3>
            <p className="text-base text-gray-600 max-w-sm mx-auto">
              We're preparing everything you need for an amazing experience
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Track Your Shoes",
      description: "Monitor usage and know when it's time for a replacement",
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Log Your Runs",
      description: "Record detailed metrics and performance data",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Smart Alerts",
      description: "Get notified when shoes need replacement",
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
    {
      icon: <FolderOpen className="w-6 h-6" />,
      title: "Organize Collections",
      description: "Group shoes by type, brand, or purpose",
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Performance Analytics",
      description: "View comprehensive running statistics",
      color: "text-rose-700",
      bg: "bg-rose-50",
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Best-in-Class UX",
      description: "Beautiful, mobile-first design that delights",
      color: "text-indigo-700",
      bg: "bg-indigo-50",
    },
  ];

  const handleAddCollection = () => {
    setCollections([
      ...collections,
      {
        name: "",
        description: "",
        color: "#8b5cf6",
        icon: DEFAULT_COLLECTION_ICON,
      },
    ]);
  };

  const handleUpdateCollection = (
    index: number,
    field: keyof (typeof collections)[0],
    value: string,
  ) => {
    const updated = [...collections];
    updated[index] = { ...updated[index], [field]: value };
    setCollections(updated);
  };

  const handleRemoveCollection = (index: number) => {
    setCollections(collections.filter((_, i) => i !== index));
  };

  const handleCreateCollections = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Authentication required. Please sign in again.");
      navigate({ to: "/auth/signin", search: { redirect: "/" } });
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const validCollections = collections.filter((c) => c.name.trim());

      if (validCollections.length === 0) {
        setError("Please add at least one collection with a name");
        toast.error("Please add at least one collection with a name");
        setIsCreating(false);
        return;
      }

      // Validate collection names are unique
      const uniqueNames = new Set(
        validCollections.map((c) => c.name.trim().toLowerCase()),
      );
      if (uniqueNames.size !== validCollections.length) {
        setError("Collection names must be unique");
        toast.error("Collection names must be unique");
        setIsCreating(false);
        return;
      }

      let createdCount = 0;
      const newCollections = [];
      for (const collection of validCollections) {
        try {
          const collectionId =
            await createCollectionMutation.mutateAsync(collection);
          newCollections.push({ ...collection, id: collectionId });
          createdCount++;
        } catch (collectionError: any) {
          console.error(
            `Error creating collection "${collection.name}":`,
            collectionError,
          );

          if (collectionError?.message?.includes("not authenticated")) {
            toast.error("Session expired. Please sign in again.");
            navigate({ to: "/auth/signin", search: { redirect: "/" } });
            return;
          }

          throw collectionError;
        }
      }

      if (createdCount > 0) {
        toast.success(`${createdCount} collection(s) created successfully!`);
        setCreatedCollections(newCollections);

        // Create sample shoes
        if (newCollections.length > 0) {
          const sampleShoes = [
            {
              name: "Daily Trainer",
              brand: "Nike",
              model: "Air Zoom Pegasus 40",
              collectionId: newCollections[0].id,
              maxMileage: 500,
              purchaseDate: new Date().toISOString().split("T")[0],
              size: "10",
              notes: "My go-to daily running shoe",
            },
            {
              name: "Long Run Shoe",
              brand: "Brooks",
              model: "Ghost 15",
              collectionId: newCollections[0].id,
              maxMileage: 400,
              purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              size: "10",
              notes: "Comfortable for long distances",
            },
          ];

          // Add trail shoe if trail collection exists
          const trailCollection = newCollections.find((c) =>
            c.name.toLowerCase().includes("trail"),
          );
          if (trailCollection) {
            sampleShoes.push({
              name: "Trail Runner",
              brand: "Salomon",
              model: "Speedcross 5",
              collectionId: trailCollection.id,
              maxMileage: 350,
              purchaseDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              size: "10",
              notes: "Great grip for technical trails",
            });
          }

          let shoeCount = 0;
          for (const shoe of sampleShoes) {
            try {
              await createShoeMutation.mutateAsync(shoe);
              shoeCount++;
            } catch (shoeError: any) {
              console.error(
                `Error creating sample shoe "${shoe.name}":`,
                shoeError,
              );
            }
          }

          if (shoeCount > 0) {
            toast.success(
              `${shoeCount} sample shoe(s) added to get you started!`,
            );
          }
        }

        onComplete();
      }
    } catch (error: any) {
      console.error("Error creating collections:", error);

      let errorMessage = "Failed to create collections. Please try again.";

      if (error?.message?.includes("not authenticated")) {
        errorMessage = "Authentication expired. Please sign in again.";
        navigate({ to: "/auth/signin", search: { redirect: "/" } });
      } else if (error?.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkip = () => {
    if (!isAuthenticated) {
      toast.error("Authentication required");
      navigate({ to: "/auth/signin", search: { redirect: "/" } });
      return;
    }
    onComplete();
  };

  if (step === 1) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4 pb-safe relative overflow-hidden">
        {/* Enhanced background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-60 -right-60 w-96 h-96 bg-gradient-radial from-primary-100/40 to-transparent rounded-full animate-float" />
          <div
            className="absolute -bottom-60 -left-60 w-96 h-96 bg-gradient-radial from-blue-100/40 to-transparent rounded-full animate-float"
            style={{ animationDelay: "2s" }}
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-radial from-purple-50/30 to-transparent rounded-full animate-pulse-gentle" />
        </div>

        <div className="max-w-4xl w-full relative z-10">
          {/* Enhanced Hero Section */}
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 40 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 },
            })}
            className="text-center mb-12"
          >
            <motion.div
              {...getAnimationProps(isFirstVisit, {
                initial: { scale: 0, rotate: -180 },
                animate: { scale: 1, rotate: 0 },
                transition: {
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                },
              })}
              className="w-28 h-28 bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 rounded-4xl flex items-center justify-center mx-auto mb-8 shadow-xl floating-element relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-4xl" />
              <Footprints className="w-14 h-14 text-white relative z-10" />
              <div className="absolute -inset-2 bg-gradient-to-r from-primary-400 to-blue-400 rounded-4xl blur opacity-30 animate-pulse-gentle" />
            </motion.div>

            <motion.h1
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.3, duration: 0.5 },
              })}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight"
            >
              Welcome to{" "}
              <span className="text-gradient-hero block sm:inline">
                Shoe Tracker
              </span>
              {user?.name && (
                <motion.span
                  {...getAnimationProps(isFirstVisit, {
                    initial: { opacity: 0, scale: 0.8 },
                    animate: { opacity: 1, scale: 1 },
                    transition: { delay: 0.6, type: "spring" },
                  })}
                  className="block text-2xl sm:text-3xl font-semibold text-gray-600 mt-3"
                >
                  Hey {user.name}! 👋
                </motion.span>
              )}
            </motion.h1>

            <motion.p
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.4, duration: 0.5 },
              })}
              className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            >
              Your ultimate companion for tracking running shoes and maximizing
              performance. Let's get you set up for an amazing journey! 🚀
            </motion.p>
          </motion.div>

          {/* Enhanced Features Grid */}
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 40 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.5, duration: 0.6 },
            })}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                {...getAnimationProps(isFirstVisit, {
                  initial: { opacity: 0, y: 20, scale: 0.95 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  transition: {
                    delay: 0.6 + index * 0.1,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100,
                  },
                })}
                className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200 hover:shadow-medium hover:border-gray-300 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300",
                      feature.bg,
                    )}
                  >
                    <div className={feature.color}>{feature.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Action Buttons */}
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 1.2, duration: 0.5 },
            })}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-8"
          >
            <motion.div
              whileHover={isFirstVisit ? { scale: 1.05 } : {}}
              whileTap={isFirstVisit ? { scale: 0.95 } : {}}
            >
              <Button
                onClick={() => setStep(2)}
                size="lg"
                icon={<Sparkles className="w-5 h-5" />}
                className="text-lg px-10 py-5 bg-gradient-to-r from-primary-500 via-primary-600 to-blue-600 hover:from-primary-600 hover:via-primary-700 hover:to-blue-700 shadow-large hover:shadow-xl relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={isFirstVisit ? { scale: 1.02 } : {}}
              whileTap={isFirstVisit ? { scale: 0.98 } : {}}
            >
              <Button
                variant="outline"
                onClick={handleSkip}
                size="lg"
                className="text-lg px-10 py-5 border-2 border-gray-300 hover:border-primary-300 hover:bg-primary-50/50 text-gray-700 hover:text-primary-700 transition-all duration-300"
              >
                Skip Setup
              </Button>
            </motion.div>
          </motion.div>

          {/* Enhanced Bottom Decoration */}
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { delay: 1.5, duration: 0.8 },
            })}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <motion.div
                animate={isFirstVisit ? { rotate: 360 } : {}}
                transition={
                  isFirstVisit
                    ? { duration: 2, repeat: Infinity, ease: "linear" }
                    : {}
                }
              >
                ⭐
              </motion.div>
              <span>
                Join thousands of runners optimizing their shoe rotation
              </span>
              <motion.div
                animate={isFirstVisit ? { rotate: -360 } : {}}
                transition={
                  isFirstVisit
                    ? { duration: 2, repeat: Infinity, ease: "linear" }
                    : {}
                }
              >
                ⭐
              </motion.div>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                Award-winning UX
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                Lightning fast
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                5-star rated
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50/80 flex items-center justify-center p-4 pb-safe relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-gradient-radial from-blue-100/35 to-transparent rounded-full animate-float" />
        <div
          className="absolute -bottom-60 -left-60 w-96 h-96 bg-gradient-radial from-slate-100/60 to-transparent rounded-full animate-float"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Enhanced Header */}
        <motion.div
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5 },
          })}
          className="text-center mb-8"
        >
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { scale: 0, rotate: -90 },
              animate: { scale: 1, rotate: 0 },
              transition: { delay: 0.2, type: "spring", stiffness: 200 },
            })}
            className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft relative"
          >
            <FolderOpen className="w-8 h-8 text-primary-600" />
          </motion.div>
          <motion.h1
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.3 },
            })}
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4"
          >
            Set Up Your Collections
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Collections help you organize your shoes by type or purpose. We've
            suggested some common ones, but feel free to customize them to fit
            your style.
          </motion.p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Collections */}
        <motion.div
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.2, duration: 0.6 },
          })}
          className="space-y-4 mb-8"
        >
          <AnimatePresence mode="popLayout">
            {collections.map((collection, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  type: "spring",
                }}
                className="bg-white rounded-2xl shadow-soft border overflow-hidden group relative transition-all duration-300 hover:shadow-medium"
                style={{ borderColor: withAlpha(collection.color, 0.26) }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: collection.color }}
                />
                <div className="p-6">
                  {/* Enhanced Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = getCollectionIcon(collection.icon);
                        return (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-8 h-8 rounded-lg border shadow-sm flex items-center justify-center"
                            style={{
                              backgroundColor: withAlpha(collection.color, 0.12),
                              borderColor: withAlpha(collection.color, 0.3),
                              color: collection.color,
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </motion.div>
                        );
                      })()}
                      <h3 className="font-display text-lg sm:text-xl font-semibold text-gray-900">
                        {collection.name || `Collection ${index + 1}`}
                      </h3>
                    </div>
                    <AnimatePresence>
                      {collections.length > 1 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveCollection(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <X className="w-5 h-5" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Enhanced Form Fields */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <motion.div
                        {...getAnimationProps(isFirstVisit, {
                          initial: { opacity: 0, x: -20 },
                          animate: { opacity: 1, x: 0 },
                          transition: { delay: 0.1 + index * 0.1 },
                        })}
                      >
                        <Input
                          label="Collection Name"
                          required
                          value={collection.name}
                          onChange={(e) =>
                            handleUpdateCollection(
                              index,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder="Road, Trail, Racing..."
                          icon={<FolderOpen className="w-5 h-5" />}
                        />
                      </motion.div>
                      <motion.div
                        {...getAnimationProps(isFirstVisit, {
                          initial: { opacity: 0, x: 20 },
                          animate: { opacity: 1, x: 0 },
                          transition: { delay: 0.2 + index * 0.1 },
                        })}
                      >
                        <ColorPicker
                          label="Collection Color"
                          required
                          value={collection.color}
                          onChange={(color) =>
                            handleUpdateCollection(index, "color", color)
                          }
                        />
                      </motion.div>

                      <motion.div
                        {...getAnimationProps(isFirstVisit, {
                          initial: { opacity: 0, x: 20 },
                          animate: { opacity: 1, x: 0 },
                          transition: { delay: 0.25 + index * 0.1 },
                        })}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Collection Icon
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {COLLECTION_ICON_OPTIONS.map((option) => {
                            const Icon = getCollectionIcon(option.key);
                            const isActive =
                              (collection.icon || DEFAULT_COLLECTION_ICON) === option.key;

                            return (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() =>
                                  handleUpdateCollection(index, "icon", option.key)
                                }
                                className={cn(
                                  "flex items-center justify-center rounded-lg border aspect-square transition-colors",
                                  isActive
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                                )}
                                title={option.label}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </div>

                    <motion.div
                      {...getAnimationProps(isFirstVisit, {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: 0.3 + index * 0.1 },
                      })}
                    >
                      <Textarea
                        label="Description"
                        value={collection.description}
                        onChange={(e) =>
                          handleUpdateCollection(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Describe what types of shoes belong in this collection..."
                        helperText="Optional - help organize your shoes better"
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Add Collection Button */}
        <motion.div
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { delay: 0.4, duration: 0.5 },
          })}
          className="flex justify-center mb-8"
        >
          <motion.button
            onClick={handleAddCollection}
            className="flex items-center gap-3 px-6 py-3.5 text-primary-700 hover:text-primary-800 font-semibold bg-white hover:bg-primary-50 border border-primary-200 hover:border-primary-300 rounded-xl shadow-soft transition-all duration-200"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Add Another Collection</span>
          </motion.button>
        </motion.div>

        {/* Enhanced Action Buttons */}
        <motion.div
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.5, duration: 0.5 },
          })}
          className="flex flex-col sm:flex-row justify-center gap-4 mb-8"
        >
          <motion.div
            whileHover={isFirstVisit ? { scale: 1.02 } : {}}
            whileTap={isFirstVisit ? { scale: 0.98 } : {}}
          >
            <Button
              onClick={handleCreateCollections}
              loading={isCreating}
              disabled={
                isCreating ||
                !collections.some((c) => c.name.trim()) ||
                !isAuthenticated
              }
              size="lg"
              icon={
                isCreating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )
              }
              className="text-base sm:text-lg px-8 py-4 bg-gray-900 hover:bg-black shadow-soft transition-all duration-200"
            >
              {isCreating
                ? "Creating Collections..."
                : "Create Collections & Continue"}
            </Button>
          </motion.div>
          <motion.div
            whileHover={isFirstVisit ? { scale: 1.02 } : {}}
            whileTap={isFirstVisit ? { scale: 0.98 } : {}}
          >
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isCreating}
              size="lg"
              className="text-base sm:text-lg px-8 py-4 border border-gray-300 hover:border-gray-400 hover:bg-white text-gray-700 transition-all duration-200"
            >
              Skip for Now
            </Button>
          </motion.div>
        </motion.div>

        {/* Enhanced Tip Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-200 rounded-xl shadow-soft">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong className="text-blue-900">Pro Tip:</strong> You can
              always add, edit, or remove collections later from the Collections
              page!
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              Secure & Private
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Always Synced
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              Mobile Optimized
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
