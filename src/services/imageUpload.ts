import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

// Types for image upload operations
export interface ImageUploadResult {
  storageId: string;
  url: string;
  success: boolean;
}

export interface ImageUploadError {
  message: string;
  code?: string;
  details?: any;
}

export interface ImageUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// Default configuration
const DEFAULT_OPTIONS: Required<ImageUploadOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1920,
};

// Image validation utilities
export function validateImageFile(
  file: File,
  options: ImageUploadOptions = {},
): string | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file size
  if (file.size > opts.maxSize) {
    return `File size must be less than ${Math.round(opts.maxSize / (1024 * 1024))}MB`;
  }

  // Check file type
  if (!opts.allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed types: ${opts.allowedTypes.join(", ")}`;
  }

  // Check file extension
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  const validExtensions = opts.allowedTypes.map((type) =>
    type.replace("image/", ".").replace("jpeg", "jpg"),
  );

  if (!validExtensions.some((ext) => extension === ext)) {
    return `Invalid file extension. Allowed extensions: ${validExtensions.join(", ")}`;
  }

  return null;
}

// Image processing utilities
export async function processImage(
  file: File,
  options: ImageUploadOptions = {},
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > opts.maxWidth) {
          width = opts.maxWidth;
          height = width / aspectRatio;
        }

        if (height > opts.maxHeight) {
          height = opts.maxHeight;
          width = height * aspectRatio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to process image"));
              return;
            }

            // Create new file with processed image
            const processedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(processedFile);
          },
          file.type,
          opts.quality,
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

// Custom hook for image upload operations
export function useImageUploadService() {
  const queryClient = useQueryClient();
  const generateUploadUrl = useConvexMutation(api.shoes.generateUploadUrl);
  const validateUpload = useConvexMutation(api.shoes.validateImageUpload);

  const uploadImageMutation = useMutation({
    mutationFn: async ({
      file,
      options = {},
    }: {
      file: File;
      options?: ImageUploadOptions;
    }): Promise<ImageUploadResult> => {
      // Validate file
      const validationError = validateImageFile(file, options);
      if (validationError) {
        throw new Error(validationError);
      }

      // Process image if needed
      const processedFile = await processImage(file, options);

      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const formData = new FormData();
      formData.append("file", processedFile);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const storageId = result.storageId;

      if (!storageId) {
        throw new Error("No storage ID returned from upload");
      }

      // Validate the upload
      const validation = await validateUpload({ storageId });
      if (!validation.valid) {
        throw new Error("Upload validation failed");
      }

      // Generate the image URL
      const url = `${import.meta.env.VITE_CONVEX_URL}/api/storage/${storageId}`;

      return {
        storageId,
        url,
        success: true,
      };
    },
    onSuccess: () => {
      toast.success("Image uploaded successfully!");
    },
    onError: (error: any) => {
      console.error("Image upload error:", error);
      toast.error(error.message || "Failed to upload image");
    },
  });

  return {
    uploadImage: uploadImageMutation.mutateAsync,
    isUploading: uploadImageMutation.isPending,
    error: uploadImageMutation.error,
    reset: uploadImageMutation.reset,
  };
}

// Hook for updating shoe images
export function useShoeImageUpdate() {
  const queryClient = useQueryClient();
  const updateShoeImage = useConvexMutation(api.shoes.updateShoeImage);
  const deleteShoeImage = useConvexMutation(api.shoes.deleteShoeImage);

  const updateImageMutation = useMutation({
    mutationFn: async ({
      shoeId,
      storageId,
    }: {
      shoeId: string;
      storageId: string;
    }) => {
      return await updateShoeImage({
        shoeId,
        storageId: storageId as Id<"_storage">,
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.shoes.getShoe, { id: variables.shoeId }),
      });
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.shoes.getShoeWithStats, {
          id: variables.shoeId,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.shoes.getShoes, {}),
      });

      toast.success("Shoe image updated successfully!");
    },
    onError: (error: any) => {
      console.error("Shoe image update error:", error);
      toast.error(error.message || "Failed to update shoe image");
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async ({ shoeId }: { shoeId: string }) => {
      return await deleteShoeImage({ shoeId });
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.shoes.getShoe, { id: variables.shoeId }),
      });
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.shoes.getShoeWithStats, {
          id: variables.shoeId,
        }),
      });
      queryClient.invalidateQueries({
        queryKey: convexQuery(api.shoes.getShoes, {}),
      });

      toast.success("Shoe image removed successfully!");
    },
    onError: (error: any) => {
      console.error("Shoe image delete error:", error);
      toast.error(error.message || "Failed to remove shoe image");
    },
  });

  return {
    updateImage: updateImageMutation.mutateAsync,
    deleteImage: deleteImageMutation.mutateAsync,
    isUpdating: updateImageMutation.isPending,
    isDeleting: deleteImageMutation.isPending,
    updateError: updateImageMutation.error,
    deleteError: deleteImageMutation.error,
  };
}

// Hook for batch image operations
export function useBatchImageOperations() {
  const imageUpload = useImageUploadService();
  const shoeImageUpdate = useShoeImageUpdate();

  const uploadAndUpdateShoeMutation = useMutation({
    mutationFn: async ({
      file,
      shoeId,
      options = {},
    }: {
      file: File;
      shoeId: string;
      options?: ImageUploadOptions;
    }) => {
      // First upload the image
      const uploadResult = await imageUpload.uploadImage({ file, options });

      // Then update the shoe with the new image
      await shoeImageUpdate.updateImage({
        shoeId,
        storageId: uploadResult.storageId,
      });

      return uploadResult;
    },
    onError: (error: any) => {
      console.error("Batch image operation error:", error);
      toast.error(error.message || "Failed to upload and update image");
    },
  });

  return {
    uploadAndUpdate: uploadAndUpdateShoeMutation.mutateAsync,
    isProcessing: uploadAndUpdateShoeMutation.isPending,
    error: uploadAndUpdateShoeMutation.error,
  };
}

// Utility function to get image URL from storage ID
export function getImageUrl(
  storageId: string | null | undefined,
): string | null {
  if (!storageId) return null;
  return `${import.meta.env.VITE_CONVEX_URL}/api/storage/${storageId}`;
}

// Utility function to extract storage ID from URL
export function getStorageIdFromUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/storage\/(.+)$/);
  return match ? match[1] : null;
}

// Error handling utilities
export function isImageUploadError(error: unknown): error is ImageUploadError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  );
}

export function formatImageUploadError(error: unknown): string {
  if (isImageUploadError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred during image upload";
}

// Progress tracking utilities
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function createProgressTracker(
  onProgress: (progress: UploadProgress) => void,
): (event: ProgressEvent) => void {
  return (event: ProgressEvent) => {
    if (event.lengthComputable) {
      const progress: UploadProgress = {
        loaded: event.loaded,
        total: event.total,
        percentage: Math.round((event.loaded / event.total) * 100),
      };
      onProgress(progress);
    }
  };
}

// Image optimization presets
export const IMAGE_PRESETS = {
  thumbnail: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.8,
  },
  medium: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.85,
  },
  large: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.9,
  },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;

// Helper to get preset options
export function getImagePresetOptions(preset: ImagePreset): ImageUploadOptions {
  return IMAGE_PRESETS[preset];
}
