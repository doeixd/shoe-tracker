import { useSuspenseQuery } from "@tanstack/react-query";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  collectionQueries,
  shoeQueries,
  runQueries,
  statsQueries,
} from "~/queries";
import { Loader } from "~/components/Loader";
import { SmartPageLoading } from "~/components/loading/RouteHolding";
import { withAuth } from "~/components/AuthProvider";
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
import {
  Footprints,
  Archive,
  Package,
  Plus,
  Edit3,
  ArrowLeft,
  AlertTriangle,
  Gauge,
  Activity,
  Palette,
  Calendar,
} from "lucide-react";
import { cn } from "~/components/ui/ui";

export const Route = createFileRoute("/collections/$collectionId")({
  component: withAuth(CollectionDetail),
  pendingComponent: () => (
    <SmartPageLoading
      message="Loading collection..."
      holdDelay={1000}
      showSkeleton={true}
      skeletonLayout="detail"
    />
  ),
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
  loader: async ({ context: { queryClient }, params: { collectionId } }) => {
    try {
      // Check if we can access authenticated data
      const authQuery = queryClient.getQueryData([
        "convex",
        "auth.getUserProfile",
        {},
      ]);

      // Only preload if we have auth data or if the query is likely to succeed
      if (authQuery) {
        // Preload collection and related data
        const collectionPromise = queryClient.ensureQueryData(
          collectionQueries.detail(collectionId),
        );
        const shoesPromise = queryClient.ensureQueryData(
          shoeQueries.byCollection(collectionId, true),
        );

        // Wait for critical data
        await Promise.all([collectionPromise, shoesPromise]);

        // Prefetch related data in background
        queryClient.prefetchQuery(collectionQueries.list());
        queryClient.prefetchQuery(shoeQueries.list(false));
        queryClient.prefetchQuery(runQueries.withShoes(20));
        queryClient.prefetchQuery(statsQueries.overall());
      }
    } catch (error) {
      // If preloading fails due to auth, just continue - the component will handle it
      console.debug("Preload failed (likely auth issue):", error);
    }

    return {
      collectionId,
    };
  },
});

function CollectionDetail() {
  const navigate = useNavigate();
  const { collectionId } = Route.useParams();
  const loaderData = Route.useLoaderData();

  const collectionQuery = useSuspenseQuery(
    collectionQueries.detail(collectionId),
  );
  const shoesQuery = useSuspenseQuery(
    shoeQueries.byCollection(collectionId, true),
  );

  const collection = collectionQuery.data;
  const shoes = shoesQuery.data;

  const activeShoes = shoes.filter((shoe) => !shoe.isRetired);
  const retiredShoes = shoes.filter((shoe) => shoe.isRetired);

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
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() =>
                  navigate({ to: "/collections", search: { modal: false } })
                }
                icon={<ArrowLeft className="w-4 h-4" />}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Collections
              </Button>
            </div>

            {/* Collection Header Card */}
            <Card className="p-6 lg:p-8" shadow="medium">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: collection.color }}
                  >
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                      {collection.name}
                    </h1>
                    {collection.description && (
                      <p className="text-lg text-gray-600 max-w-2xl">
                        {collection.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Palette className="w-4 h-4" />
                      <span>Color: {collection.color}</span>
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
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate({
                        to: "/collections/$collectionId/edit",
                        params: { collectionId },
                        search: { modal: false },
                      })
                    }
                    icon={<Edit3 className="w-4 h-4" />}
                  >
                    Edit Collection
                  </Button>
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
                {activeShoes.map((shoe, index) => {
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
                {retiredShoes.map((shoe, index) => {
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
