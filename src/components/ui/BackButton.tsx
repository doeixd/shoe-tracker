import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/FormComponents";
import { cn } from "./ui";

interface BackButtonProps {
  /**
   * The route to navigate to when clicked
   */
  to?: string;
  /**
   * Search parameters for the navigation
   */
  search?: Record<string, any>;
  /**
   * Custom label for the button
   */
  label?: string;
  /**
   * Visual variant of the button
   */
  variant?: "ghost" | "secondary" | "outline";
  /**
   * Size of the button
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether to show the arrow icon
   */
  showIcon?: boolean;
  /**
   * Custom onClick handler (overrides navigation)
   */
  onClick?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  /**
   * Whether to use browser history back instead of navigation
   */
  useHistoryBack?: boolean;
  /**
   * Full width button (useful for forms)
   */
  fullWidth?: boolean;
  /**
   * Context for generating appropriate label
   */
  context?: "shoes" | "runs" | "collections" | "analytics" | "general";
}

export function BackButton({
  to,
  search,
  label,
  variant = "ghost",
  size = "sm",
  showIcon = true,
  onClick,
  className,
  disabled = false,
  useHistoryBack = false,
  fullWidth = false,
  context = "general",
}: BackButtonProps) {
  const navigate = useNavigate();

  // Generate contextual label if not provided
  const getContextualLabel = () => {
    if (label) return label;

    switch (context) {
      case "shoes":
        return "Back to Shoes";
      case "runs":
        return "Back to Runs";
      case "collections":
        return "Back to Collections";
      case "analytics":
        return "Back to Analytics";
      default:
        return "Back";
    }
  };

  const handleClick = () => {
    if (disabled) return;

    if (onClick) {
      onClick();
      return;
    }

    if (useHistoryBack) {
      window.history.back();
      return;
    }

    if (to) {
      navigate({
        to,
        search: search || {},
      });
      return;
    }

    // Fallback to browser back
    window.history.back();
  };

  // Compute variant-specific styles
  const variantStyles = (() => {
    switch (variant) {
      case "ghost":
        return "text-gray-600 hover:text-gray-900";
      case "secondary":
        return "text-gray-700 hover:text-gray-900";
      case "outline":
        return "text-gray-600 hover:text-gray-900";
      default:
        return "";
    }
  })();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      icon={showIcon ? <ArrowLeft className="w-4 h-4" /> : undefined}
      fullWidth={fullWidth}
      className={cn(
        // Base styles for consistency
        "flex items-center gap-2",
        // Variant-specific styles
        variantStyles,
        className,
      )}
    >
      {getContextualLabel()}
    </Button>
  );
}

// Preset configurations for common use cases
export const BackToShoes = (props: Omit<BackButtonProps, "to" | "context">) => (
  <BackButton
    {...props}
    to="/shoes"
    context="shoes"
    search={{
      showRetired: true,
      collection: "",
      sortBy: "name",
      modal: false,
      brand: "",
      usageLevel: "",
      dateRange: "all",
    }}
  />
);

export const BackToRuns = (props: Omit<BackButtonProps, "to" | "context">) => (
  <BackButton {...props} to="/runs" context="runs" search={{ modal: false }} />
);

export const BackToCollections = (
  props: Omit<BackButtonProps, "to" | "context">,
) => (
  <BackButton
    {...props}
    to="/collections"
    context="collections"
    search={{ modal: false }}
  />
);

export const BackToAnalytics = (
  props: Omit<BackButtonProps, "to" | "context">,
) => <BackButton {...props} to="/analytics" context="analytics" />;

export const BackToHome = (props: Omit<BackButtonProps, "to" | "context">) => (
  <BackButton {...props} to="/" label="Back to Dashboard" context="general" />
);

// Form-specific back button with consistent styling
export const FormBackButton = ({
  onCancel,
  disabled = false,
  ...props
}: Omit<BackButtonProps, "onClick" | "variant" | "fullWidth"> & {
  onCancel?: () => void;
}) => (
  <BackButton
    {...props}
    onClick={onCancel}
    disabled={disabled}
    variant="secondary"
    fullWidth={true}
    label="Cancel"
    className="sm:flex-1"
  />
);

// Error page back button
export const ErrorBackButton = (
  props: Omit<BackButtonProps, "variant" | "useHistoryBack">,
) => (
  <BackButton
    {...props}
    variant="outline"
    useHistoryBack={true}
    label="Go Back"
  />
);
