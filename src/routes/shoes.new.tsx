import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader } from "~/components/Loader";
import { Form } from "~/components/FormComponents";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { withAuth } from "~/components/AuthProvider";
import { ShoeForm } from "~/components/ShoeForm";
import { useIsMobileSSR } from "~/hooks/useIsMobile";

function NewShoePage() {
  return (
    <ErrorBoundary>
      <NewShoe />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/shoes/new")({
  component: withAuth(NewShoePage),
  pendingComponent: () => <Loader />,
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
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe">
      <Form
        title="Add New Shoe"
        description="Add a beautiful new pair of running shoes to your collection"
        maxWidth="xl"
        renderForm={false}
      >
        <ShoeForm />
      </Form>
    </div>
  );
}
