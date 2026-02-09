import { useQuery } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useAppData } from "~/hooks/useAppData";
import { useAppDataSuspense } from "~/hooks/useSuspenseQueries";
import { requireAuth } from "~/utils/auth";
import * as React from "react";
import { useAuth } from "~/components/AuthProvider";
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
  Lock,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { FeatureCard, EmptyStateCard, ActionCard } from "~/components/ui/Cards";
import { Button, Input, Textarea, FormGrid } from "~/components/FormComponents";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { CollectionForm } from "~/components/CollectionForm";
import { useState } from "react";
import { useMobileDetection } from "~/hooks/useMobileDetection";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";
import { PageHeader, PageContainer } from "~/components/PageHeader";

function CollectionsPage() {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading collections...</p>
          </div>
        </div>
      }>
        <Collections />
      </React.Suspense>
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/collections/")({
  component: CollectionsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      modal: search?.modal === true || search?.modal === "true" || false,
    };
  },
  beforeLoad: async ({ context: { queryClient } }) => {
    // Start prefetching related data before the route loads
    const prefetchPromises = [
      queryClient.prefetchQuery({
        ...shoeQueries.list(false),
        staleTime: 1000 * 60 * 5,
      }),
      queryClient.prefetchQuery({
        ...runQueries.list(20),
        staleTime: 1000 * 60 * 2,
      }),
    ];

    // Fire and forget - don't block navigation
    Promise.all(prefetchPromises).catch(() => {});

    return {};
  },
  // Loader with authentication redirect - app data is prefetched automatically
  loader: async ({ context: { queryClient } }) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(queryClient);
    return { user };
  },
  // Route-level caching configuration
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  shouldReload: false, // Don't reload if data is fresh
});

function Collections() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/collections/" });
  const { isMobile } = useMobileDetection();
  const { isFirstVisit } = useFirstVisit();

  // Use suspense query for instant loading - no loading states needed
  const { data: appData } = useAppDataSuspense();
  const { collections, archivedCollections, shoes } = appData;



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
  // Data is now instantly available from app data cache

  if (isLoading && collections.length === 0) {
    return (
      <EnhancedLoading
        message="Loading collections..."
        layout="list"
        holdDelay={100}
        skeletonDelay={200}
        showProgress={true}
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Collections"
        description="Organize your running shoes into collections"
        actions={
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
            icon={<Plus className="w-4 h-4" />}
            className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm px-5 py-2.5 text-sm"
          >
            New Collection
          </Button>
        }
      />

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
                  shoe && shoe.collectionId === collection.id && shoe.isRetired,
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
                      navigate({
                        to: "/collections/$collectionId",
                        params: { collectionId: collection.id },
                      })
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
                      navigate({
                        to: "/collections/$collectionId",
                        params: { collectionId: collection.id },
                      })
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
    </PageContainer>
  );
}
