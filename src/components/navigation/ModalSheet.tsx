import React, { useEffect } from "react";
import { Sheet } from "react-modal-sheet";
import { X } from "lucide-react";
import { cn } from "~/components/ui/ui";

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  detent?: "full-height" | "content-height";
  snapPoints?: number[];
  initialSnap?: number;
  disableScrollLocking?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showHandle?: boolean;
  closeOnBackdrop?: boolean;
}

export function ModalSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  detent = "content-height",
  snapPoints,
  initialSnap = 0,
  disableScrollLocking = true,
  className,
  headerClassName,
  contentClassName,
  showHandle = true,
  closeOnBackdrop = true,
}: ModalSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "var(--scrollbar-width, 0px)";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      detent={detent}
      snapPoints={snapPoints}
      initialSnap={initialSnap}
      disableScrollLocking={disableScrollLocking}
      tweenConfig={{ ease: "easeOut", duration: 0.25 }}
      dragCloseThreshold={0.2}
      dragVelocityThreshold={500}
    >
      <Sheet.Container
        className={cn(
          "!bg-white !rounded-t-3xl !shadow-2xl !border-t !border-gray-200/50 overflow-hidden",
          className,
        )}
      >
        <div className="h-full flex flex-col">
          {/* Drag Handle */}
          {showHandle && (
            <div className="flex justify-center pt-3 pb-2 touch-none">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
          )}

          {/* Header */}
          {(title || description) && (
            <Sheet.Header
              className={cn(
                "flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/95 backdrop-blur-sm flex-shrink-0",
                !showHandle ? "rounded-t-3xl" : "",
                headerClassName,
              )}
            >
              <div className="flex-1 min-w-0 pr-4">
                {title && (
                  <h2 className="text-xl font-semibold text-gray-900 truncate">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {description}
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </Sheet.Header>
          )}

          {/* Content */}
          <Sheet.Content
            className={cn("bg-white flex-1 overflow-hidden", contentClassName)}
          >
            <Sheet.Scroller
              draggableAt="both"
              className="px-6 py-4 h-full"
              style={{
                maxHeight: "calc(100dvh - 120px)",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div className="pb-8">{children}</div>
            </Sheet.Scroller>
          </Sheet.Content>
        </div>
      </Sheet.Container>

      <Sheet.Backdrop
        onTap={closeOnBackdrop ? onClose : undefined}
        className="!bg-black/40"
      />
    </Sheet>
  );
}

interface FormModalSheetProps
  extends Omit<ModalSheetProps, "detent" | "snapPoints"> {
  formHeight?: "small" | "medium" | "large" | "full";
  submitButton?: React.ReactNode;
  cancelButton?: React.ReactNode;
}

export function FormModalSheet({
  formHeight = "medium",
  submitButton,
  cancelButton,
  children,
  ...props
}: FormModalSheetProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const isMobileScreen = window.innerWidth < 1024;
      setIsMobile(isMobileScreen);
    };

    checkMobile();
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleResize = () => checkMobile();

    mediaQuery.addEventListener("change", handleResize);
    window.addEventListener("resize", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getSnapPoints = () => {
    if (isMobile) {
      switch (formHeight) {
        case "small":
          return [0.7, 0.4];
        case "medium":
          return [0.85, 0.5];
        case "large":
          return [0.9, 0.6];
        case "full":
          return [0.95];
        default:
          return [0.85, 0.5];
      }
    } else {
      switch (formHeight) {
        case "small":
          return [0.5, 0.3];
        case "medium":
          return [0.6, 0.4];
        case "large":
          return [0.7, 0.5];
        case "full":
          return [0.8];
        default:
          return [0.6, 0.4];
      }
    }
  };

  return (
    <ModalSheet
      {...props}
      detent="full-height"
      snapPoints={getSnapPoints()}
      initialSnap={0}
      contentClassName="flex flex-col"
      className={cn(
        isMobile ? "!rounded-t-3xl" : "!rounded-2xl !max-w-2xl !mx-auto !mt-8",
        props.className,
      )}
    >
      <div className="flex-1 overflow-y-auto pb-6">{children}</div>

      {/* Action Buttons */}
      {(submitButton || cancelButton) && (
        <div className="border-t border-gray-100 p-6 bg-white/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {cancelButton && (
              <div className="w-full sm:flex-1">{cancelButton}</div>
            )}
            {submitButton && (
              <div className="w-full sm:flex-1">{submitButton}</div>
            )}
          </div>
        </div>
      )}
    </ModalSheet>
  );
}

interface QuickActionSheetProps extends Omit<ModalSheetProps, "detent"> {
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive";
  }>;
}

export function QuickActionSheet({
  actions,
  children,
  ...props
}: QuickActionSheetProps) {
  return (
    <ModalSheet
      {...props}
      detent="content-height"
      showHandle={true}
      closeOnBackdrop={true}
    >
      {children && <div className="mb-4">{children}</div>}

      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              props.onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left",
              action.variant === "destructive"
                ? "hover:bg-red-50 text-red-600"
                : "hover:bg-gray-50 text-gray-900",
            )}
          >
            {action.icon && <div className="flex-shrink-0">{action.icon}</div>}
            <span className="font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </ModalSheet>
  );
}

interface ConfirmationSheetProps extends Omit<ModalSheetProps, "detent"> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmationSheet({
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
  ...props
}: ConfirmationSheetProps) {
  return (
    <ModalSheet
      {...props}
      detent="content-height"
      showHandle={false}
      closeOnBackdrop={true}
    >
      <div className="text-center py-4">
        <p className="text-gray-900 text-lg mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={props.onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              props.onClose();
            }}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl font-medium transition-colors",
              variant === "destructive"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-primary-600 text-white hover:bg-primary-700",
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}

interface ListSelectionSheetProps<T> extends Omit<ModalSheetProps, "detent"> {
  items: T[];
  onSelect: (item: T) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  selectedValue?: T;
}

export function ListSelectionSheet<T>({
  items,
  onSelect,
  renderItem,
  selectedValue,
  ...props
}: ListSelectionSheetProps<T>) {
  return (
    <ModalSheet
      {...props}
      detent="content-height"
      showHandle={true}
      closeOnBackdrop={true}
    >
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              onSelect(item);
              props.onClose();
            }}
            className="w-full p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            {renderItem(item, index)}
          </button>
        ))}
      </div>
    </ModalSheet>
  );
}
