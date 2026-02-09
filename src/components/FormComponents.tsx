import React, { useState, forwardRef } from "react";
import { Eye, EyeOff, AlertCircle, Loader2, ChevronDown } from "lucide-react";

import { cn } from "~/components/ui/ui";

// Color options for the color picker
const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#ec4899", // Pink
  "#6b7280", // Gray
];

// Input Component
interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      icon,
      size = "md",
      variant = "default",
      type = "text",
      className,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const sizeClasses = {
      sm: "h-10 text-sm",
      md: "h-12 text-base",
      lg: "h-14 text-lg",
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(e);
    };

    return (
      <div className="space-y-2">
        {/* Traditional Label */}
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              "block text-sm font-medium transition-colors",
              error
                ? "text-red-600"
                : success
                  ? "text-green-600"
                  : "text-gray-700",
            )}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Flex container for icon and input */}
          <div
            className={cn(
              "flex items-center rounded-2xl border transition-colors duration-200 relative bg-white",
              sizeClasses[size],
              // Focus and state styles
              "focus-within:outline-none focus-within:ring-1 focus-within:ring-primary-500/50",
              // Default state
              !error && !success
                ? "border-gray-200 focus-within:border-primary-500 hover:border-gray-300"
                : "",
              // Error state
              error
                ? "border-red-300 focus-within:border-red-500 bg-red-50/30"
                : "",
              // Success state
              success
                ? "border-green-300 focus-within:border-green-500 bg-green-50/30"
                : "",
            )}
          >
            {/* Icon */}
            {icon && (
              <div
                className={cn(
                  "flex items-center justify-center text-gray-400 flex-shrink-0",
                  size === "sm"
                    ? "ml-3 w-4 h-4"
                    : size === "lg"
                      ? "ml-4 w-6 h-6"
                      : "ml-4 w-5 h-5",
                )}
              >
                {icon}
              </div>
            )}

            {/* Input */}
            <input
              ref={ref}
              type={inputType}
              className={cn(
                // Base styles
                "w-full border-0 outline-none transition-colors duration-200 py-0",
                // Padding with gap from icon
                icon ? "pl-3.5" : "pl-4",
                isPassword ? "pr-12" : "pr-4",
                // Text color
                "text-gray-900 placeholder:text-gray-400",
                // Font size matching the container
                size === "sm"
                  ? "text-sm"
                  : size === "lg"
                    ? "text-lg"
                    : "text-base",
                className,
                props.readOnly ? "bg-white" : "bg-transparent",
              )}
              onFocus={props.onFocus}
              onBlur={props.onBlur}
              onChange={handleInputChange}
              placeholder={props.placeholder}
              {...props}
            />

            {/* Password Toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// Textarea Component
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  resize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, success, helperText, resize = true, className, ...props },
    ref,
  ) => {
    const handleTextareaChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      props.onChange?.(e);
    };

    return (
      <div className="space-y-2">
        {/* Traditional Label */}
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              "block text-sm font-medium transition-colors",
              error
                ? "text-red-600"
                : success
                  ? "text-green-600"
                  : "text-gray-700",
            )}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Textarea */}
          <textarea
            ref={ref}
            className={cn(
              // Base styles
              "w-full min-h-[120px] rounded-2xl border transition-all duration-300 ease-out relative px-4 py-4",
              // Focus and state styles
              "focus:outline-none focus:ring-2 focus:ring-primary-500/20",
              // Default state
              !error && !success
                ? "border-gray-200 focus:border-primary-500"
                : "",
              // Error state
              error ? "border-red-300 focus:border-red-500 bg-red-50/30" : "",
              // Success state
              success
                ? "border-green-300 focus:border-green-500 bg-green-50/30"
                : "",
              // Hover state
              "hover:border-gray-300",
              // Text color
              "text-gray-900 placeholder:text-gray-400",
              // Background
              "bg-white",
              // Resize
              resize ? "resize-y" : "resize-none",
              className,
            )}
            onFocus={props.onFocus}
            onBlur={props.onBlur}
            onChange={handleTextareaChange}
            placeholder={props.placeholder}
            {...props}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

// Select Component
interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  size?: "sm" | "md" | "lg";
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      size = "md",
      options,
      className,
      placeholder,
      icon,
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: "h-10 text-sm",
      md: "h-12 text-base",
      lg: "h-14 text-lg",
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      props.onChange?.(e);
    };

    return (
      <div className="space-y-2">
        {/* Traditional Label */}
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              "block text-sm font-medium transition-colors",
              error
                ? "text-red-600"
                : success
                  ? "text-green-600"
                  : "text-gray-700",
            )}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Select */}
          <select
            ref={ref}
            className={cn(
              // Base styles
              "w-full rounded-2xl border transition-all duration-300 ease-out relative pr-12 appearance-none cursor-pointer z-10",
              sizeClasses[size],
              // Padding
              icon ? "pl-12" : "pl-4",
              // Focus and state styles
              "focus:outline-none focus:ring-0",
              // Default state
              !error && !success
                ? "border-gray-200 focus:border-primary-500"
                : "",
              // Error state
              error ? "border-red-300 focus:border-red-500 bg-red-50/30" : "",
              // Success state
              success
                ? "border-green-300 focus:border-green-500 bg-green-50/30"
                : "",
              // Hover state
              "hover:border-gray-300",
              // Text color
              "text-gray-900",
              // Background
              "bg-white",
              className,
            )}
            onFocus={props.onFocus}
            onBlur={props.onBlur}
            onChange={handleSelectChange}
            {...props}
          >
            <option value="" disabled hidden>
              {placeholder || "Select an option"}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown Arrow */}
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

// Color Picker Component
interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function ColorPicker({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
}: ColorPickerProps) {
  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "w-10 h-10 rounded-xl border-2 transition-all duration-100 hover:scale-105",
              value === color
                ? "border-gray-900 shadow-lg scale-105"
                : "border-gray-200 hover:border-gray-300 shadow-sm",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  );
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:cursor-not-allowed relative overflow-hidden",
      fullWidth ? "w-full" : "",
    );

    const variantClasses = {
      primary:
        "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 disabled:bg-gray-300 disabled:text-gray-500",
      secondary:
        "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500 disabled:bg-gray-100 disabled:text-gray-400",
      outline:
        "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 disabled:border-gray-300 disabled:text-gray-400",
      ghost:
        "text-primary-600 hover:bg-primary-50 focus:ring-primary-500 disabled:text-gray-400",
      danger:
        "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-gray-300 disabled:text-gray-500",
    };

    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-base",
      lg: "px-6 py-4 text-lg",
      xl: "px-8 py-5 text-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          "will-change-transform transition-transform-fast hover:scale-[1.01] active:scale-[0.99]",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

// Form Component
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  renderForm?: boolean;
}

export function Form({
  children,
  title,
  description,
  maxWidth = "md",
  className,
  renderForm = true,
  ...props
}: FormProps) {
  const maxWidthClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-6xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("mx-auto px-4 sm:px-6 pb-8 sm:pb-10", maxWidthClasses[maxWidth])}>
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
          )}
          {description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
      )}
      {renderForm ? (
        <form
          className={cn("space-y-6 animate-fade-in-fast", className)}
          {...props}
        >
          {children}
        </form>
      ) : (
        <div className={cn("space-y-6 animate-fade-in-fast", className)}>
          {children}
        </div>
      )}
    </div>
  );
}

// Form Section Component
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8 space-y-6",
        className,
      )}
    >
      <div className="space-y-2">
        {title && (
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        )}
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

// Form Grid Component
interface FormGridProps {
  cols?: number;
  children: React.ReactNode;
  className?: string;
}

// FormGrid component for grid layouts - exported for use in routes
export function FormGrid({ cols = 2, children, className }: FormGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid gap-4",
        gridCols[cols as keyof typeof gridCols] || gridCols[2],
        className,
      )}
    >
      {children}
    </div>
  );
}
