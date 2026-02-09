import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { withAuth } from "~/components/AuthProvider";
import { ShoeForm } from "~/components/ShoeForm";
import { useIsMobileSSR } from "~/hooks/useIsMobile";
import { PageContainer, PageHeader } from "~/components/PageHeader";

function NewShoePage() {
  return (
    <ErrorBoundary>
      <NewShoe />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/shoes/new")({
  component: withAuth(NewShoePage),
});

function NewShoe() {
  const isMobile = useIsMobileSSR();
  const navigate = useNavigate();

  // Redirect to modal on mobile devices
  useEffect(() => {
    if (isMobile) {
      navigate({
        to: "/shoes",
        search: {
          showRetired: true,
          collection: "",
          sortBy: "name" as const,
          modal: true,
          brand: "",
          usageLevel: "",
          dateRange: "all" as const,
        },
        replace: true,
      });
    }
  }, [isMobile, navigate]);

  // Don't render anything on mobile since we're redirecting
  if (isMobile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Opening add shoe form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50/50 pb-safe">
      <PageContainer className="max-w-6xl">
        <PageHeader
          title="Add New Shoe"
          description="Add a new pair to your rotation and start tracking mileage."
          animate={false}
        />
        <div className="max-w-4xl">
          <ShoeForm />
        </div>
      </PageContainer>
    </div>
  );
}
