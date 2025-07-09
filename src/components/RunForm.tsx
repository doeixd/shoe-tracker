import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useShoes, useCreateRunMutation } from "~/queries";
import {
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
import { motion } from "motion/react";
import {
  Plus,
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
  Route as RouteIcon,
} from "lucide-react";
import { EmptyStateCard } from "~/components/ui/Cards";
import { FormBackButton } from "~/components/ui/BackButton";

interface RunFormProps {
  onSuccess?: (runId: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
  className?: string;
}

export function RunForm({
  onSuccess,
  onCancel,
  isModal = false,
  className = "",
}: RunFormProps) {
  const navigate = useNavigate();
  const { data: shoes } = useShoes();
  const createRunMutation = useCreateRunMutation();

  const [formData, setFormData] = useState<CreateRunForm>({
    date: new Date().toISOString().split("T")[0],
    distance: "",
    duration: "",
    shoeId: "",
    runType: "easy",
    surface: undefined,
    effort: undefined,
    notes: "",
    weather: "",
    temperature: undefined,
    humidity: undefined,
    elevation: undefined,
    heartRate: undefined,
    location: "",
    route: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateRunForm, string>>
  >({});

  // Update form with default shoe when shoes load
  useEffect(() => {
    if (shoes && shoes.length > 0 && !formData.shoeId) {
      setFormData((prev) => ({
        ...prev,
        shoeId: shoes[0].id,
      }));
    }
  }, [shoes, formData.shoeId]);

  const handleInputChange = (
    field: keyof CreateRunForm,
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateRunForm, string>> = {};

    if (!formData.distance || parseFloat(formData.distance) <= 0) {
      newErrors.distance = "Distance must be greater than 0";
    }

    if (!formData.duration) {
      newErrors.duration = "Duration is required";
    }

    if (!formData.shoeId) {
      newErrors.shoeId = "Please select a shoe";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (formData.temperature !== undefined && formData.temperature < -50) {
      newErrors.temperature = "Temperature seems too low";
    }

    if (
      formData.humidity !== undefined &&
      (formData.humidity < 0 || formData.humidity > 100)
    ) {
      newErrors.humidity = "Humidity must be between 0 and 100";
    }

    if (formData.elevation !== undefined && formData.elevation < 0) {
      newErrors.elevation = "Elevation cannot be negative";
    }

    if (
      formData.heartRate !== undefined &&
      (formData.heartRate < 50 || formData.heartRate > 220)
    ) {
      newErrors.heartRate = "Heart rate seems unrealistic";
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
      // Helper function to convert duration string to minutes
      const convertDurationToMinutes = (
        duration: string,
      ): number | undefined => {
        if (!duration) return undefined;
        const timeParts = duration.split(":");
        let totalMinutes = 0;

        if (timeParts.length === 3) {
          // HH:MM:SS format
          totalMinutes =
            parseInt(timeParts[0]) * 60 +
            parseInt(timeParts[1]) +
            parseInt(timeParts[2]) / 60;
        } else if (timeParts.length === 2) {
          // MM:SS format
          totalMinutes = parseInt(timeParts[0]) + parseInt(timeParts[1]) / 60;
        }
        return totalMinutes;
      };

      // Convert form data to the expected format
      const runData = {
        ...formData,
        distance: parseFloat(formData.distance),
        duration: convertDurationToMinutes(formData.duration),
        temperature: formData.temperature
          ? parseFloat(formData.temperature.toString())
          : undefined,
        humidity: formData.humidity
          ? parseFloat(formData.humidity.toString())
          : undefined,
        elevation: formData.elevation
          ? parseFloat(formData.elevation.toString())
          : undefined,
        heartRate: formData.heartRate
          ? parseInt(formData.heartRate.toString())
          : undefined,
      };

      const runId = await createRunMutation.mutateAsync(runData);

      toast.success("Run logged successfully!");

      if (onSuccess) {
        onSuccess(runId);
      } else {
        navigate({ to: "/runs/$runId", params: { runId: runId.toString() } });
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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate({
        to: "/runs",
        search: {
          modal: false,
        },
      });
    }
  };

  // Calculate pace if both distance and duration are provided
  const calculatedPace = useMemo(() => {
    if (formData.distance && formData.duration) {
      try {
        return calculatePace(parseFloat(formData.distance), formData.duration);
      } catch {
        return null;
      }
    }
    return null;
  }, [formData.distance, formData.duration]);

  if (!shoes || shoes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md mx-auto">
          <EmptyStateCard
            title="No Shoes Found"
            description="You need to add shoes before logging runs. Add your first pair of running shoes to get started."
            icon={<RouteIcon className="w-8 h-8 text-gray-400" />}
            actionLabel="Add Shoes"
            onAction={() =>
              navigate({
                to: "/shoes",
                search: {
                  modal: true,
                  showRetired: false,
                  collection: "",
                  sortBy: "name" as const,
                  brand: "",
                  usageLevel: "",
                  dateRange: "all" as const,
                },
              })
            }
          />
          {isModal && (
            <div className="mt-4 text-center">
              <div className="flex justify-end items-center gap-3">
                <FormBackButton
                  onCancel={handleCancel}
                  size="sm"
                  className="text-gray-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSection
          title="Basic Information"
          description="When did you run and for how long?"
        >
          <FormGrid cols={3}>
            <Input
              label="Date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              error={errors.date}
              icon={<Calendar className="w-5 h-5" />}
            />

            <Input
              label="Distance (miles)"
              type="number"
              step="0.01"
              required
              value={formData.distance}
              onChange={(e) => handleInputChange("distance", e.target.value)}
              error={errors.distance}
              placeholder="3.1"
              icon={<MapPin className="w-5 h-5" />}
              helperText="How far did you run?"
            />

            <Input
              label="Duration"
              type="time"
              step="1"
              required
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
              error={errors.duration}
              icon={<Clock className="w-5 h-5" />}
              helperText="How long did it take?"
            />
          </FormGrid>

          {calculatedPace && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Calculated Pace: {calculatedPace}
                </span>
              </div>
            </div>
          )}

          <Select
            label="Shoes"
            required
            value={formData.shoeId}
            onChange={(e) => handleInputChange("shoeId", e.target.value)}
            error={errors.shoeId}
            options={shoes.map((shoe) => ({
              value: shoe.id,
              label: `${shoe.name} (${shoe.currentMileage || 0} miles)`,
            }))}
            helperText="Which shoes did you wear?"
          />
        </FormSection>

        <FormSection
          title="Run Details"
          description="What type of run was this?"
        >
          <FormGrid cols={3}>
            <Select
              label="Run Type"
              value={formData.runType}
              onChange={(e) => handleInputChange("runType", e.target.value)}
              options={RUN_TYPE_OPTIONS}
              icon={<Target className="w-5 h-5" />}
            />

            <Select
              label="Surface"
              value={formData.surface || ""}
              onChange={(e) =>
                handleInputChange("surface", e.target.value || undefined)
              }
              options={[
                { value: "", label: "Not specified" },
                ...RUN_SURFACE_OPTIONS,
              ]}
              icon={<Mountain className="w-5 h-5" />}
            />

            <Select
              label="Effort"
              value={formData.effort || ""}
              onChange={(e) =>
                handleInputChange("effort", e.target.value || undefined)
              }
              options={[
                { value: "", label: "Not specified" },
                ...RUN_EFFORT_OPTIONS,
              ]}
              icon={<Flame className="w-5 h-5" />}
            />
          </FormGrid>

          <FormGrid cols={2}>
            <Input
              label="Location"
              value={formData.location || ""}
              onChange={(e) =>
                handleInputChange("location", e.target.value || undefined)
              }
              placeholder="Central Park, Manhattan"
              icon={<Navigation className="w-5 h-5" />}
              helperText="Where did you run?"
            />

            <Input
              label="Route"
              value={formData.route || ""}
              onChange={(e) =>
                handleInputChange("route", e.target.value || undefined)
              }
              placeholder="Loop around the park"
              icon={<RouteIcon className="w-5 h-5" />}
              helperText="Describe your route"
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Weather & Conditions"
          description="What were the conditions like?"
        >
          <FormGrid cols={2}>
            <Input
              label="Weather"
              value={formData.weather || ""}
              onChange={(e) =>
                handleInputChange("weather", e.target.value || undefined)
              }
              placeholder="Sunny, cloudy, rainy..."
              icon={<Thermometer className="w-5 h-5" />}
            />

            <Input
              label="Temperature (°F)"
              type="number"
              value={formData.temperature || ""}
              onChange={(e) =>
                handleInputChange(
                  "temperature",
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              error={errors.temperature}
              placeholder="72"
              icon={<Thermometer className="w-5 h-5" />}
            />
          </FormGrid>

          <FormGrid cols={3}>
            <Input
              label="Humidity (%)"
              type="number"
              min="0"
              max="100"
              value={formData.humidity || ""}
              onChange={(e) =>
                handleInputChange(
                  "humidity",
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              error={errors.humidity}
              placeholder="65"
            />

            <Input
              label="Elevation (ft)"
              type="number"
              value={formData.elevation || ""}
              onChange={(e) =>
                handleInputChange(
                  "elevation",
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              error={errors.elevation}
              placeholder="500"
              icon={<Mountain className="w-5 h-5" />}
            />

            <Input
              label="Avg Heart Rate"
              type="number"
              min="50"
              max="220"
              value={formData.heartRate || ""}
              onChange={(e) =>
                handleInputChange(
                  "heartRate",
                  e.target.value ? parseInt(e.target.value) : undefined,
                )
              }
              error={errors.heartRate}
              placeholder="145"
              icon={<Heart className="w-5 h-5" />}
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Notes"
          description="How did the run feel? Any observations?"
        >
          <Textarea
            label="Run Notes"
            value={formData.notes || ""}
            onChange={(e) =>
              handleInputChange("notes", e.target.value || undefined)
            }
            placeholder="Felt great today! Good pace, legs felt fresh..."
            helperText="Optional - Share how the run went"
          />
        </FormSection>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 pt-6"
        >
          <FormBackButton
            onCancel={handleCancel}
            disabled={createRunMutation.isPending}
          />
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
      </form>
    </div>
  );
}
