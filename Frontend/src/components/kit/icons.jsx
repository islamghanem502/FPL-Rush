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

// The way back points right in RTL
export const BackIcon = (props) => (
  <Svg {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
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

export const CheckIcon = (props) => (
  <Svg {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const PlusIcon = (props) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const SearchIcon = (props) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);

export const HomeIcon = (props) => (
  <Svg {...props}>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-8.5Z" />
  </Svg>
);

export const TrophyIcon = (props) => (
  <Svg {...props}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M17 6h3v1a3 3 0 0 1-3 3M7 6H4v1a3 3 0 0 0 3 3" />
  </Svg>
);

export const UserIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </Svg>
);

export const UsersIcon = (props) => (
  <Svg {...props}>
    <circle cx="9" cy="9" r="3.5" />
    <path d="M2.5 19.5c.9-3 3.4-4.8 6.5-4.8s5.6 1.8 6.5 4.8" />
    <path d="M15.5 5.8a3.3 3.3 0 0 1 0 6.4M17.5 14.9c2 .6 3.4 2.2 4 4.6" />
  </Svg>
);

export const CopyIcon = (props) => (
  <Svg {...props}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </Svg>
);

export const ShareIcon = (props) => (
  <Svg {...props}>
    <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" />
    <path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" />
  </Svg>
);

export const ExternalIcon = (props) => (
  <Svg {...props}>
    <path d="M9 5H6a1.5 1.5 0 0 0-1.5 1.5v11.5A1.5 1.5 0 0 0 6 19.5h11.5A1.5 1.5 0 0 0 19 18v-3" />
    <path d="M13.5 4.5h6v6M19.5 4.5 11 13" />
  </Svg>
);

export const LockIcon = (props) => (
  <Svg {...props}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Svg>
);

export const EditIcon = (props) => (
  <Svg {...props}>
    <path d="M14.5 5.5 18.5 9.5M4.5 19.5l1-4.5L15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L9 18.5l-4.5 1Z" />
  </Svg>
);

export const TrashIcon = (props) => (
  <Svg {...props}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5" />
  </Svg>
);

export const ChevronUpIcon = (props) => (
  <Svg {...props}>
    <path d="m6 15 6-6 6 6" />
  </Svg>
);

export const ChevronDownIcon = (props) => (
  <Svg {...props}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const CameraIcon = (props) => (
  <Svg {...props}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2.5h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
    <circle cx="12" cy="12.5" r="3.2" />
  </Svg>
);

export const LogoutIcon = (props) => (
  <Svg {...props}>
    <path d="M9.5 20H6a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 6 4h3.5" />
    <path d="M14 7.5 9.5 12l4.5 4.5M9.5 12h11" />
  </Svg>
);

export const LinkIcon = (props) => (
  <Svg {...props}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Svg>
);

export const RefreshIcon = (props) => (
  <Svg {...props}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9" />
    <path d="M19.5 4v5h-5" />
  </Svg>
);

export const EyeIcon = (props) => (
  <Svg {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const MailIcon = (props) => (
  <Svg {...props}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 7 7.5 6 7.5-6" />
  </Svg>
);

export const PhoneIcon = (props) => (
  <Svg {...props}>
    <path d="M5 4.5h3.5l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 6 1.5 1.5 0 0 1 5 4.5Z" />
  </Svg>
);

export const ShirtIcon = (props) => (
  <Svg {...props}>
    <path d="M9 3.5 4 6l-1.5 5 3 1v8.5h13V12l3-1L20 6l-5-2.5c-.5 1.5-1.6 2.5-3 2.5s-2.5-1-3-2.5Z" />
  </Svg>
);

export const WhistleIcon = (props) => (
  <Svg {...props}>
    <circle cx="9" cy="14" r="5" />
    <path d="M12.5 10.5 20.5 7v4.5l-6.2 1.2M6.5 4.5l1 2M10.5 3.5v2" />
  </Svg>
);

// WhatsApp's speech bubble — drawn in our stroke, not their logo
export const ChatIcon = (props) => (
  <Svg {...props}>
    <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6l-3.9.9Z" />
    <path d="M9 9.5c.3 2.3 2.2 4.4 4.9 5l1.1-1.4-1.9-1-1 .8c-.8-.4-1.5-1.1-1.9-1.9l.8-1-1-1.9L9 9.5Z" strokeWidth="1.6" />
  </Svg>
);

// Bonus points: three columns, the middle one tallest (+3)
export const BarsIcon = (props) => (
  <Svg {...props}>
    <path d="M6 19v-6M12 19V6M18 19v-9" />
  </Svg>
);

export const InfoIcon = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.2" />
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
