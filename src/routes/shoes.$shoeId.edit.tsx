import {
  useNavigate,
  createFileRoute,
  useSearch,
} from "@tanstack/react-router";
import { useShoe } from "~/queries";
import { Loader } from "~/components/Loader";
import { Form } from "~/components/FormComponents";
import { EditShoeForm } from "~/components/EditShoeForm";
import { useAuth } from "~/components/AuthProvider";
import { useIsMobile } from "~/hooks/useIsMobile";
import { requireAuth } from "~/utils/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/shoes/$shoeId/edit")({
  component: EditShoe,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      modal: Boolean(search?.modal),
    };
  },
  loader: async ({ context: { queryClient } }) => {
    // Require authentication - will redirect if not authenticated
    const user = await requireAuth(queryClient);
    return { user };
  },
});

function EditShoe() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { shoeId } = Route.useParams();
  const search = useSearch({ from: "/shoes/$shoeId/edit" });
  const isMobile = useIsMobile();
  const isModal = search.modal;
  const {
    data: shoe,
    isLoading: shoeLoading,
    error: shoeError,
  } = useShoe(shoeId);

  // Debug logging
  console.log("EditShoe component loaded:", {
    shoeId,
    search,
    isMobile,
    isModal,
    isAuthenticated,
    isLoading,
    shoeLoading,
    currentPath: window.location.pathname
  });

  // Mobile users should be handled by the parent route's modal
  // This route now only handles desktop full-page edit experience

  if (isLoading) {
    return <Loader />;
  }

  // If mobile user somehow reaches this route, redirect to parent with modal
  if (isMobile) {
    navigate({
      to: "/shoes/$shoeId",
      params: { shoeId },
      search: { editModal: true },
      replace: true,
    });
    return <Loader />;
  }

  if (!isAuthenticated) {
    navigate({
      to: "/auth/signin",
      search: { redirect: `/shoes/${shoeId}/edit` },
    });
    return null;
  }

  if (shoeLoading) {
    return <Loader />;
  }

  if (shoeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Shoe
          </h1>
          <p className="text-gray-600">{shoeError.message}</p>
          <button
            onClick={() =>
              navigate({ to: "/shoes/$shoeId", params: { shoeId }, search: { editModal: false } })
            }
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!shoe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Shoe Not Found</h1>
          <p className="text-gray-600">
            Could not find the shoe you're trying to edit
          </p>
          <button
            onClick={() => navigate({ to: "/shoes", search: { showRetired: true, collection: "", sortBy: "name", modal: false, brand: "", usageLevel: "", dateRange: "all" } })}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Back to Shoes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe">
      <Form
        title="Edit Shoe"
        description="Update the details of your running shoe"
        maxWidth="xl"
        renderForm={false}
      >
        <EditShoeForm
          shoe={shoe}
          onSuccess={(shoeId) => {
            navigate({ to: "/shoes/$shoeId", params: { shoeId }, search: { editModal: false } });
          }}
          onCancel={() => {
            navigate({ to: "/shoes/$shoeId", params: { shoeId }, search: { editModal: false } });
          }}
        />
      </Form>
    </div>
  );
}
