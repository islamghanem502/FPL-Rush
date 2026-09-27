// Stroke icons, 24-grid, currentColor. "Forward" points left — the app is RTL.

const Svg = ({ size = 18, strokeWidth = 2.6, children, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export const ArrowIcon = (props) => (
  <Svg {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

// The paper plane, mirrored so it flies forward in RTL
export const SendIcon = (props) => (
  <Svg {...props}>
    <path d="M3.5 12 20.5 4.5 16.5 12l4 7.5L3.5 12Z" />
    <path d="M16.5 12H9" />
  </Svg>
);

export const MenuIcon = (props) => (
  <Svg {...props}>
    <path d="M4 8h16M4 16h16" />
  </Svg>
);

export const CloseIcon = (props) => (
  <Svg {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

// Three bars rising and falling — "this is live"
export const LiveBars = ({ className = '' }) => (
  <span className={`flex h-4 items-end gap-[3px] ${className}`} aria-hidden>
    <span className="h-full w-[3px] origin-bottom animate-eq rounded-full bg-current" />
    <span className="h-full w-[3px] origin-bottom animate-eq rounded-full bg-current [animation-delay:-.3s]" />
    <span className="h-full w-[3px] origin-bottom animate-eq rounded-full bg-current [animation-delay:-.6s]" />
  </span>
);
