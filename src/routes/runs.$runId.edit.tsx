import {
  useNavigate,
  createFileRoute,
  useSearch,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useRun } from "~/queries";
import { Loader } from "~/components/Loader";
import { Form } from "~/components/FormComponents";
import { EditRunForm } from "../components/EditRunForm";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { withAuth } from "~/components/AuthProvider";
import { useIsMobile } from "~/hooks/useIsMobile";
import { ErrorBoundary } from "~/components/ErrorBoundary";

function EditRunPage() {
  return (
    <ErrorBoundary>
      <EditRun />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/runs/$runId/edit")({
  component: withAuth(EditRunPage),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      modal: search?.modal === true || search?.modal === "true" || false,
    };
  },
});

function EditRun() {
  const navigate = useNavigate();
  const { runId } = Route.useParams();
  const search = useSearch({ from: "/runs/$runId/edit" });
  const isMobile = useIsMobile();
  const isModal = search.modal;
  const { data: run } = useRun(runId);

  // Redirect mobile users to modal
  useEffect(() => {
    if (isMobile && !isModal) {
      navigate({
        to: "/runs/$runId/edit",
        params: { runId },
        search: { modal: true },
        replace: true,
      });
    }
  }, [isMobile, isModal, navigate, runId]);

  // Show loading while redirecting on mobile
  if (isMobile && !isModal) {
    return <Loader />;
  }

  const formContent = (
    <EditRunForm
      run={run}
      onSuccess={(runId: string) => {
        if (isModal) {
          navigate({
            to: "/runs/$runId",
            params: { runId },
            search: { modal: false },
          });
        } else {
          navigate({
            to: "/runs/$runId",
            params: { runId },
            search: { modal: false },
          });
        }
      }}
      onCancel={() => {
        if (isModal) {
          navigate({
            to: "/runs/$runId",
            params: { runId },
            search: { modal: false },
          });
        } else {
          navigate({
            to: "/runs/$runId",
            params: { runId },
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
            to: "/runs/$runId",
            params: { runId },
            search: {},
          })
        }
        title="Edit Run"
        description="Update the details of your run"
        formHeight="large"
      >
        {formContent}
      </FormModalSheet>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe">
      <Form
        title="Edit Run"
        description="Update the details of your run"
        maxWidth="xl"
        renderForm={false}
      >
        {formContent}
      </Form>
    </div>
  );
}
