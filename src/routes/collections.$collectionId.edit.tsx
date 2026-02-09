import {
  useNavigate,
  createFileRoute,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useCollection } from "~/queries";
import { Loader } from "~/components/Loader";
import { Form } from "~/components/FormComponents";
import { EditCollectionForm } from "../components/EditCollectionForm";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { withAuth } from "~/components/AuthProvider";
import { useIsMobile } from "~/hooks/useIsMobile";
import { ErrorBoundary } from "~/components/ErrorBoundary";

function EditCollectionPage() {
  return (
    <ErrorBoundary>
      <EditCollection />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/collections/$collectionId/edit")({
  component: withAuth(EditCollectionPage),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      modal: search?.modal === true || search?.modal === "true" || false,
    };
  },
});

function EditCollection() {
  const navigate = useNavigate();
  const { collectionId } = Route.useParams();
  const search = Route.useSearch();
  const isMobile = useIsMobile();
  const isModal = search.modal;
  const { data: collection, isLoading: isCollectionLoading } = useCollection(collectionId);

  // Redirect mobile users to modal
  useEffect(() => {
    if (isMobile && !isModal) {
      navigate({
        to: "/collections/$collectionId/edit",
        params: { collectionId },
        search: { modal: true },
        replace: true,
      });
    }
  }, [isMobile, isModal, navigate, collectionId]);

  // Show loading while redirecting on mobile
  if (isMobile && !isModal) {
    return <Loader />;
  }

  if (isCollectionLoading || !collection) {
    return <Loader />;
  }

  const formContent = (
    <EditCollectionForm
      collection={collection}
      onSuccess={(collectionId: string) => {
        if (isModal) {
          navigate({
            to: "/collections/$collectionId",
            params: { collectionId },
            search: { modal: false },
          });
        } else {
          navigate({
            to: "/collections/$collectionId",
            params: { collectionId },
            search: { modal: false },
          });
        }
      }}
      onCancel={() => {
        if (isModal) {
          navigate({
            to: "/collections/$collectionId",
            params: { collectionId },
            search: { modal: false },
          });
        } else {
          navigate({
            to: "/collections/$collectionId",
            params: { collectionId },
            search: { modal: false },
          });
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
            to: "/collections/$collectionId",
            params: { collectionId },
            search: {},
          })
        }
        title="Edit Collection"
        description="Update the details of your collection"
        formHeight="medium"
      >
        {formContent}
      </FormModalSheet>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe">
      <Form
        title="Edit Collection"
        description="Update the details of your collection"
        maxWidth="lg"
        renderForm={false}
      >
        {formContent}
      </Form>
    </div>
  );
}
