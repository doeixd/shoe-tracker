import { useQuery } from "@tanstack/react-query";
import { EnhancedLoading } from "~/components/loading/EnhancedLoading";
import { createQueryConfig } from "~/utils/routeLoading";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  collectionQueries,
  shoeQueries,
  runQueries,
  statsQueries,
} from "~/queries";
import { Loader } from "~/components/Loader";

import { useAuth } from "~/components/AuthProvider";
import { requireAuth } from "~/utils/auth";
import { AuthErrorBoundary } from "~/components/AuthErrorBoundary";
import { motion } from "motion/react";
import {
  formatDistance,
  getUsageLevel,
  USAGE_LEVEL_COLORS,
  USAGE_LEVEL_LABELS,
} from "~/types";
import {
  FeatureCard,
  MetricCard,
  CardGrid,
  Card,
  EmptyStateCard,
} from "~/components/ui/Cards";
import { Button } from "~/components/FormComponents";
import { BackToCollections } from "~/components/ui/BackButton";
import {
  Footprints,
  Archive,
  Package,
  Plus,
  Edit3,
  AlertTriangle,
  Gauge,
  Activity,
  Palette,
  Calendar,
  Lock,
} from "lucide-react";
import { cn } from "~/components/ui/ui";

function CollectionDetailPage() {
  return <CollectionDetail />;
}

export const Route = createFileRoute("/collections/$collectionId")({
  component: CollectionDetailPage,
  errorComponent: ({ error }) => {
    const isCollectionNotFound = error.message?.includes(
      "Collection not found",
    );

    if (isCollectionNotFound) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Collection Not Found
                </h2>
                <p className="text-gray-600">
                  The collection you're looking for doesn't exist or has been
                  removed.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/collections" search={{ modal: false }}>
                  <Button className="flex-1 sm:flex-none">
                    View Collections
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="secondary" className="flex-1 sm:flex-none">
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Something went wrong
              </h2>
              <p className="text-gray-600">{error.message}</p>
            </div>
            <div className="flex justify-center">
              <Link to="/">
                <Button>Go Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  },
  // Loader with authentication redirect
  loader: async ({ params: { collectionId }, context: { queryClient } }) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(queryClient);

    // Prefetch critical data in parallel
    const collectionPromise = queryClient.ensureQueryData(
      collectionQueries.detail(collectionId),
    );
    const shoesPromise = queryClient.ensureQueryData(
      shoeQueries.byCollection(collectionId, true),
    );

    // Wait for both queries to complete
    await Promise.all([collectionPromise, shoesPromise]);

    return {
      collectionId,
      user,
    };
  },
});

function CollectionDetail() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { collectionId } = Route.useParams();
  const loaderData = Route.useLoaderData();

  if (isLoading) {
    return (
      <EnhancedLoading
        message="Loading collection..."
        layout="detail"
        holdDelay={100}
        skeletonDelay={200}
        showProgress={true}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-sm text-gray-600">
              Please sign in to access your collections
            </p>
          </div>
        </div>
      </div>
    );
  }

  const collectionQuery = useQuery(
    createQueryConfig(collectionQueries.detail(collectionId), {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
  );

  const shoesQuery = useQuery(
    createQueryConfig(shoeQueries.byCollection(collectionId, true), {
      staleTime: 3 * 60 * 1000, // 3 minutes (shoes data changes more frequently)
    }),
  );

  // Handle loading states - only show loading if both queries are loading
  const isDataLoading = collectionQuery.isLoading && shoesQuery.isLoading;

  if (isDataLoading) {
    return (
      <EnhancedLoading
        message="Loading collection..."
        layout="detail"
        holdDelay={100}
        skeletonDelay={200}
        showProgress={true}
      />
    );
  }

  // Handle errors - only throw if it's not an auth error
  if (
    collectionQuery.error &&
    !collectionQuery.error.message?.includes("not authenticated")
  ) {
    throw collectionQuery.error;
  }
  if (
    shoesQuery.error &&
    !shoesQuery.error.message?.includes("not authenticated")
  ) {
    throw shoesQuery.error;
  }

  const collection = collectionQuery.data as any;
  const shoes = (shoesQuery.data as any[]) || [];

  const activeShoes = shoes.filter((shoe: any) => shoe && !shoe.isRetired);
  const retiredShoes = shoes.filter((shoe: any) => shoe && shoe.isRetired);

  // Don't render if we don't have collection data
  if (!collection) {
    return (
      <EnhancedLoading
        message="Loading collection..."
        layout="detail"
        holdDelay={100}
        skeletonDelay={200}
        showProgress={true}
      />
    );
  }

  return (
    <AuthErrorBoundary>
      <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-safe">
        <div className="max-w-7xl mx-auto p-4 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col space-y-6"
          >
            {/* Back Navigation */}
            <div className="flex items-center gap-4">
              <BackToCollections />
            </div>

            {/* Collection Header Card */}
            <Card className="p-6 lg:p-8" shadow="medium">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: collection?.color || "#3b82f6" }}
                  >
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                      {collection?.name || "Unnamed Collection"}
                    </h1>
                    {collection?.description && (
                      <p className="text-lg text-gray-600 max-w-2xl">
                        {collection.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Palette className="w-4 h-4" />
                      <span>Color: {collection?.color || "#3b82f6"}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() =>
                      navigate({
                        to: "/shoes/new",
                        search: { collectionId },
                      })
                    }
                    icon={<Plus className="w-4 h-4" />}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    Add Shoe
                  </Button>
                  <Link
                    to="/collections/$collectionId/edit"
                    params={{ collectionId }}
                    search={{ modal: false }}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      icon={<Edit3 className="w-4 h-4" />}
                    >
                      Edit Collection
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardGrid cols={3} gap="lg">
              <MetricCard
                title="Active Shoes"
                value={activeShoes.length}
                subtitle="In rotation"
                icon={<Footprints className="w-6 h-6" />}
                color="success"
              />
              <MetricCard
                title="Retired Shoes"
                value={retiredShoes.length}
                subtitle="Completed"
                icon={<Archive className="w-6 h-6" />}
                color="neutral"
              />
              <MetricCard
                title="Total Shoes"
                value={shoes.length}
                subtitle="All time"
                icon={<Package className="w-6 h-6" />}
                color="primary"
              />
            </CardGrid>
          </motion.div>

          {/* Active Shoes */}
          {activeShoes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                  <Footprints className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Active Shoes
                </h2>
              </div>

              <CardGrid cols={3} gap="lg">
                {activeShoes.map((shoe: any, index: number) => {
                  const currentMileage = shoe.currentMileage || 0;
                  const usageLevel = getUsageLevel(
                    currentMileage,
                    shoe.maxMileage,
                  );
                  const usagePercentage =
                    (currentMileage / shoe.maxMileage) * 100;

                  return (
                    <motion.div
                      key={shoe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <FeatureCard
                        title={shoe.name || "Unnamed Shoe"}
                        description={`${shoe.brand || "Unknown"} ${shoe.model || "Unknown Model"}`}
                        image={shoe.imageUrl}
                        onClick={() =>
                          navigate({
                            to: "/shoes/$shoeId",
                            params: { shoeId: shoe.id },
                          })
                        }
                        className="h-full transition-all duration-300 hover:scale-105"
                      >
                        <div className="space-y-4">
                          {/* Usage Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 flex items-center gap-1">
                                <Gauge className="w-3 h-3" />
                                Usage
                              </span>
                              <span className="font-medium">
                                {formatDistance(currentMileage)} /{" "}
                                {formatDistance(shoe.maxMileage)}
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                              <motion.div
                                className={cn(
                                  "h-2 rounded-full transition-all duration-300",
                                  usageLevel === "new" || usageLevel === "good"
                                    ? "bg-green-500"
                                    : usageLevel === "moderate"
                                      ? "bg-yellow-500"
                                      : usageLevel === "high"
                                        ? "bg-orange-500"
                                        : "bg-red-500",
                                )}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(100, usagePercentage)}%`,
                                }}
                                transition={{
                                  duration: 0.8,
                                  delay: index * 0.1,
                                }}
                              />
                              {usageLevel === "replace" && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status and Miles Left */}
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                USAGE_LEVEL_COLORS[usageLevel],
                              )}
                            >
                              {usageLevel === "replace" && (
                                <AlertTriangle className="w-3 h-3 mr-1" />
                              )}
                              {USAGE_LEVEL_LABELS[usageLevel]}
                            </span>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                {Math.max(
                                  0,
                                  shoe.maxMileage - currentMileage,
                                ).toFixed(0)}{" "}
                                mi left
                              </div>
                            </div>
                          </div>
                        </div>
                      </FeatureCard>
                    </motion.div>
                  );
                })}
              </CardGrid>
            </motion.div>
          )}

          {/* Retired Shoes */}
          {retiredShoes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Archive className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Retired Shoes
                </h2>
              </div>

              <CardGrid cols={3} gap="lg">
                {retiredShoes.map((shoe: any, index: number) => {
                  const currentMileage = shoe.currentMileage || 0;

                  return (
                    <motion.div
                      key={shoe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <FeatureCard
                        title={shoe.name || "Unnamed Shoe"}
                        description={`${shoe.brand || "Unknown"} ${shoe.model || "Unknown Model"}`}
                        image={shoe.imageUrl}
                        badge="RETIRED"
                        badgeColor="warning"
                        onClick={() =>
                          navigate({
                            to: "/shoes/$shoeId",
                            params: { shoeId: shoe.id },
                          })
                        }
                        className="h-full opacity-75 hover:opacity-100 transition-all duration-300"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Gauge className="w-3 h-3" />
                              Final Mileage
                            </span>
                            <span className="font-medium text-gray-700">
                              {formatDistance(currentMileage)}
                            </span>
                          </div>

                          {shoe.retiredDate && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Retired:{" "}
                                {new Date(
                                  shoe.retiredDate,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </FeatureCard>
                    </motion.div>
                  );
                })}
              </CardGrid>
            </motion.div>
          )}

          {/* Empty state */}
          {shoes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <EmptyStateCard
                title="No shoes in this collection"
                description="Add your first pair of shoes to get started with tracking your running gear."
                icon={<Footprints className="w-8 h-8 text-gray-400" />}
                actionLabel="Add First Shoe"
                onAction={() =>
                  navigate({
                    to: "/shoes/new",
                    search: { collectionId },
                  })
                }
              />
            </motion.div>
          )}
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
