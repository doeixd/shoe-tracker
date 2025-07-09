import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCollections, useCreateShoeMutation } from "~/queries";
import {
  FormSection,
  Input,
  Textarea,
  Select,
  Button,
  FormGrid,
} from "~/components/FormComponents";
import { ImageUpload, useImageUpload } from "~/components/ImageHandler";
import { useImageUploadService } from "~/services/imageUpload";
import type { CreateShoeForm } from "~/types";

import {
  Plus,
  Package,
  DollarSign,
  Calendar,
  Ruler,
  Weight,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { EmptyStateCard } from "~/components/ui/Cards";
import { FormBackButton } from "~/components/ui/BackButton";

interface ShoeFormProps {
  onSuccess?: (shoeId: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
  className?: string;
}

export function ShoeForm({
  onSuccess,
  onCancel,
  isModal = false,
  className = "",
}: ShoeFormProps) {
  const navigate = useNavigate();
  const { data: collections } = useCollections();
  const createShoeMutation = useCreateShoeMutation();
  const { imageState, handleImageUploaded, handleImageRemoved } =
    useImageUpload();
  const imageUploadService = useImageUploadService();

  const [formData, setFormData] = useState<CreateShoeForm>({
    name: "",
    model: "",
    brand: "",
    collectionId: "",
    maxMileage: 500,
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: undefined,
    notes: "",
    size: "",
    weight: undefined,
    dropHeight: undefined,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateShoeForm, string>>
  >({});

  // Update form with default collection when collections load
  useEffect(() => {
    if (collections && collections.length > 0 && !formData.collectionId) {
      setFormData((prev) => ({
        ...prev,
        collectionId: collections[0].id,
      }));
    }
  }, [collections, formData.collectionId]);

  const handleInputChange = (
    field: keyof CreateShoeForm,
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const result = await imageUploadService.uploadImage({ file });
      handleImageUploaded(result.storageId, result.url);
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Failed to upload image");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateShoeForm, string>> = {};

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
      // Create the shoe first
      const shoeId = await createShoeMutation.mutateAsync(formData);

      // If there's an image, update the shoe with it
      if (imageState.storageId) {
        try {
          await fetch(`/api/shoes/${shoeId}/image`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              storageId: imageState.storageId,
            }),
          });
        } catch (imageError) {
          console.warn("Failed to attach image to shoe:", imageError);
          toast.error("Shoe created but image upload failed");
        }
      }

      toast.success("Shoe added successfully!");

      if (onSuccess) {
        onSuccess(shoeId);
      } else {
        navigate({ to: "/shoes/$shoeId", params: { shoeId } });
      }
    } catch (error: any) {
      console.error("Error creating shoe:", error);

      let errorMessage = "Failed to add shoe. Please try again.";
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
        to: "/shoes",
        search: {
          showRetired: true,
          collection: "",
          sortBy: "name" as const,
          modal: false,
          brand: "",
          usageLevel: "",
          dateRange: "all" as const,
        },
      });
    }
  };

  if (!collections || collections.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md mx-auto">
          <EmptyStateCard
            title="No Collections Found"
            description="You need to create a collection before adding shoes. Collections help organize your running shoes by type or purpose."
            icon={<Package className="w-8 h-8 text-gray-400" />}
            actionLabel="Create Collection"
            onAction={() =>
              navigate({ to: "/collections/new", search: { modal: false } })
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
          description="Give your shoe a name and choose its collection"
        >
          <FormGrid cols={2}>
            <Input
              label="Shoe Name"
              required
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={errors.name}
              placeholder="Daily Trainer, Racing Shoe..."
              icon={<Sparkles className="w-5 h-5" />}
              helperText="Give your shoe a memorable nickname"
            />

            <Select
              label="Collection"
              required
              value={formData.collectionId}
              onChange={(e) =>
                handleInputChange("collectionId", e.target.value)
              }
              error={errors.collectionId}
              options={collections.map((collection) => ({
                value: collection.id,
                label: collection.name,
              }))}
              helperText="Which collection does this shoe belong to?"
            />
          </FormGrid>

          <FormGrid cols={2}>
            <Input
              label="Brand"
              value={formData.brand || ""}
              onChange={(e) =>
                handleInputChange("brand", e.target.value || undefined)
              }
              placeholder="Nike, Adidas, Brooks, Hoka..."
              icon={<Package className="w-5 h-5" />}
            />

            <Input
              label="Model"
              required
              value={formData.model}
              onChange={(e) => handleInputChange("model", e.target.value)}
              error={errors.model}
              placeholder="Air Zoom Pegasus 40, Clifton 9..."
              helperText="The specific model name"
            />
          </FormGrid>

          <div className="pt-2">
            <ImageUpload
              label="Shoe Photo"
              onImageUploaded={handleImageUploaded}
              onImageRemoved={handleImageRemoved}
              currentImageUrl={imageState.url || undefined}
              disabled={
                createShoeMutation.isPending || imageUploadService.isUploading
              }
            />
          </div>
        </FormSection>

        <FormSection
          title="Purchase Details"
          description="When did you get these shoes and how much did they cost?"
        >
          <FormGrid cols={2}>
            <Input
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate || ""}
              onChange={(e) =>
                handleInputChange("purchaseDate", e.target.value || undefined)
              }
              icon={<Calendar className="w-5 h-5" />}
              helperText="When did you buy these shoes?"
            />

            <Input
              label="Purchase Price"
              type="number"
              step="0.01"
              value={formData.purchasePrice || ""}
              onChange={(e) =>
                handleInputChange(
                  "purchasePrice",
                  e.target.value ? parseFloat(e.target.value) : undefined,
                )
              }
              error={errors.purchasePrice}
              placeholder="120.00"
              icon={<DollarSign className="w-5 h-5" />}
              helperText="Optional - helps track your investment"
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Shoe Specifications"
          description="Technical details and sizing information"
        >
          <FormGrid cols={3}>
            <Input
              label="Size"
              value={formData.size || ""}
              onChange={(e) =>
                handleInputChange("size", e.target.value || undefined)
              }
              placeholder="10.5, 42 EU, 9 UK..."
              icon={<Ruler className="w-5 h-5" />}
            />

            <Input
              label="Weight (grams)"
              type="number"
              value={formData.weight || ""}
              onChange={(e) =>
                handleInputChange(
                  "weight",
                  e.target.value ? parseInt(e.target.value) : undefined,
                )
              }
              error={errors.weight}
              placeholder="280"
              icon={<Weight className="w-5 h-5" />}
              helperText="Usually 200-400g"
            />

            <Input
              label="Heel Drop (mm)"
              type="number"
              value={formData.dropHeight || ""}
              onChange={(e) =>
                handleInputChange(
                  "dropHeight",
                  e.target.value ? parseInt(e.target.value) : undefined,
                )
              }
              error={errors.dropHeight}
              placeholder="10"
              icon={<ArrowDown className="w-5 h-5" />}
              helperText="Heel-to-toe offset"
            />
          </FormGrid>

          <Input
            label="Maximum Mileage"
            type="number"
            required
            value={formData.maxMileage}
            onChange={(e) =>
              handleInputChange("maxMileage", parseInt(e.target.value))
            }
            error={errors.maxMileage}
            placeholder="500"
            helperText="Expected lifespan in miles - helps track when to replace"
          />
        </FormSection>

        <FormSection
          title="Additional Notes"
          description="Anything special about these shoes?"
        >
          <Textarea
            label="Notes"
            value={formData.notes || ""}
            onChange={(e) =>
              handleInputChange("notes", e.target.value || undefined)
            }
            placeholder="Perfect for long runs, great for trails, bought for marathon training..."
            helperText="Optional - Share what makes these shoes special"
          />
        </FormSection>

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <FormBackButton
            onCancel={handleCancel}
            disabled={
              createShoeMutation.isPending || imageUploadService.isUploading
            }
          />
          <Button
            type="submit"
            loading={
              createShoeMutation.isPending || imageUploadService.isUploading
            }
            disabled={
              createShoeMutation.isPending || imageUploadService.isUploading
            }
            icon={<Plus className="w-5 h-5" />}
            fullWidth
            className="sm:flex-1"
          >
            {imageUploadService.isUploading ? "Uploading..." : "Add Shoe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
