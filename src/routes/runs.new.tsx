import { useSuspenseQuery } from "@tanstack/react-query";
import {
  useNavigate,
  createFileRoute,
  useSearch,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { shoeQueries, useCreateRunMutation } from "~/queries";
import { Loader } from "~/components/Loader";
import {
  Form,
  FormSection,
  Input,
  Textarea,
  Select,
  Button,
  FormGrid,
} from "~/components/FormComponents";
import type { CreateRunForm } from "~/types";
import {
  RUN_TYPE_OPTIONS,
  RUN_SURFACE_OPTIONS,
  RUN_EFFORT_OPTIONS,
  calculatePace,
} from "~/types";
import { withAuth } from "~/components/AuthProvider";
import { FormModalSheet } from "~/components/navigation/ModalSheet";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  Gauge,
  Thermometer,
  Mountain,
  Heart,
  Flame,
  Plus,
  Navigation,
  Timer,
  Target,
} from "lucide-react";
import { EmptyStateCard } from "~/components/ui/Cards";
import { useIsMobile } from "~/hooks/useIsMobile";

function NewRunPage() {
  return (
    <ErrorBoundary>
      <NewRun />
    </ErrorBoundary>
  );
}

export const Route = createFileRoute("/runs/new")({
  component: withAuth(NewRunPage),
  pendingComponent: () => <Loader />,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      modal: search?.modal === true || search?.modal === "true" || false,
    };
  },
});

function NewRun() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/runs/new" });
  const isMobile = useIsMobile();
  const isModal = search.modal;
  const shoesQuery = useSuspenseQuery(shoeQueries.list());
  const createRunMutation = useCreateRunMutation();

  const shoes = shoesQuery.data.filter((shoe) => !shoe.isRetired);

  const [formData, setFormData] = useState<CreateRunForm>({
    date: new Date().toISOString().split("T")[0],
    distance: "",
    duration: "",
    pace: "",
    shoeId: shoes[0]?.id || "",
    runType: "easy",
    surface: undefined,
    effort: undefined,
    weather: "",
    temperature: undefined,
    humidity: undefined,
    notes: "",
    route: "",
    location: "",
    elevation: undefined,
    heartRate: undefined,
    calories: undefined,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateRunForm, string>>
  >({});

  // Redirect mobile users to modal
  useEffect(() => {
    if (isMobile && !isModal) {
      navigate({
        to: "/runs",
        search: { modal: true },
        replace: true,
      });
    }
  }, [isMobile, isModal, navigate]);

  // Show loading while redirecting on mobile
  if (isMobile && !isModal) {
    return <Loader />;
  }

  const handleInputChange = (
    field: keyof CreateRunForm,
    value: string | number | undefined,
  ) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-calculate pace when distance or duration changes
      if (
        (field === "distance" || field === "duration") &&
        newData.distance &&
        newData.duration
      ) {
        newData.pace = calculatePace(
          parseFloat(newData.distance),
          newData.duration,
        );
      }

      return newData;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateRunForm, string>> = {};

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.distance || parseFloat(formData.distance) <= 0) {
      newErrors.distance = "Distance must be greater than 0";
    }

    if (!formData.shoeId) {
      newErrors.shoeId = "Please select a shoe";
    }

    if (!formData.runType) {
      newErrors.runType = "Run type is required";
    }

    if (formData.duration && parseFloat(formData.duration) <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    }

    if (formData.elevation !== undefined && formData.elevation < 0) {
      newErrors.elevation = "Elevation cannot be negative";
    }

    if (
      formData.heartRate !== undefined &&
      (formData.heartRate < 0 || formData.heartRate > 300)
    ) {
      newErrors.heartRate = "Heart rate must be between 0 and 300";
    }

    if (formData.calories !== undefined && formData.calories < 0) {
      newErrors.calories = "Calories cannot be negative";
    }

    setErrors(newErrors);
    console.log("Validation errors found:", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form submitted with data:", formData);
    console.log("Form validation starting...");

    if (!validateForm()) {
      console.log("Form validation failed with errors:", errors);
      toast.error("Please fix the errors in the form");
      return;
    }

    console.log("Form validation passed");

    try {
      const runId = await createRunMutation.mutateAsync({
        ...formData,
        distance: Number(formData.distance),
        duration: formData.duration ? Number(formData.duration) : undefined,
        temperature: formData.temperature
          ? Number(formData.temperature)
          : undefined,
        elevation: formData.elevation ? Number(formData.elevation) : undefined,
        heartRate: formData.heartRate ? Number(formData.heartRate) : undefined,
        calories: formData.calories ? Number(formData.calories) : undefined,
      });

      console.log("Run created successfully with ID:", runId);
      toast.success("Run logged successfully!");

      if (isModal) {
        // For modal, navigate to run details
        navigate({ to: "/runs/$runId", params: { runId }, search: {} });
      } else {
        // For full page, navigate to run details
        navigate({ to: "/runs/$runId", params: { runId }, search: {} });
      }
    } catch (error: any) {
      console.error("Error creating run:", error);

      let errorMessage = "Failed to log run. Please try again.";
      if (error?.message?.includes("not authenticated")) {
        errorMessage = "Authentication required. Please sign in again.";
        navigate({ to: "/auth/signin" });
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  console.log("Rendering NewRun component");
  console.log("Shoes:", shoes);
  console.log("Form data:", formData);
  console.log("Mutation pending:", createRunMutation.isPending);

  if (shoes.length === 0) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <EmptyStateCard
            title="No Active Shoes Found"
            description="You need to add a pair of shoes before you can log runs. Add your first pair to get started!"
            icon={<Navigation className="w-8 h-8 text-gray-400" />}
            actionLabel="Add Shoe"
            onAction={() => navigate({ to: "/shoes/new" })}
          />
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/" })}
              className="text-gray-500"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formContent = (
    <>
      <FormSection
        title="Basic Information"
        description="When did you run and which shoes did you wear?"
        className="space-y-6"
      >
        <FormGrid cols={2}>
          <Input
            label="Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            error={errors.date}
            icon={<Calendar className="w-5 h-5" />}
            helperText="When did this run happen?"
          />

          <Select
            label="Shoe"
            required
            value={formData.shoeId}
            onChange={(e) => handleInputChange("shoeId", e.target.value)}
            error={errors.shoeId}
            options={shoes.map((shoe) => ({
              value: shoe.id,
              label: `${shoe.name} (${shoe.brand} ${shoe.model})`,
            }))}
            placeholder="Select a shoe"
            helperText="Which shoes did you run in?"
          />
        </FormGrid>

        <FormGrid cols={3}>
          <Input
            label="Distance"
            type="number"
            step="0.01"
            required
            value={formData.distance}
            onChange={(e) =>
              handleInputChange(
                "distance",
                e.target.value ? parseFloat(e.target.value) : 0,
              )
            }
            error={errors.distance}
            placeholder="5.0"
            icon={<MapPin className="w-5 h-5" />}
            helperText="Miles"
          />

          <Input
            label="Duration"
            type="number"
            step="0.1"
            value={formData.duration || ""}
            onChange={(e) =>
              handleInputChange(
                "duration",
                e.target.value ? parseFloat(e.target.value) : undefined,
              )
            }
            error={errors.duration}
            placeholder="45.0"
            icon={<Timer className="w-5 h-5" />}
            helperText="Minutes"
          />

          <Input
            label="Pace"
            value={formData.pace || ""}
            onChange={(e) =>
              handleInputChange("pace", e.target.value || undefined)
            }
            placeholder="Auto-calculated"
            readOnly={!!(formData.distance && formData.duration)}
            icon={<Gauge className="w-5 h-5" />}
            helperText="Per mile"
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Run Details"
        description="What type of run was this and where did you go?"
      >
        <FormGrid cols={2}>
          <Select
            label="Run Type"
            required
            value={formData.runType}
            onChange={(e) =>
              handleInputChange("runType", e.target.value as any)
            }
            error={errors.runType}
            options={RUN_TYPE_OPTIONS}
            helperText="Indoor or outdoor?"
          />

          <Select
            label="Surface"
            value={formData.surface || ""}
            onChange={(e) =>
              handleInputChange("surface", e.target.value || undefined)
            }
            options={RUN_SURFACE_OPTIONS}
            placeholder="Select surface"
            helperText="What did you run on?"
          />
        </FormGrid>

        <FormGrid cols={2}>
          <Select
            label="Effort Level"
            value={formData.effort || ""}
            onChange={(e) =>
              handleInputChange("effort", e.target.value || undefined)
            }
            options={RUN_EFFORT_OPTIONS}
            placeholder="Select effort"
            icon={<Target className="w-5 h-5" />}
            helperText="How hard did you push?"
          />

          <Input
            label="Route"
            value={formData.route || ""}
            onChange={(e) =>
              handleInputChange("route", e.target.value || undefined)
            }
            placeholder="Central Park Loop, Neighborhood..."
            icon={<Navigation className="w-5 h-5" />}
            helperText="Where did you run?"
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Environmental Conditions"
        description="What were the weather and terrain like?"
      >
        <FormGrid cols={2}>
          <Input
            label="Weather"
            value={formData.weather || ""}
            onChange={(e) =>
              handleInputChange("weather", e.target.value || undefined)
            }
            placeholder="Sunny, Rainy, Cloudy, Windy..."
            icon={<Thermometer className="w-5 h-5" />}
            helperText="How was the weather?"
          />

          <Input
            label="Temperature"
            type="number"
            value={formData.temperature || ""}
            onChange={(e) =>
              handleInputChange(
                "temperature",
                e.target.value ? parseInt(e.target.value) : undefined,
              )
            }
            placeholder="72"
            icon={<Thermometer className="w-5 h-5" />}
            helperText="Degrees Fahrenheit"
          />
        </FormGrid>

        <Input
          label="Elevation Gain"
          type="number"
          value={formData.elevation || ""}
          onChange={(e) =>
            handleInputChange(
              "elevation",
              e.target.value ? parseInt(e.target.value) : undefined,
            )
          }
          error={errors.elevation}
          placeholder="250"
          icon={<Mountain className="w-5 h-5" />}
          helperText="Feet gained during the run"
        />
      </FormSection>

      <FormSection
        title="Performance Metrics"
        description="Optional fitness tracking data from your watch or app"
      >
        <FormGrid cols={2}>
          <Input
            label="Average Heart Rate"
            type="number"
            value={formData.heartRate || ""}
            onChange={(e) =>
              handleInputChange(
                "heartRate",
                e.target.value ? parseInt(e.target.value) : undefined,
              )
            }
            error={errors.heartRate}
            placeholder="155"
            icon={<Heart className="w-5 h-5" />}
            helperText="Beats per minute"
          />

          <Input
            label="Calories Burned"
            type="number"
            value={formData.calories || ""}
            onChange={(e) =>
              handleInputChange(
                "calories",
                e.target.value ? parseInt(e.target.value) : undefined,
              )
            }
            error={errors.calories}
            placeholder="450"
            icon={<Flame className="w-5 h-5" />}
            helperText="Total calories"
          />
        </FormGrid>
      </FormSection>

      <FormSection
        title="Additional Notes"
        description="How did the run feel? Any observations about your shoes or the conditions?"
      >
        <Textarea
          label="Notes"
          value={formData.notes || ""}
          onChange={(e) =>
            handleInputChange("notes", e.target.value || undefined)
          }
          placeholder="Great run! Felt strong throughout. The new shoes felt comfortable on the trail..."
          helperText="Optional - Share your thoughts about this run"
        />
      </FormSection>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 pt-6"
      >
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isModal) {
              navigate({ to: "/runs", search: { modal: false } });
            } else {
              navigate({ to: "/runs", search: { modal: false } });
            }
          }}
          disabled={createRunMutation.isPending}
          fullWidth
          className="sm:flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={createRunMutation.isPending}
          disabled={createRunMutation.isPending}
          icon={<Plus className="w-5 h-5" />}
          fullWidth
          className="sm:flex-1"
        >
          Log Run
        </Button>
      </motion.div>
    </>
  );

  if (isModal) {
    return (
      <FormModalSheet
        isOpen={true}
        onClose={() => navigate({ to: "/runs", search: { modal: false } })}
        title="Log New Run"
        description="Record the details of your running session"
        formHeight="large"
      >
        <div className="space-y-6">{formContent}</div>
      </FormModalSheet>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 pb-safe">
      <Form
        title="Log New Run"
        description="Record the details of your running session"
        renderForm={false}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formContent}
        </form>
      </Form>
    </div>
  );
}
