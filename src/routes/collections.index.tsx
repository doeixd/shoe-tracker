import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useAppDataSuspense } from "~/hooks/useSuspenseQueries";
import { requireAuth } from "~/utils/auth";
import * as React from "react";
import { useAuth } from "~/components/AuthProvider";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import {
  FolderOpen,
  Archive,
  Plus,
  Footprints,
  ChevronRight,
  Package,
  Lock,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { EmptyStateCard } from "~/components/ui/Cards";
import { Button } from "~/components/FormComponents";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { CollectionForm } from "~/components/CollectionForm";
import { useMobileDetection } from "~/hooks/useMobileDetection";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";
import { PageHeader, PageContainer } from "~/components/PageHeader";
import { shoeQueries, runQueries } from "~/queries";
import { getCollectionIcon } from "~/lib/collectionIcons";

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
            icon={<Plus className="w-5 h-5" />}
            className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 font-medium"
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
              const CollectionIcon = getCollectionIcon(collection.icon);

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
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        to: "/collections/$collectionId",
                        params: { collectionId: collection.id },
                      })
                    }
                    className="group relative w-full overflow-hidden rounded-2xl border bg-white/95 p-5 sm:p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
                    style={{
                      borderColor: withAlpha(collection.color, 0.28),
                      boxShadow: `inset 4px 0 0 ${collection.color || "#3b82f6"}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-7 w-7 rounded-lg border flex items-center justify-center"
                            style={{
                              color: collection.color || "#3b82f6",
                              backgroundColor: withAlpha(collection.color, 0.12),
                              borderColor: withAlpha(collection.color, 0.24),
                            }}
                          >
                            <CollectionIcon className="w-4 h-4" />
                          </div>
                          <h3 className="font-display text-lg sm:text-xl font-bold text-gray-900 truncate">
                            {collection.name || "Unnamed Collection"}
                          </h3>
                        </div>
                        {collection.description && (
                          <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-2">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <div
                        className="inline-flex items-end gap-2 rounded-xl border px-3 py-2"
                        style={{
                          backgroundColor: withAlpha(collection.color, 0.1),
                          borderColor: withAlpha(collection.color, 0.25),
                        }}
                      >
                        <Footprints
                          className="w-4 h-4 mb-0.5"
                          style={{ color: collection.color || "#3b82f6" }}
                        />
                        <span className="font-display text-2xl leading-none font-bold text-gray-900">
                          {collectionShoes.length}
                        </span>
                        <span
                          className="text-xs uppercase tracking-wide mb-0.5"
                          style={{ color: withAlpha(collection.color, 0.82) }}
                        >
                          active shoes
                        </span>
                      </div>

                      {retiredShoes.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-gray-600">
                          <Archive className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            {retiredShoes.length} retired
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
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
              const CollectionIcon = getCollectionIcon(collection.icon);

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
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        to: "/collections/$collectionId",
                        params: { collectionId: collection.id },
                      })
                    }
                    className="group relative w-full overflow-hidden rounded-2xl border bg-white/80 p-5 text-left transition-all duration-200 opacity-80 hover:opacity-100"
                    style={{
                      borderColor: withAlpha(collection.color, 0.2),
                      boxShadow: `inset 4px 0 0 ${withAlpha(collection.color, 0.75)}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-7 w-7 rounded-lg border flex items-center justify-center"
                            style={{
                              color: collection.color || "#6b7280",
                              backgroundColor: withAlpha(collection.color, 0.1),
                              borderColor: withAlpha(collection.color, 0.2),
                            }}
                          >
                            <CollectionIcon className="w-4 h-4" />
                          </div>
                          <h3 className="font-display text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {collection.name}
                          </h3>
                          <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                            Archived
                          </span>
                        </div>
                        {collection.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <div className="mt-4 inline-flex items-end gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-700">
                      <Footprints className="w-4 h-4 mb-0.5" />
                      <span className="font-display text-xl leading-none font-semibold">
                        {collectionShoes.length}
                      </span>
                      <span className="text-xs uppercase tracking-wide mb-0.5">
                        total shoes
                      </span>
                    </div>
                  </button>
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
