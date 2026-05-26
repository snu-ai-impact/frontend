type ButtonVariant = "primary" | "brand" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12.5px]",
  md: "h-9 px-3.5 text-[13px]",
  lg: "h-11 px-5 text-[14px]",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-700",
  brand: "bg-brand-600 text-white hover:bg-brand-700 shadow-card",
  secondary: "bg-white text-ink-800 ring-1 ring-inset ring-surface-300 hover:bg-surface-50",
  ghost: "text-ink-700 hover:bg-surface-100",
  danger: "bg-white text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  onClick,
  className = "",
  variant = "ghost",
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
  variant?: "ghost" | "solid";
}) {
  const v =
    variant === "solid"
      ? "bg-white text-ink-800 ring-1 ring-inset ring-surface-300 hover:bg-surface-50"
      : "text-ink-700 hover:bg-surface-100";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${v} ${className}`}
    >
      {icon}
    </button>
  );
}
