import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useSuspenseQuery } from "@tanstack/react-query";
import { shoeQueries, useUpdateRunMutation } from "~/queries";
import {
  FormSection,
  Input,
  Textarea,
  Select,
  Button,
  FormGrid,
} from "~/components/FormComponents";
import type { CreateRunForm, Run } from "~/types";
import {
  RUN_TYPE_OPTIONS,
  RUN_SURFACE_OPTIONS,
  RUN_EFFORT_OPTIONS,
  calculatePace,
} from "~/types";
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
  Navigation,
  Timer,
  Target,
  Save,
  ArrowLeft,
} from "lucide-react";

interface EditRunFormProps {
  run: Run;
  onSuccess?: (runId: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
  className?: string;
}

export function EditRunForm({
  run,
  onSuccess,
  onCancel,
  isModal = false,
  className = "",
}: EditRunFormProps) {
  const navigate = useNavigate();
  const shoesQuery = useSuspenseQuery(shoeQueries.list());
  const updateRunMutation = useUpdateRunMutation();

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

  // Initialize form data when run loads
  useEffect(() => {
    if (run) {
      setFormData({
        date: run.date || new Date().toISOString().split("T")[0],
        distance: run.distance?.toString() || "",
        duration: run.duration?.toString() || "",
        pace: run.pace || "",
        shoeId: run.shoeId || "",
        runType: run.runType || "easy",
        surface: run.surface || undefined,
        effort: run.effort || undefined,
        weather: run.weather || "",
        temperature: run.temperature || undefined,
        humidity: undefined,
        notes: run.notes || "",
        route: run.route || "",
        location: "",
        elevation: run.elevation || undefined,
        heartRate: run.heartRate || undefined,
        calories: run.calories || undefined,
      });
    }
  }, [run]);

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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      await updateRunMutation.mutateAsync({
        id: run.id,
        ...formData,
        distance: parseFloat(formData.distance),
        duration: formData.duration ? parseFloat(formData.duration) : undefined,
        temperature: formData.temperature
          ? parseFloat(formData.temperature.toString())
          : undefined,
        elevation: formData.elevation
          ? parseFloat(formData.elevation.toString())
          : undefined,
        heartRate: formData.heartRate
          ? parseInt(formData.heartRate.toString())
          : undefined,
        calories: formData.calories
          ? parseInt(formData.calories.toString())
          : undefined,
      });

      toast.success("Run updated successfully!");

      if (onSuccess) {
        onSuccess(run.id);
      } else {
        navigate({ to: "/runs/$runId", params: { runId: run.id } });
      }
    } catch (error: any) {
      console.error("Error updating run:", error);

      let errorMessage = "Failed to update run. Please try again.";
      if (error?.message?.includes("not authenticated")) {
        errorMessage = "Authentication required. Please sign in again.";
        navigate({ to: "/auth/signin" });
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={(e) => handleInputChange("distance", e.target.value)}
              error={errors.distance}
              placeholder="5.0"
              icon={<MapPin className="w-5 h-5" />}
              helperText="Miles"
            />

            <Input
              label="Duration"
              type="time"
              step="1"
              value={formData.duration || ""}
              onChange={(e) => handleInputChange("duration", e.target.value)}
              error={errors.duration}
              placeholder="00:45:00"
              icon={<Timer className="w-5 h-5" />}
              helperText="HH:MM:SS format"
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
            helperText="Optional - record any thoughts about the run"
            maxLength={1000}
          />
        </FormSection>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 pt-6"
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                navigate({ to: "/runs/$runId", params: { runId: run.id } });
              }
            }}
            disabled={updateRunMutation.isPending}
            icon={<ArrowLeft className="w-5 h-5" />}
            fullWidth
            className="sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={updateRunMutation.isPending}
            disabled={updateRunMutation.isPending}
            icon={<Save className="w-5 h-5" />}
            fullWidth
            className="sm:flex-1"
          >
            Update Run
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
