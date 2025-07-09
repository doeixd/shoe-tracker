import {
  useNavigate,
  createFileRoute,
  useSearch,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader } from "~/components/Loader";
import { Form } from "~/components/FormComponents";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { useAuth } from "~/components/AuthProvider";
import { Loader2 } from "lucide-react";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { CollectionForm } from "~/components/CollectionForm";
import { useIsMobile } from "~/hooks/useIsMobile";

function NewCollectionPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Sign in required
            </h2>
            <p className="mt-2 text-gray-600">
              Please sign in to create collections.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <NewCollection />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/collections/new")({
  component: NewCollectionPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      modal: search?.modal === true || search?.modal === "true" || false,
    };
  },
});

function NewCollection() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/collections/new" });
  const isMobile = useIsMobile();
  const isModal = search.modal;

  // Redirect mobile users to modal
  useEffect(() => {
    if (isMobile && !isModal) {
      navigate({
        to: "/collections",
        search: { modal: true },
        replace: true,
      });
    }
  }, [isMobile, isModal, navigate]);

  // Show loading while redirecting on mobile
  if (isMobile && !isModal) {
    return <Loader />;
  }

  const formContent = (
    <CollectionForm
      onSuccess={(collectionId) => {
        if (isModal) {
          navigate({
            to: "/collections/$collectionId",
            params: { collectionId },
            search: {},
          });
        } else {
          navigate({
            to: "/collections/$collectionId",
            params: { collectionId },
          });
        }
      }}
      onCancel={() => {
        if (isModal) {
          navigate({
            to: "/collections",
            search: { modal: false },
          });
        } else {
          navigate({ to: "/collections", search: { modal: false } });
        }
      }}
      isModal={isModal}
    />
  );

  if (isModal) {
    return (
      <FormModalSheet
        isOpen={true}
        onClose={() =>
          navigate({
            to: "/collections",
            search: { modal: false },
          })
        }
        title="New Collection"
        description="Create a new collection to organize your running shoes"
        formHeight="medium"
      >
        {formContent}
      </FormModalSheet>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe">
      <Form
        title="New Collection"
        description="Create a new collection to organize your running shoes"
        maxWidth="lg"
        renderForm={false}
      >
        {formContent}
      </Form>
    </div>
  );
}
