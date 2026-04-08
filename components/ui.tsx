import React, { useEffect, useId } from "react";
import { LucideIcon, X, AlertCircle, Info, HelpCircle } from "lucide-react";

export { CreatableSelect } from "./ui/CreatableSelect";
export { UploadProgressInline } from "./ui/UploadProgressInline";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  description,
  action,
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#09090b] border border-zinc-200/80 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      {(title || description || action) && (
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {action && (
            <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide py-1 -my-1">
              <div className="flex items-center gap-1.5 min-w-max pb-1 sm:pb-0">
                {action}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: string;
  isPositive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
}) => {
  return (
    <div className="bg-white dark:bg-[#09090b] border border-zinc-200/80 dark:border-zinc-800/50 rounded-2xl p-5 relative group transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
          <Icon size={18} />
        </div>
        <Badge
          variant="default"
          className="!text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Live
        </Badge>
      </div>
      <div>
        <h4 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">
          {label}
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {value}
          </span>
        </div>
        {subtext && (
          <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

type ButtonVariant = "primary" | "outline" | "ghost" | "blue";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all focus:outline-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

  const variants = {
    primary:
      "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-sm",
    blue: "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10",
    outline:
      "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-900",
    ghost:
      "bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const variants = {
    default:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800",
    success:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20",
    warning:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const ProgressBar: React.FC<{
  value: number;
  max?: number;
  color?: string;
  label?: string;
}> = ({ value, max = 100, color = "bg-zinc-900 dark:bg-white", label }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
  overlayClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  closeButtonClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-lg",
  className = "",
  overlayClassName = "",
  headerClassName = "",
  titleClassName = "",
  bodyClassName = "",
  footerClassName = "",
  closeButtonClassName = "",
}) => {
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${overlayClassName}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${maxWidth} bg-white dark:bg-zinc-950 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] ${className}`}
      >
        <div
          className={`flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0 ${headerClassName}`}
        >
          <h3
            id={titleId}
            className={`text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight ${titleClassName}`}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all ${closeButtonClassName}`}
          >
            <X size={20} />
          </button>
        </div>
        <div
          className={`p-6 overflow-y-auto scrollbar-hide flex-1 ${bodyClassName}`}
        >
          {children}
        </div>
        {footer && (
          <div
            className={`px-6 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex justify-end gap-3 shrink-0 ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface TabsProps {
  tabs: { id: string; label: string; icon?: LucideIcon }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onTabHover?: (id: string) => void;
  onTabFocus?: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onTabHover,
  onTabFocus,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide w-full ${className}`}
    >
      <div className="flex flex-nowrap min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            onMouseEnter={onTabHover ? () => onTabHover(tab.id) : undefined}
            onFocus={onTabFocus ? () => onTabFocus(tab.id) : undefined}
            className={`
              flex items-center gap-2 px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 flex-shrink-0
              ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }
            `}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  className = "",
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all ${className}`}
        {...props}
      />
    </div>
  );
};

interface ModernDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: any) => void;
  type: "alert" | "confirm" | "prompt";
  title: string;
  message: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ModernDialog: React.FC<ModernDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  message,
  defaultValue = "",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
}) => {
  const [inputValue, setInputValue] = React.useState(defaultValue);

  useEffect(() => {
    if (isOpen) setInputValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "alert":
        return <AlertCircle className="text-blue-500" size={24} />;
      case "confirm":
        return <HelpCircle className="text-amber-500" size={24} />;
      case "prompt":
        return <Info className="text-blue-500" size={24} />;
      default:
        return <Info className="text-blue-500" size={24} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-950 rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight leading-none">
                {title}
              </h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-1">
                System Notification
              </p>
            </div>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            {message}
          </p>

          {type === "prompt" && (
            <div className="mb-6">
              <Input
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onConfirm(inputValue)}
                placeholder="Enter value..."
              />
            </div>
          )}

          <div className="flex gap-3">
            {type !== "alert" && (
              <Button
                variant="outline"
                className="flex-1 !rounded-2xl py-3 border-zinc-200 dark:border-zinc-800"
                onClick={onClose}
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              variant="blue"
              className="flex-1 !rounded-2xl py-3 shadow-lg shadow-blue-500/20"
              onClick={() => onConfirm(type === "prompt" ? inputValue : true)}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
