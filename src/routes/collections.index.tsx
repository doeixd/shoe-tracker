import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  collectionQueries,
  shoeQueries,
  runQueries,
  statsQueries,
} from "~/queries";
import { withAuth } from "~/components/AuthProvider";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import {
  PageLoading,
  EmptyState,
  ErrorState,
} from "~/components/LoadingStates";
import { EnhancedLoading } from "~/components/loading/EnhancedLoading";
import {
  FolderOpen,
  Archive,
  Plus,
  Footprints,
  ChevronRight,
  Palette,
  Package,
} from "lucide-react";
import { motion } from "motion/react";
import { FeatureCard, EmptyStateCard, ActionCard } from "~/components/ui/Cards";
import { Button, Input, Textarea, FormGrid } from "~/components/FormComponents";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { CollectionForm } from "~/components/CollectionForm";
import { useState } from "react";
import { useMobileDetection } from "~/hooks/useMobileDetection";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";

function CollectionsPage() {
  return (
    <ErrorBoundary>
      <Collections />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/collections/")({
  component: withAuth(CollectionsPage),
  pendingComponent: () => (
    <EnhancedLoading
      message="Loading collections..."
      layout="list"
      holdDelay={200}
      skeletonDelay={300}
      showProgress={true}
    />
  ),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      modal: search?.modal === true || search?.modal === "true" || false,
    };
  },
  loader: async ({ context: { queryClient } }) => {
    // Preload collections and related data
    const collectionsPromise = queryClient.ensureQueryData(
      collectionQueries.list(),
    );
    const archivedCollectionsPromise = queryClient.ensureQueryData(
      collectionQueries.archived(),
    );
    const shoesPromise = queryClient.ensureQueryData(shoeQueries.list(false));

    // Wait for critical data
    await Promise.all([
      collectionsPromise,
      archivedCollectionsPromise,
      shoesPromise,
    ]);

    // Prefetch related data in background
    queryClient.prefetchQuery(shoeQueries.list(true));
    queryClient.prefetchQuery(runQueries.withShoes(20));
    queryClient.prefetchQuery(statsQueries.overall());

    return {};
  },
});

function Collections() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/collections/" });
  const { isMobile } = useMobileDetection();
  const { isFirstVisit } = useFirstVisit();
  const collectionsQuery = useSuspenseQuery({
    ...collectionQueries.list(),
    retry: (failureCount, error) => {
      if (error?.message?.includes("not authenticated")) return false;
      return failureCount < 2;
    },
  });
  const archivedCollectionsQuery = useSuspenseQuery({
    ...collectionQueries.archived(),
    retry: (failureCount, error) => {
      if (error?.message?.includes("not authenticated")) return false;
      return failureCount < 2;
    },
  });
  const shoesQuery = useSuspenseQuery({
    ...shoeQueries.list(),
    retry: (failureCount, error) => {
      if (error?.message?.includes("not authenticated")) return false;
      return failureCount < 2;
    },
  });

  const collections = collectionsQuery.data || [];
  const archivedCollections = archivedCollectionsQuery.data || [];
  const shoes = shoesQuery.data || [];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5 },
          })}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Collections
            </h1>
            <p className="text-lg text-gray-600">
              Organize your running shoes by type and purpose
            </p>
          </div>
          <Button
            onClick={() => {
              if (isMobile) {
                navigate({
                  to: "/collections",
                  search: {
                    modal: true,
                  },
                });
              } else {
                navigate({ to: "/collections/new", search: { modal: false } });
              }
            }}
            icon={<Plus className="w-5 h-5" />}
            className="sm:w-auto"
          >
            New Collection
          </Button>
        </motion.div>

        {/* Active Collections */}
        <motion.div
          {...getAnimationProps(isFirstVisit, {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, delay: 0.1 },
          })}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Active Collections
            </h2>
          </div>

          {collections.length === 0 ? (
            <EmptyStateCard
              title="No collections yet"
              description="Create your first collection to organize your running shoes by type, brand, or purpose."
              icon={<FolderOpen className="w-8 h-8 text-gray-400" />}
              actionLabel="Create Collection"
              onAction={() => {
                if (isMobile) {
                  navigate({
                    to: "/collections",
                    search: {
                      modal: true,
                    },
                  });
                } else {
                  navigate({
                    to: "/collections/new",
                    search: { modal: false },
                  });
                }
              }}
            />
          ) : (
            <div className="space-y-4">
              {collections.map((collection, index) => {
                const collectionShoes = shoes.filter(
                  (shoe) =>
                    shoe &&
                    shoe.collectionId === collection.id &&
                    !shoe.isRetired,
                );
                const retiredShoes = shoes.filter(
                  (shoe) =>
                    shoe &&
                    shoe.collectionId === collection.id &&
                    shoe.isRetired,
                );

                return (
                  <motion.div
                    key={collection.id}
                    {...getAnimationProps(isFirstVisit, {
                      initial: { opacity: 0, y: 20 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.3, delay: index * 0.1 },
                    })}
                    className="w-full"
                  >
                    <FeatureCard
                      title={collection.name || "Unnamed Collection"}
                      description={collection.description}
                      onClick={() =>
                        (window.location.href = `/collections/${collection.id}`)
                      }
                      className="h-full group cursor-pointer w-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: collection.color || "#3b82f6",
                              }}
                            />
                            <Footprints className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {collectionShoes.length}
                            </span>
                          </div>
                          {retiredShoes.length > 0 && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <Archive className="w-3 h-3" />
                              <span className="text-xs">
                                {retiredShoes.length} retired
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-primary-600 group-hover:translate-x-1 transition-transform">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </FeatureCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Archived Collections */}
        {archivedCollections.length > 0 && (
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, delay: 0.2 },
            })}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                <Archive className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Archived Collections
              </h2>
            </div>

            <div className="space-y-4">
              {archivedCollections.map((collection, index) => {
                const collectionShoes = shoes.filter(
                  (shoe) => shoe.collectionId === collection.id,
                );

                return (
                  <motion.div
                    key={collection.id}
                    {...getAnimationProps(isFirstVisit, {
                      initial: { opacity: 0, y: 20 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.3, delay: index * 0.1 },
                    })}
                    className="w-full"
                  >
                    <FeatureCard
                      title={collection.name}
                      description={collection.description}
                      badge="ARCHIVED"
                      badgeColor="warning"
                      onClick={() =>
                        (window.location.href = `/collections/${collection.id}`)
                      }
                      className="h-full opacity-75 hover:opacity-100 transition-opacity cursor-pointer w-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-500">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: collection.color }}
                          />
                          <Footprints className="w-4 h-4" />
                          <span className="text-sm">
                            {collectionShoes.length} shoes
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </FeatureCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Modal for adding collections - Only show on mobile */}
        {search.modal && isMobile && (
          <FormModalSheet
            isOpen={search.modal}
            onClose={() =>
              navigate({
                to: "/collections",
                search: {
                  modal: false,
                },
              })
            }
            title="New Collection"
            description="Create a new collection to organize your running shoes"
            formHeight="medium"
          >
            <CollectionForm
              onSuccess={(collectionId) =>
                navigate({
                  to: "/collections/$collectionId",
                  params: { collectionId },
                  search: {},
                })
              }
              onCancel={() =>
                navigate({
                  to: "/collections",
                  search: {
                    modal: false,
                  },
                })
              }
              isModal={true}
            />
          </FormModalSheet>
        )}
      </div>
    </div>
  );
}
