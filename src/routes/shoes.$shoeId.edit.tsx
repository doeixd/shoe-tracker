import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { useShoe } from "~/queries";
import { Loader } from "~/components/Loader";
import { Form } from "~/components/FormComponents";
import { EditShoeForm } from "~/components/EditShoeForm";
import { withAuth } from "~/components/AuthProvider";

export const Route = createFileRoute("/shoes/$shoeId/edit")({
  component: withAuth(EditShoe),
  pendingComponent: () => <Loader />,
});

function EditShoe() {
  const navigate = useNavigate();
  const { shoeId } = Route.useParams();
  const { data: shoe } = useShoe(shoeId);

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
            navigate({ to: "/shoes/$shoeId", params: { shoeId } });
          }}
          onCancel={() => {
            navigate({ to: "/shoes/$shoeId", params: { shoeId } });
          }}
        />
      </Form>
    </div>
  );
}
