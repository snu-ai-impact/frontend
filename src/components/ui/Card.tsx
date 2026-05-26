interface CardProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
  padding = "p-5",
}: CardProps) {
  return (
    <section className={`rounded-xl bg-white shadow-card ring-1 ring-surface-200 ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between border-b border-surface-200 px-5 pb-3 pt-4">
          <div>
            {title && (
              <h3 className="text-[14px] font-semibold tracking-tight text-ink-900">{title}</h3>
            )}
            {subtitle && <p className="mt-0.5 text-[12px] text-ink-500">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={padding}>{children}</div>
    </section>
  );
}

export function Input({
  icon,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">{icon}</span>
      )}
      <input
        {...rest}
        className={`h-10 w-full rounded-lg bg-white text-[13px] text-ink-900 ring-1 ring-inset ring-surface-300 placeholder:text-ink-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${icon ? "pl-9" : "pl-3"} pr-3 ${className}`}
      />
    </div>
  );
}

export function Textarea({
  className = "",
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={`w-full resize-none rounded-lg bg-white px-3.5 py-3 text-[13.5px] leading-6 text-ink-900 ring-1 ring-inset ring-surface-300 placeholder:text-ink-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${className}`}
    />
  );
}
