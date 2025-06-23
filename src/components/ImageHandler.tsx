import React, { useState, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useFirstVisit, getAnimationProps } from "~/hooks/useFirstVisit";
import { cn } from "./ui/ui";
import {
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  Loader2,
  Camera,
  RefreshCw,
  Plus,
  Check,
} from "lucide-react";

// Image validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

interface ImageUploadProps {
  onImageUploaded: (storageId: string, url?: string) => void;
  onImageRemoved?: () => void;
  currentImageUrl?: string;
  currentStorageId?: string;
  maxSize?: number;
  allowedTypes?: string[];
  className?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export function ImageUpload({
  onImageUploaded,
  onImageRemoved,
  currentImageUrl,
  currentStorageId,
  maxSize = MAX_FILE_SIZE,
  allowedTypes = ALLOWED_TYPES,
  className,
  disabled = false,
  required = false,
  label,
  error,
}: ImageUploadProps) {
  const { isFirstVisit } = useFirstVisit();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generateUploadUrl = useConvexMutation(api.shoes.generateUploadUrl);
  const updateShoeImage = useConvexMutation(api.shoes.updateShoeImage);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`;
    }

    // Check file extension
    const extension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }

    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setUploadState({
          isUploading: false,
          progress: 0,
          error: validationError,
        });
        toast.error(validationError);
        return;
      }

      setUploadState({ isUploading: true, progress: 0, error: null });

      try {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl();

        // Create preview URL
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        // Upload file with progress tracking
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadState((prev) => ({ ...prev, progress }));
          }
        });

        const uploadPromise = new Promise<string>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response.storageId);
              } catch (e) {
                reject(new Error("Invalid response from upload"));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.ontimeout = () => reject(new Error("Upload timeout"));

          xhr.open("POST", uploadUrl);
          xhr.timeout = 60000; // 60 second timeout

          const formData = new FormData();
          formData.append("file", file);
          xhr.send(formData);
        });

        const storageId = await uploadPromise;

        setUploadState({ isUploading: false, progress: 100, error: null });
        onImageUploaded(storageId, preview);
        toast.success("Image uploaded successfully!");
      } catch (error: any) {
        console.error("Upload error:", error);
        setUploadState({
          isUploading: false,
          progress: 0,
          error: error.message || "Upload failed",
        });
        toast.error(error.message || "Failed to upload image");

        // Clean up preview URL on error
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      }
    },
    [generateUploadUrl, onImageUploaded, previewUrl, maxSize, allowedTypes],
  );

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onImageRemoved?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setUploadState({ isUploading: false, progress: 0, error: null });
  };

  const triggerFileSelect = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayUrl = previewUrl || currentImageUrl;
  const hasImage = Boolean(displayUrl);
  const showError = uploadState.error || error;

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <motion.div
        className={cn(
          "relative border-2 border-dashed rounded-3xl transition-all duration-300 overflow-hidden",
          isDragOver && !disabled
            ? "border-primary-400 bg-primary-50 shadow-glow"
            : showError
              ? "border-red-300 bg-red-50"
              : hasImage
                ? "border-gray-200 bg-white shadow-soft"
                : "border-gray-200 hover:border-primary-300 hover:bg-gray-50",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!hasImage ? triggerFileSelect : undefined}
        whileHover={
          !disabled && !hasImage && isFirstVisit ? { scale: 1.02 } : undefined
        }
        whileTap={
          !disabled && !hasImage && isFirstVisit ? { scale: 0.98 } : undefined
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(",")}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {hasImage ? (
            <motion.div
              key="image-preview"
              {...getAnimationProps(isFirstVisit, {
                initial: { opacity: 0, scale: 0.98 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.98 },
                transition: { duration: 0.15, ease: "easeOut" },
              })}
              className="relative will-change-transform"
            >
              <img
                src={displayUrl}
                alt="Uploaded"
                className="w-full h-64 object-cover rounded-3xl"
                onError={(e) => {
                  console.error("Image load error:", e);
                  toast.error("Failed to load image");
                }}
              />

              {/* Upload Progress Overlay */}
              <AnimatePresence>
                {uploadState.isUploading && (
                  <motion.div
                    {...getAnimationProps(isFirstVisit, {
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      exit: { opacity: 0 },
                    })}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center"
                  >
                    <div className="text-center text-white">
                      <motion.div
                        animate={isFirstVisit ? { rotate: 360 } : {}}
                        transition={
                          isFirstVisit
                            ? {
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }
                            : {}
                        }
                      >
                        <Loader2 className="w-10 h-10 mx-auto mb-3" />
                      </motion.div>
                      <div className="text-lg font-medium mb-2">
                        Uploading...
                      </div>
                      <div className="w-32 bg-white/20 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="bg-white h-2 rounded-full"
                          {...getAnimationProps(isFirstVisit, {
                            initial: { width: 0 },
                            animate: { width: `${uploadState.progress}%` },
                            transition: { duration: 0.3 },
                          })}
                        />
                      </div>
                      <div className="text-sm mt-2 text-white/80">
                        {uploadState.progress}%
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              {!disabled && !uploadState.isUploading && (
                <motion.div
                  {...getAnimationProps(isFirstVisit, {
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.2 },
                  })}
                  className="absolute top-4 right-4 flex gap-2"
                >
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileSelect();
                    }}
                    className="p-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white transition-all shadow-sm"
                    title="Replace image"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition-all shadow-sm"
                    title="Remove image"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-12 text-center"
            >
              <AnimatePresence mode="wait">
                {uploadState.isUploading ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center"
                    >
                      <Loader2 className="w-8 h-8 text-primary-600" />
                    </motion.div>
                    <div className="text-lg font-semibold text-gray-900">
                      Uploading your image...
                    </div>
                    <div className="w-64 max-w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadState.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      {uploadState.progress}% complete
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload-prompt"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <motion.div
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
                        showError
                          ? "bg-red-100 text-red-600"
                          : isDragOver
                            ? "bg-primary-100 text-primary-600"
                            : "bg-gray-100 text-gray-400",
                      )}
                      animate={isDragOver ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {showError ? (
                        <AlertCircle className="w-8 h-8" />
                      ) : (
                        <motion.div
                          animate={isDragOver ? { y: [-2, 2, -2] } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <Upload className="w-8 h-8" />
                        </motion.div>
                      )}
                    </motion.div>

                    <div className="space-y-2">
                      <motion.div
                        className="text-xl font-semibold text-gray-900"
                        animate={isDragOver ? { scale: 1.05 } : {}}
                      >
                        {isDragOver
                          ? "Drop your image here"
                          : "Upload an image"}
                      </motion.div>
                      <div className="text-gray-600">
                        Drag and drop your image, or{" "}
                        <span className="text-primary-600 font-medium">
                          browse
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 inline-block">
                        Max {Math.round(maxSize / (1024 * 1024))}MB •{" "}
                        {ALLOWED_EXTENSIONS.join(", ")}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{showError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Image display component with robust error handling
interface ImageDisplayProps {
  src?: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onError?: () => void;
  loading?: "lazy" | "eager";
}

export function ImageDisplay({
  src,
  alt,
  className = "",
  fallback,
  onError,
  loading = "lazy",
}: ImageDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  if (!src || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        {fallback || (
          <div className="text-center text-gray-400">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <div className="text-xs">No image</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`w-full h-full object-cover ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
}

// Hook for managing image state
export function useImageUpload() {
  const [imageState, setImageState] = useState<{
    storageId: string | null;
    url: string | null;
    isUploading: boolean;
    error: string | null;
  }>({
    storageId: null,
    url: null,
    isUploading: false,
    error: null,
  });

  const handleImageUploaded = useCallback((storageId: string, url?: string) => {
    setImageState({
      storageId,
      url: url || null,
      isUploading: false,
      error: null,
    });
  }, []);

  const handleImageRemoved = useCallback(() => {
    setImageState({
      storageId: null,
      url: null,
      isUploading: false,
      error: null,
    });
  }, []);

  const setError = useCallback((error: string | null) => {
    setImageState((prev) => ({ ...prev, error }));
  }, []);

  const setUploading = useCallback((isUploading: boolean) => {
    setImageState((prev) => ({ ...prev, isUploading }));
  }, []);

  return {
    imageState,
    handleImageUploaded,
    handleImageRemoved,
    setError,
    setUploading,
  };
}

// Utility functions
export function getImageUrl(storageId: string | null): string | null {
  if (!storageId) return null;
  // This would be replaced with actual Convex URL generation in a real app
  return `${import.meta.env.VITE_CONVEX_URL}/api/storage/${storageId}`;
}

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`;
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`;
  }

  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }

  return null;
}
