import {
  useNavigate,
  createFileRoute,
  useSearch,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader } from "~/components/Loader";
import { Form } from "~/components/FormComponents";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { withAuth } from "~/components/AuthProvider";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { CollectionForm } from "~/components/CollectionForm";
import { useIsMobile } from "~/hooks/useIsMobile";

function NewCollectionPage() {
  return (
    <ErrorBoundary>
      <NewCollection />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/collections/new")({
  component: withAuth(NewCollectionPage),
  pendingComponent: () => <Loader />,
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
