import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useUpdateCollectionMutation } from "~/queries";
import {
  Input,
  Textarea,
  Button,
  FormSection,
} from "~/components/FormComponents";
import type { CreateCollectionForm, Collection } from "~/types";
import { motion } from "motion/react";
import { Save, Package, Palette } from "lucide-react";
import { FormBackButton } from "~/components/ui/BackButton";
import {
  COLLECTION_ICON_OPTIONS,
  DEFAULT_COLLECTION_ICON,
  getCollectionIcon,
} from "~/lib/collectionIcons";

interface EditCollectionFormProps {
  collection: Collection;
  onSuccess?: (collectionId: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
  className?: string;
}

export function EditCollectionForm({
  collection,
  onSuccess,
  onCancel,
  isModal = false,
  className = "",
}: EditCollectionFormProps) {
  const navigate = useNavigate();
  const updateCollectionMutation = useUpdateCollectionMutation();

  const [formData, setFormData] = useState<CreateCollectionForm>({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: DEFAULT_COLLECTION_ICON,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateCollectionForm, string>>
  >({});

  // Initialize form data when collection loads
  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name || "",
        description: collection.description || "",
        color: collection.color || "#3b82f6",
        icon: collection.icon || DEFAULT_COLLECTION_ICON,
      });
    }
  }, [collection]);

  const handleInputChange = (
    field: keyof CreateCollectionForm,
    value: string | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateCollectionForm, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Collection name is required";
    }

    if (formData.name.length > 100) {
      newErrors.name = "Collection name must be 100 characters or less";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
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
      const payload = {
        id: collection.id,
        ...formData,
        description: formData.description?.trim() || undefined,
      };

      try {
        await updateCollectionMutation.mutateAsync(payload);
      } catch (error: any) {
        if (
          payload.icon &&
          (error?.message?.includes("Server Error") ||
            error?.message?.includes("validation") ||
            error?.message?.includes("Called by client"))
        ) {
          const { icon: _icon, ...legacyPayload } = payload;
          await updateCollectionMutation.mutateAsync(legacyPayload);
        } else {
          throw error;
        }
      }

      toast.success("Collection updated successfully!");

      if (onSuccess) {
        onSuccess(collection.id);
      } else {
        navigate({
          to: "/collections/$collectionId",
          params: { collectionId: collection.id },
        });
      }
    } catch (error: any) {
      console.error("Error updating collection:", error);

      let errorMessage = "Failed to update collection. Please try again.";
      if (error?.message?.includes("not authenticated")) {
        errorMessage = "Authentication required. Please sign in again.";
        navigate({ to: "/auth/signin" });
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const colorOptions = [
    { value: "#3b82f6", label: "Blue", color: "#3b82f6" },
    { value: "#10b981", label: "Green", color: "#10b981" },
    { value: "#f59e0b", label: "Amber", color: "#f59e0b" },
    { value: "#ef4444", label: "Red", color: "#ef4444" },
    { value: "#8b5cf6", label: "Purple", color: "#8b5cf6" },
    { value: "#06b6d4", label: "Cyan", color: "#06b6d4" },
    { value: "#84cc16", label: "Lime", color: "#84cc16" },
    { value: "#f97316", label: "Orange", color: "#f97316" },
    { value: "#ec4899", label: "Pink", color: "#ec4899" },
    { value: "#6b7280", label: "Gray", color: "#6b7280" },
  ];

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection
          title="Collection Details"
          description="Update your collection name and description"
        >
          <Input
            label="Collection Name"
            required
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            error={errors.name}
            placeholder="Daily Trainers, Racing Shoes, Trail Runners..."
            icon={<Package className="w-5 h-5" />}
            helperText="Give your collection a descriptive name"
            maxLength={100}
          />

          <Textarea
            label="Description"
            value={formData.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe the purpose or characteristics of this collection..."
            helperText="Optional - helps you remember what this collection is for"
            maxLength={500}
          />
        </FormSection>

        <FormSection
          title="Collection Color"
          description="Choose a color to help identify this collection"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Selected Color
              </span>
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200"
                style={{ backgroundColor: formData.color }}
              />
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange("color", option.value)}
                  className={`relative w-full aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    formData.color === option.value
                      ? "border-gray-900 scale-110 shadow-lg ring-2 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: option.color }}
                  title={option.label}
                >
                  {formData.color === option.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white/90 shadow-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Collection Icon"
          description="Choose an icon for quick recognition"
        >
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {COLLECTION_ICON_OPTIONS.map((option) => {
              const Icon = getCollectionIcon(option.key);
              const isActive = (formData.icon || DEFAULT_COLLECTION_ICON) === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleInputChange("icon", option.key)}
                  className={`flex items-center justify-center w-full aspect-square rounded-xl border transition-all duration-150 ${
                    isActive
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                  title={option.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </FormSection>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 pt-6"
        >
          <FormBackButton
            onCancel={() => {
              if (onCancel) {
                onCancel();
              } else {
                navigate({
                  to: "/collections/$collectionId",
                  params: { collectionId: collection.id },
                });
              }
            }}
            disabled={updateCollectionMutation.isPending}
          />
          <Button
            type="submit"
            loading={updateCollectionMutation.isPending}
            disabled={updateCollectionMutation.isPending}
            icon={<Save className="w-5 h-5" />}
            fullWidth
            className="sm:flex-1"
          >
            Update Collection
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
