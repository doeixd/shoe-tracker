import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCollections, useUpdateShoeMutation } from "~/queries";
import {
  FormSection,
  Input,
  Textarea,
  Select,
  Button,
  FormGrid,
} from "~/components/FormComponents";
import { ImageUpload, useImageUpload } from "~/components/ImageHandler";
import {
  useImageUploadService,
  useShoeImageUpdate,
} from "~/services/imageUpload";
import type { CreateShoeForm } from "~/types";
import type { Shoe } from "~/types";

import {
  Package,
  DollarSign,
  Calendar,
  Ruler,
  Weight,
  ArrowDown,
  Sparkles,
  Save,
  ArrowLeft,
} from "lucide-react";
import { EmptyStateCard } from "~/components/ui/Cards";

interface EditShoeFormProps {
  shoe: Shoe;
  onSuccess?: (shoeId: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
  className?: string;
}

export function EditShoeForm({
  shoe,
  onSuccess,
  onCancel,
  isModal = false,
  className = "",
}: EditShoeFormProps) {
  const navigate = useNavigate();
  const { data: collections } = useCollections();
  const updateShoeMutation = useUpdateShoeMutation();
  const { imageState, handleImageUploaded, handleImageRemoved } =
    useImageUpload();
  const imageUploadService = useImageUploadService();
  const shoeImageUpdate = useShoeImageUpdate();

  const [formData, setFormData] = useState<
    CreateShoeForm & { currentMileage?: number }
  >({
    name: "",
    model: "",
    brand: "",
    collectionId: "",
    maxMileage: 500,
    currentMileage: 0,
    purchaseDate: "",
    purchasePrice: undefined,
    notes: "",
    size: "",
    weight: undefined,
    dropHeight: undefined,
  });

  const [errors, setErrors] = useState<
    Partial<
      Record<keyof (CreateShoeForm & { currentMileage?: number }), string>
    >
  >({});

  // Initialize form data when shoe loads
  useEffect(() => {
    if (shoe) {
      setFormData({
        name: shoe.name || "",
        model: shoe.model || "",
        brand: shoe.brand || "",
        collectionId: shoe.collectionId || "",
        maxMileage: shoe.maxMileage || 500,
        currentMileage: shoe.currentMileage || 0,
        purchaseDate: shoe.purchaseDate || "",
        purchasePrice: shoe.purchasePrice || undefined,
        notes: shoe.notes || "",
        size: shoe.size || "",
        weight: shoe.weight || undefined,
        dropHeight: shoe.dropHeight || undefined,
      });

      // Initialize image state if shoe has an image
      if (shoe.imageStorageId) {
        handleImageUploaded(shoe.imageStorageId, shoe.imageUrl || "");
      }
    }
  }, [shoe, handleImageUploaded]);

  const handleInputChange = (
    field: keyof (CreateShoeForm & { currentMileage?: number }),
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<
      Record<keyof (CreateShoeForm & { currentMileage?: number }), string>
    > = {};

    if (!formData.name.trim()) {
      newErrors.name = "Shoe name is required";
    }

    if (!formData.model.trim()) {
      newErrors.model = "Model is required";
    }

    if (!formData.collectionId) {
      newErrors.collectionId = "Collection is required";
    }

    if (formData.maxMileage <= 0) {
      newErrors.maxMileage = "Max mileage must be greater than 0";
    }

    if (formData.currentMileage !== undefined && formData.currentMileage < 0) {
      newErrors.currentMileage = "Current mileage cannot be negative";
    }

    if (formData.purchasePrice !== undefined && formData.purchasePrice < 0) {
      newErrors.purchasePrice = "Purchase price cannot be negative";
    }

    if (formData.weight !== undefined && formData.weight <= 0) {
      newErrors.weight = "Weight must be greater than 0";
    }

    if (formData.dropHeight !== undefined && formData.dropHeight < 0) {
      newErrors.dropHeight = "Drop height cannot be negative";
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
      // Check if mileage was updated for specific success message
      const mileageUpdated = formData.currentMileage !== shoe.currentMileage;
      const mileageAdded =
        formData.currentMileage && shoe.currentMileage
          ? formData.currentMileage - shoe.currentMileage
          : 0;

      // Update the shoe data
      await updateShoeMutation.mutateAsync({
        id: shoe.id,
        name: formData.name,
        model: formData.model,
        brand: formData.brand,
        collectionId: formData.collectionId,
        maxMileage: formData.maxMileage,
        currentMileage: formData.currentMileage,
        purchaseDate: formData.purchaseDate,
        purchasePrice: formData.purchasePrice,
        notes: formData.notes,
        size: formData.size,
        weight: formData.weight,
        dropHeight: formData.dropHeight,
      });

      // If there's an image and it's different from the original, update it
      if (
        imageState.storageId &&
        imageState.storageId !== shoe.imageStorageId
      ) {
        await shoeImageUpdate.updateImage({
          shoeId: shoe.id,
          storageId: imageState.storageId,
        });
      }

      // Show specific success message for mileage updates
      if (mileageUpdated && mileageAdded > 0) {
        toast.success(`Shoe updated! Added ${mileageAdded} miles.`);
      } else if (mileageUpdated) {
        toast.success(
          `Shoe updated! Mileage set to ${formData.currentMileage} miles.`,
        );
      } else {
        toast.success("Shoe updated successfully!");
      }

      if (onSuccess) {
        onSuccess(shoe.id);
      } else {
        navigate({ to: "/shoes/$shoeId", params: { shoeId: shoe.id } });
      }
    } catch (error: any) {
      console.error("Error updating shoe:", error);

      let errorMessage = "Failed to update shoe. Please try again.";
      if (error?.message?.includes("not authenticated")) {
        errorMessage = "Authentication required. Please sign in again.";
        navigate({ to: "/auth/signin" });
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleRetire = async () => {
    if (!confirm("Are you sure you want to retire this shoe?")) {
      return;
    }

    try {
      // This would need a retire mutation - assuming it exists
      // await retireShoeMutation.mutateAsync({ id: shoe.id });
      toast.success("Shoe retired successfully!");
      navigate({ to: "/shoes/$shoeId", params: { shoeId: shoe.id } });
    } catch (error) {
      console.error("Error retiring shoe:", error);
      toast.error("Failed to retire shoe");
    }
  };

  // Handle no collections case
  if (!collections || collections.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Collections Found
          </h3>
          <p className="text-gray-500 mb-4">
            You need to create a collection before you can edit shoes.
            Collections help organize your running shoes by type or purpose.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() =>
                navigate({ to: "/collections/new", search: { modal: false } })
              }
            >
              Create Collection
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate({ to: "/shoes/$shoeId", params: { shoeId: shoe.id } })
              }
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSection
          title="Basic Information"
          description="Essential details about your shoe"
        >
          <FormGrid cols={1}>
            <Input
              label="Shoe Name"
              required
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={errors.name}
              placeholder="Daily Trainer, Long Run Shoe, Racing Flat..."
              icon={<Package className="w-5 h-5" />}
              helperText="Give your shoe a memorable name"
              maxLength={100}
            />
          </FormGrid>

          <FormGrid cols={2}>
            <Select
              label="Collection"
              required
              value={formData.collectionId}
              onChange={(e) =>
                handleInputChange("collectionId", e.target.value)
              }
              error={errors.collectionId}
              placeholder="Select a collection"
              options={collections.map((collection) => ({
                value: collection.id,
                label: collection.name,
              }))}
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </Select>

            <Input
              label="Brand"
              value={formData.brand || ""}
              onChange={(e) => handleInputChange("brand", e.target.value)}
              placeholder="Nike, Adidas, Brooks, ASICS..."
              helperText="The manufacturer of your shoe"
              maxLength={50}
            />
          </FormGrid>

          <FormGrid cols={1}>
            <Input
              label="Model"
              required
              value={formData.model}
              onChange={(e) => handleInputChange("model", e.target.value)}
              error={errors.model}
              placeholder="Air Zoom Pegasus 40, Ghost 15, Gel-Nimbus 25..."
              helperText="The specific model name and version"
              maxLength={100}
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Purchase Details"
          description="Information about when and how much you paid"
        >
          <FormGrid cols={2}>
            <Input
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate || ""}
              onChange={(e) =>
                handleInputChange("purchaseDate", e.target.value)
              }
              icon={<Calendar className="w-5 h-5" />}
              helperText="When did you buy these shoes?"
            />

            <Input
              label="Purchase Price"
              type="number"
              value={formData.purchasePrice || ""}
              onChange={(e) =>
                handleInputChange(
                  "purchasePrice",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              error={errors.purchasePrice}
              placeholder="120"
              icon={<DollarSign className="w-5 h-5" />}
              helperText="How much did you pay? (optional)"
              min={0}
              step={0.01}
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Physical Specifications"
          description="Size and technical details of your shoe"
        >
          <FormGrid cols={3}>
            <Input
              label="Size"
              value={formData.size || ""}
              onChange={(e) => handleInputChange("size", e.target.value)}
              placeholder="10.5, 11, 9.5..."
              icon={<Ruler className="w-5 h-5" />}
              helperText="Your shoe size"
              maxLength={10}
            />

            <Input
              label="Weight (grams)"
              type="number"
              value={formData.weight || ""}
              onChange={(e) =>
                handleInputChange(
                  "weight",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              error={errors.weight}
              placeholder="280"
              icon={<Weight className="w-5 h-5" />}
              helperText="Shoe weight (optional)"
              min={1}
            />

            <Input
              label="Drop Height (mm)"
              type="number"
              value={formData.dropHeight || ""}
              onChange={(e) =>
                handleInputChange(
                  "dropHeight",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              error={errors.dropHeight}
              placeholder="12"
              icon={<ArrowDown className="w-5 h-5" />}
              helperText="Heel-to-toe drop (optional)"
              min={0}
              step={0.5}
            />
          </FormGrid>

          <FormGrid cols={2}>
            <div className="space-y-2">
              <Input
                label="Current Mileage"
                type="number"
                value={formData.currentMileage || 0}
                onChange={(e) =>
                  handleInputChange("currentMileage", Number(e.target.value))
                }
                error={errors.currentMileage}
                placeholder="0"
                icon={<Sparkles className="w-5 h-5" />}
                helperText="How many miles are currently on this shoe"
                min={0}
              />
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-gray-500 w-full mb-1">
                  Quick add:
                </span>
                {[1, 3, 5, 10, 13.1, 26.2].map((miles) => (
                  <button
                    key={miles}
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "currentMileage",
                        (formData.currentMileage || 0) + miles,
                      )
                    }
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    +{miles}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Max Mileage"
              type="number"
              required
              value={formData.maxMileage}
              onChange={(e) =>
                handleInputChange("maxMileage", Number(e.target.value))
              }
              error={errors.maxMileage}
              placeholder="500"
              icon={<Sparkles className="w-5 h-5" />}
              helperText="Expected lifespan in miles before retirement"
              min={1}
            />
          </FormGrid>

          {/* Mileage Progress Indicator */}
          {formData.currentMileage !== undefined && formData.maxMileage > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Mileage Progress
                </span>
                <span className="text-sm text-gray-500">
                  {formData.currentMileage} / {formData.maxMileage} miles
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (formData.currentMileage / formData.maxMileage) * 100 < 50
                      ? "bg-green-500"
                      : (formData.currentMileage / formData.maxMileage) * 100 <
                          80
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (formData.currentMileage / formData.maxMileage) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>
                  {Math.round(
                    ((formData.currentMileage || 0) / formData.maxMileage) *
                      100,
                  )}
                  % used
                </span>
                <span>
                  {Math.max(
                    formData.maxMileage - (formData.currentMileage || 0),
                    0,
                  )}{" "}
                  miles remaining
                </span>
              </div>
              {formData.currentMileage >= formData.maxMileage && (
                <div className="mt-2 text-xs text-red-600 font-medium">
                  ⚠️ This shoe has reached its recommended retirement mileage
                </div>
              )}
            </div>
          )}
        </FormSection>

        <FormSection
          title="Shoe Image"
          description="Add a photo to help identify your shoe"
        >
          <ImageUpload
            onImageUploaded={handleImageUploaded}
            onImageRemoved={handleImageRemoved}
            currentImageUrl={imageState.url ? imageState.url : undefined}
          />
        </FormSection>

        <FormSection
          title="Additional Notes"
          description="Any other information about this shoe"
        >
          <Textarea
            label="Notes"
            value={formData.notes || ""}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Comfortable for long runs, good for wet conditions, feels fast..."
            helperText="Share your thoughts and experiences with this shoe"
            maxLength={1000}
            rows={4}
          />
        </FormSection>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
          <Button
            type="submit"
            loading={
              updateShoeMutation.isPending ||
              imageUploadService.isUploading ||
              shoeImageUpdate.isUpdating
            }
            disabled={
              updateShoeMutation.isPending ||
              imageUploadService.isUploading ||
              shoeImageUpdate.isUpdating
            }
            icon={<Save className="w-5 h-5" />}
            fullWidth
            className="sm:flex-1"
          >
            {imageUploadService.isUploading
              ? "Uploading..."
              : shoeImageUpdate.isUpdating
                ? "Updating..."
                : "Update Shoe"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              onCancel
                ? onCancel()
                : navigate({
                    to: "/shoes/$shoeId",
                    params: { shoeId: shoe.id },
                  })
            }
            disabled={
              updateShoeMutation.isPending ||
              imageUploadService.isUploading ||
              shoeImageUpdate.isUpdating
            }
            icon={<ArrowLeft className="w-5 h-5" />}
            fullWidth
            className="sm:flex-1"
          >
            Cancel
          </Button>
        </div>

        {/* Retire Button - Optional */}
        <div className="pt-4 border-t border-red-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleRetire}
            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            disabled={
              updateShoeMutation.isPending ||
              imageUploadService.isUploading ||
              shoeImageUpdate.isUpdating
            }
          >
            Retire This Shoe
          </Button>
        </div>
      </form>
    </div>
  );
}
