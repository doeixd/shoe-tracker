import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  createFileRoute,
  useNavigate,
  useSearch,
  useRouter,
} from "@tanstack/react-router";
import {
  shoeQueries,
  collectionQueries,
  runQueries,
  statsQueries,
} from "~/queries";
import { requireAuth } from "~/utils/auth";
import { useAuth } from "~/components/AuthProvider";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { useMobileDetection } from "~/hooks/useMobileDetection";
import {
  PageLoading,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "~/components/LoadingStates";
import { EnhancedLoading } from "~/components/loading/EnhancedLoading";
import {
  formatDistance,
  getUsageLevel,
  USAGE_LEVEL_COLORS,
  USAGE_LEVEL_LABELS,
} from "~/types";
import { useState, useEffect } from "react";
import * as React from "react";
import {
  Footprints,
  Plus,
  Filter,
  SortAsc,
  Archive,
  Eye,
  Calendar,
  AlertTriangle,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Package,
  Gauge,
  Trophy,
  Clock,
  Sparkles,
  DollarSign,
  Ruler,
  Weight,
  ArrowDown,
  ChevronRight,
  Heart,
  Activity,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";
import { PageHeader, PageContainer } from "~/components/PageHeader";
import { FeatureCard, EmptyStateCard, MetricCard } from "~/components/ui/Cards";
import { ShoeCard } from "~/components/ui/ShoeCard";
import {
  Button,
  FormGrid,
  Input,
  Select,
  Textarea,
} from "~/components/FormComponents";
import { cn } from "~/components/ui/ui";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { ShoeForm } from "~/components/ShoeForm";

function ShoesPage() {
  // Auth is handled by route loader, so no need for auth checks here
  return (
    <ErrorBoundary>
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading shoes...</p>
          </div>
        </div>
      }>
        <Shoes />
      </React.Suspense>
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/shoes/")({
  component: ShoesPage,

  validateSearch: (search: Record<string, unknown>) => {
    return {
      showRetired:
        search?.showRetired === false || search?.showRetired === "false"
          ? false
          : true, // Default to true
      collection: (search?.collection as string) || "",
      sortBy:
        (search?.sortBy as "name" | "mileage" | "usage" | "date") || "name",
      modal: search?.modal === true || search?.modal === "true" || false,
      brand: (search?.brand as string) || "",
      usageLevel: (search?.usageLevel as string) || "",
      dateRange:
        (search?.dateRange as "all" | "week" | "month" | "year") || "all",
    };
  },
  beforeLoad: async ({ context: { queryClient } }) => {
    // Start prefetching related data before the route loads
    const prefetchPromises = [
      queryClient.prefetchQuery({
        ...runQueries.list(20),
        staleTime: 1000 * 60 * 2,
      }),
      queryClient.prefetchQuery({
        ...statsQueries.overall(),
        staleTime: 1000 * 60 * 5,
      }),
    ];

    // Fire and forget - don't block navigation
    Promise.all(prefetchPromises).catch(() => {});

    return {};
  },
  loader: async ({ context: { queryClient } }) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(queryClient);

    // Use ensureQueryData for critical data that must be loaded
    await queryClient.ensureQueryData(shoeQueries.list(false));
    await queryClient.ensureQueryData(shoeQueries.list(true));
    await queryClient.ensureQueryData(collectionQueries.list());

    return { user };
  },
  // Route-level caching configuration
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  shouldReload: false, // Don't reload if data is fresh
});

// Beautiful Custom Checkbox Component
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  icon?: React.ReactNode;
}

function CustomCheckbox({
  checked,
  onChange,
  label,
  description,
  icon,
}: CheckboxProps) {
  return (
    <motion.div
      className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
      onClick={() => onChange(!checked)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative flex-shrink-0 mt-0.5">
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
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {icon && <div className="text-gray-600">{icon}</div>}
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
    </motion.div>
  );
}

// Beautiful Select Component
function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  icon,
}: CustomSelectProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-gray-400">
        {icon}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-12 rounded-2xl border border-gray-200 bg-white text-gray-900",
          "focus:outline-none focus:ring-0 focus:border-primary-400 focus:shadow-glow",
          "hover:border-gray-300 transition-all duration-300 ease-out",
          "appearance-none cursor-pointer",
          // WebKit-specific styles to ensure no browser arrow
          "[-webkit-appearance:none] [-moz-appearance:none]",
          // Remove default select styling
          "[&::-ms-expand]:hidden",
          icon ? "pl-12 pr-12" : "pl-4 pr-12",
        )}
        style={{
          backgroundImage: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
      </div>
    </div>
  );
}

function Shoes() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/shoes/" });
  const { isMobile } = useMobileDetection();
  const { isFirstVisit } = useFirstVisit();

  const shoesQuery = useSuspenseQuery({
    ...shoeQueries.list(true), // Include retired
    retry: (failureCount, error) => {
      if (error?.message?.includes("not authenticated")) return false;
      return failureCount < 2;
    },
  });
  const collectionsQuery = useSuspenseQuery({
    ...collectionQueries.list(),
    retry: (failureCount, error) => {
      if (error?.message?.includes("not authenticated")) return false;
      return failureCount < 2;
    },
  });

  // Remove unused modal state - now using URL-based modal

  // Initialize state from URL search parameters - default showRetired to true
  const [showRetired, setShowRetired] = useState(search.showRetired ?? true);
  const [selectedCollection, setSelectedCollection] = useState<string>(
    search.collection || "",
  );
  const [sortBy, setSortBy] = useState<"name" | "mileage" | "usage" | "date">(
    search.sortBy || "name",
  );
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>(
    search.brand || "",
  );
  const [selectedUsageLevel, setSelectedUsageLevel] = useState<string>(
    search.usageLevel || "",
  );
  const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">(
    search.dateRange || "all",
  );

  const shoes = shoesQuery.data || [];
  const collections = collectionsQuery.data || [];

  // Update URL when filters change
  const updateFilters = (
    updates: Partial<{
      showRetired: boolean;
      collection: string;
      sortBy: string;
      brand: string;
      usageLevel: string;
      dateRange: string;
      modal?: boolean;
    }>,
  ) => {
    const newSearch = {
      showRetired: updates.showRetired ?? showRetired,
      collection: updates.collection ?? selectedCollection,
      sortBy: updates.sortBy ?? sortBy,
      brand: updates.brand ?? selectedBrand,
      usageLevel: updates.usageLevel ?? selectedUsageLevel,
      dateRange: updates.dateRange ?? dateRange,
      modal: updates.modal ?? search.modal ?? false,
    };

    navigate({
      to: "/shoes",
      search: {
        showRetired: newSearch.showRetired,
        collection: newSearch.collection,
        sortBy: newSearch.sortBy as "name" | "mileage" | "usage" | "date",
        brand: newSearch.brand,
        usageLevel: newSearch.usageLevel,
        dateRange: newSearch.dateRange as "all" | "week" | "month" | "year",
        modal: newSearch.modal,
      },
      replace: true,
    });
  };

  // Filter shoes
  let filteredShoes = shoes;

  if (!showRetired) {
    filteredShoes = filteredShoes.filter((shoe) => !shoe.isRetired);
  }

  if (selectedCollection) {
    filteredShoes = filteredShoes.filter(
      (shoe) => shoe.collectionId === selectedCollection,
    );
  }

  if (selectedBrand) {
    filteredShoes = filteredShoes.filter(
      (shoe) => shoe.brand === selectedBrand,
    );
  }

  if (selectedUsageLevel) {
    filteredShoes = filteredShoes.filter((shoe) => {
      const currentMileage = shoe.currentMileage || 0;
      const usageLevel = getUsageLevel(currentMileage, shoe.maxMileage);
      return usageLevel === selectedUsageLevel;
    });
  }

  // Date range filter for shoes (based on creation date)
  if (dateRange !== "all") {
    const now = new Date();
    const cutoff = new Date();

    switch (dateRange) {
      case "week":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "year":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    filteredShoes = filteredShoes.filter(
      (shoe) => shoe.createdAt && new Date(shoe.createdAt) >= cutoff,
    );
  }

  // Sort shoes
  filteredShoes.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "mileage":
        return (b.currentMileage || 0) - (a.currentMileage || 0);
      case "usage":
        const aUsage = (a.currentMileage || 0) / a.maxMileage;
        const bUsage = (b.currentMileage || 0) / b.maxMileage;
        return bUsage - aUsage;
      case "date":
        return (b.createdAt || 0) - (a.createdAt || 0);
      default:
        return 0;
    }
  });

  // Calculate stats based on filtered shoes
  const activeFilteredShoes = filteredShoes.filter((shoe) => !shoe.isRetired);
  const retiredFilteredShoes = filteredShoes.filter((shoe) => shoe.isRetired);
  const totalFilteredMileage = filteredShoes.reduce(
    (sum, shoe) => sum + (shoe.currentMileage || 0),
    0,
  );
  const averageFilteredUsage =
    filteredShoes.length > 0
      ? filteredShoes.reduce(
          (sum, shoe) => sum + (shoe.currentMileage || 0) / shoe.maxMileage,
          0,
        ) / filteredShoes.length
      : 0;

  // Get unique brands for filter
  const uniqueBrands = Array.from(
    new Set(shoes.map((shoe) => shoe.brand).filter(Boolean)),
  ) as string[];

  // Get usage levels for filter
  const usageLevels = [
    { value: "low", label: "Low (0-30%)" },
    { value: "medium", label: "Medium (30-70%)" },
    { value: "high", label: "High (70-90%)" },
    { value: "very_high", label: "Very High (90%+)" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Shoes"
        description="Track the usage and condition of your running shoes"
        animate={false}
        actions={
          <Button
            onClick={() => {
              if (isMobile) {
                navigate({
                  to: "/shoes",
                  search: {
                    showRetired: showRetired,
                    collection: selectedCollection,
                    sortBy: sortBy,
                    brand: selectedBrand,
                    usageLevel: selectedUsageLevel,
                    dateRange: dateRange,
                    modal: true,
                  },
                });
              } else {
                navigate({
                  to: "/shoes/new",
                  search: { modal: false },
                });
              }
            }}
            icon={<Plus className="w-4 h-4" />}
            className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm px-5 py-2.5 text-sm"
          >
            Add Shoe
          </Button>
        }
      />

      {/* Modal for Adding Shoe - Only show on mobile */}
      {isMobile && (
        <FormModalSheet
          isOpen={search.modal}
          onClose={() => {
            navigate({ to: "/shoes", search: { ...search, modal: false } });
          }}
          title="Add New Shoe"
          description="Add a beautiful new pair of running shoes to your collection"
          formHeight="large"
        >
          <ShoeForm
            isModal={true}
            onSuccess={(shoeId) => {
              navigate({ to: "/shoes", search: { ...search, modal: false } });
              // Optionally navigate to the shoe details
              setTimeout(() => {
                navigate({
                  to: "/shoes/$shoeId",
                  params: { shoeId },
                  search: {},
                });
              }, 100);
            }}
            onCancel={() => {
              navigate({ to: "/shoes", search: { ...search, modal: false } });
            }}
          />
        </FormModalSheet>
      )}

      {/* Stats */}
      <motion.div
        {...getAnimationProps(isFirstVisit, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: 0.1 },
        })}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.3, delay: 0.15 },
            })}
          >
            <MetricCard
              title="Total Shoes"
              value={filteredShoes.length}
              subtitle="In collection"
              icon={<Footprints className="w-6 h-6" />}
              color="primary"
            />
          </motion.div>
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.3, delay: 0.2 },
            })}
          >
            <MetricCard
              title="Active Shoes"
              value={activeFilteredShoes.length}
              subtitle="In rotation"
              icon={<Activity className="w-6 h-6" />}
              color="success"
            />
          </motion.div>
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.3, delay: 0.25 },
            })}
          >
            <MetricCard
              title="Total Mileage"
              value={formatDistance(totalFilteredMileage)}
              subtitle="Miles logged"
              icon={<Gauge className="w-6 h-6" />}
              color="warning"
            />
          </motion.div>
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.3, delay: 0.3 },
            })}
          >
            <MetricCard
              title="Average Usage"
              value={`${Math.round(averageFilteredUsage * 100)}%`}
              subtitle="Wear level"
              icon={<Trophy className="w-6 h-6" />}
              color="neutral"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        {...getAnimationProps(isFirstVisit, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: 0.2 },
        })}
        className="bg-white rounded-2xl border border-gray-200/60 p-4 sm:p-5"
      >
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className={`flex items-center justify-between w-full gap-3 ${filtersExpanded ? "mb-5" : ""} hover:bg-gray-50 rounded-xl p-2 -m-2 transition-colors`}
        >
          <div className="flex items-center gap-2.5">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Filters & Sorting
            </span>
          </div>
          {filtersExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {filtersExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <CustomSelect
                value={dateRange}
                onChange={(value) => {
                  const newDateRange = value as
                    | "all"
                    | "week"
                    | "month"
                    | "year";
                  setDateRange(newDateRange);
                  updateFilters({ dateRange: newDateRange });
                }}
                options={[
                  { value: "all", label: "All Time" },
                  { value: "week", label: "Last Week" },
                  { value: "month", label: "Last Month" },
                  { value: "year", label: "Last Year" },
                ]}
                placeholder="Date Range"
                icon={<Calendar className="w-5 h-5" />}
              />

              <CustomSelect
                value={selectedCollection}
                onChange={(value) => {
                  setSelectedCollection(value);
                  updateFilters({ collection: value });
                }}
                options={[
                  { value: "", label: "All Collections" },
                  ...collections.map((collection) => ({
                    value: collection.id,
                    label: collection.name,
                  })),
                ]}
                placeholder="Select Collection"
                icon={<Package className="w-5 h-5" />}
              />

              <CustomSelect
                value={selectedBrand}
                onChange={(value) => {
                  setSelectedBrand(value);
                  updateFilters({ brand: value });
                }}
                options={[
                  { value: "", label: "All Brands" },
                  ...uniqueBrands.map((brand) => ({
                    value: brand,
                    label: brand,
                  })),
                ]}
                placeholder="Select Brand"
                icon={<Activity className="w-5 h-5" />}
              />

              <CustomSelect
                value={selectedUsageLevel}
                onChange={(value) => {
                  setSelectedUsageLevel(value);
                  updateFilters({ usageLevel: value });
                }}
                options={[
                  { value: "", label: "All Usage Levels" },
                  ...usageLevels,
                ]}
                placeholder="Usage Level"
                icon={<Heart className="w-5 h-5" />}
              />

              <CustomSelect
                value={sortBy}
                onChange={(value) => {
                  const newSortBy = value as
                    | "name"
                    | "mileage"
                    | "usage"
                    | "date";
                  setSortBy(newSortBy);
                  updateFilters({ sortBy: newSortBy });
                }}
                options={[
                  { value: "name", label: "Name" },
                  { value: "mileage", label: "Mileage" },
                  { value: "usage", label: "Usage Level" },
                  { value: "date", label: "Date Added" },
                ]}
                placeholder="Sort By"
                icon={<SortAsc className="w-5 h-5" />}
              />
            </div>

            <CustomCheckbox
              checked={showRetired}
              onChange={(checked) => {
                setShowRetired(checked);
                updateFilters({ showRetired: checked });
              }}
              label="Show retired shoes"
              description="Include shoes that have been retired from active use"
              icon={<Archive className="w-5 h-5" />}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Shoes Grid */}
      <motion.div
        {...getAnimationProps(isFirstVisit, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: 0.3 },
        })}
      >
        {filteredShoes.length === 0 ? (
          selectedCollection ||
          !showRetired ||
          selectedBrand ||
          selectedUsageLevel ||
          dateRange !== "all" ? (
            <EmptyStateCard
              title="No shoes found"
              description="No shoes found with current filters. Try adjusting your filters to see more shoes."
              icon={<Search className="w-8 h-8 text-gray-400" />}
              actionLabel="Clear Filters"
              onAction={() => {
                setSelectedCollection("");
                setSelectedBrand("");
                setSelectedUsageLevel("");
                setDateRange("all");
                setShowRetired(true);
                updateFilters({
                  collection: "",
                  brand: "",
                  usageLevel: "",
                  dateRange: "all",
                  showRetired: true,
                });
              }}
            />
          ) : (
            <EmptyStateCard
              title="No shoes yet"
              description="Add your first pair of running shoes to start tracking your mileage and performance."
              icon={<Footprints className="w-8 h-8 text-gray-400" />}
              actionLabel="Add Your First Shoe"
              onAction={() => {
                if (isMobile) {
                  navigate({
                    to: "/shoes",
                    search: {
                      showRetired: showRetired,
                      collection: selectedCollection,
                      sortBy: sortBy,
                      brand: selectedBrand,
                      usageLevel: selectedUsageLevel,
                      dateRange: dateRange,
                      modal: true,
                    },
                  });
                } else {
                  navigate({ to: "/shoes/new" });
                }
              }}
            />
          )
        ) : (
          <motion.div
            {...getAnimationProps(isFirstVisit, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.3 },
            })}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 w-full">
              {filteredShoes.map((shoe, index) => {
                const currentMileage = shoe.currentMileage || 0;
                const usageLevel = getUsageLevel(
                  currentMileage,
                  shoe.maxMileage,
                );
                const usagePercentage =
                  (currentMileage / shoe.maxMileage) * 100;
                const collection = collections.find(
                  (c) => c.id === shoe.collectionId,
                );

                return (
                  <ShoeCard
                    key={shoe.id}
                    shoe={shoe}
                    collection={collection}
                    currentMileage={currentMileage}
                    usageLevel={usageLevel}
                    usagePercentage={usagePercentage}
                    onClick={() =>
                      navigate({
                        to: "/shoes/$shoeId",
                        params: { shoeId: shoe.id },
                      })
                    }
                    className="h-full"
                    index={index}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
}
