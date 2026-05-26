type IconName =
  | "dashboard"
  | "sparkles"
  | "bank"
  | "clipboard"
  | "chart"
  | "bookmark"
  | "search"
  | "bell"
  | "settings"
  | "plus"
  | "refresh"
  | "copy"
  | "save"
  | "edit"
  | "trash"
  | "upload"
  | "file"
  | "filter"
  | "chevron"
  | "chevronR"
  | "chevronL"
  | "check"
  | "x"
  | "info"
  | "alert"
  | "flask"
  | "target"
  | "book"
  | "layers"
  | "addList"
  | "download"
  | "arrowUp"
  | "arrowDown"
  | "history";

interface IconProps {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, className = "w-5 h-5", strokeWidth = 1.6 }: IconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<IconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="11" width="7" height="10" rx="1.5" />
        <rect x="3" y="15" width="7" height="6" rx="1.5" />
      </>
    ),
    sparkles: (
      <>
        <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8z" />
        <path d="M19 14l.8 2 2 .8-2 .8L19 20l-.8-2-2-.8 2-.8z" />
      </>
    ),
    bank: (
      <>
        <path d="M3 9.5L12 4l9 5.5" />
        <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
        <path d="M3 20h18" />
      </>
    ),
    clipboard: (
      <>
        <rect x="6" y="4" width="12" height="17" rx="2" />
        <path d="M9 4v2h6V4" />
        <path d="M9 11h6M9 15h4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M6 9a6 6 0 1112 0v4l1.5 3h-15L6 13z" />
        <path d="M10 19a2 2 0 004 0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 14a7.97 7.97 0 000-4l2-1.2-2-3.4-2.3.8a8.04 8.04 0 00-3.5-2L13 2h-4l-.6 2.2a8.04 8.04 0 00-3.5 2l-2.3-.8-2 3.4L2.6 10a7.97 7.97 0 000 4l-2 1.2 2 3.4 2.3-.8a8.04 8.04 0 003.5 2L9 22h4l.6-2.2a8.04 8.04 0 003.5-2l2.3.8 2-3.4z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: (
      <>
        <path d="M21 12a9 9 0 11-3-6.7L21 8" />
        <path d="M21 3v5h-5" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M4 16V6a2 2 0 012-2h10" />
      </>
    ),
    save: (
      <>
        <path d="M5 3h11l4 4v14H5z" />
        <path d="M8 3v5h8V3" />
        <rect x="8" y="13" width="8" height="6" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4l11-11-4-4L4 16z" />
        <path d="M14 6l4 4" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
        <path d="M6 7l1 13h10l1-13" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M5 16v3a1 1 0 001 1h12a1 1 0 001-1v-3" />
      </>
    ),
    file: (
      <>
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
      </>
    ),
    filter: <path d="M3 5h18l-7 9v6l-4-2v-4z" />,
    chevron: <path d="M6 9l6 6 6-6" />,
    chevronR: <path d="M9 6l6 6-6 6" />,
    chevronL: <path d="M15 6l-6 6 6 6" />,
    check: <path d="M4 12l5 5L20 6" />,
    x: (
      <>
        <path d="M6 6l12 12M18 6L6 18" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v5h1" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3l10 17H2z" />
        <path d="M12 10v5M12 18h.01" />
      </>
    ),
    flask: (
      <>
        <path d="M9 3h6" />
        <path d="M10 3v6L4 20h16L14 9V3" />
        <path d="M7 14h10" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
      </>
    ),
    book: (
      <>
        <path d="M4 4h7a3 3 0 013 3v14a2 2 0 00-2-2H4z" />
        <path d="M20 4h-7a3 3 0 00-3 3v14a2 2 0 012-2h8z" />
      </>
    ),
    layers: (
      <>
        <path d="M12 3l9 5-9 5-9-5z" />
        <path d="M3 13l9 5 9-5" />
        <path d="M3 18l9 5 9-5" />
      </>
    ),
    addList: (
      <>
        <path d="M3 6h13M3 12h13M3 18h8" />
        <path d="M19 14v6M16 17h6" />
      </>
    ),
    download: (
      <>
        <path d="M12 4v12" />
        <path d="M7 11l5 5 5-5" />
        <path d="M5 20h14" />
      </>
    ),
    arrowUp: <path d="M7 14l5-5 5 5" />,
    arrowDown: <path d="M7 10l5 5 5-5" />,
    history: (
      <>
        <path d="M3 12a9 9 0 109-9 9 9 0 00-7.5 4" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" className={className} {...common} aria-hidden>
      {paths[name]}
    </svg>
  );
}
