const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
  "aria-hidden": "true",
  focusable: "false",
};

export function HomeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 10.7 12 3.8l8.5 6.9" />
      <path d="M5.4 9.6V20a.9.9 0 0 0 .9.9h11.4a.9.9 0 0 0 .9-.9V9.6" />
      <path d="M9.7 20.9v-6.4h4.6v6.4" />
    </svg>
  );
}

export function HospitalIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 21V6.2a1 1 0 0 1 .6-.9l6.4-2.4a1 1 0 0 1 1.3.9V21" />
      <path d="M12.3 9.4H19a1 1 0 0 1 1 1V21" />
      <path d="M2.6 21h18.8" />
      <path d="M8.5 8.3h1.5M8.5 11.6h1.5M8.5 14.9h1.5M15.9 13h1.5M15.9 16.4h1.5" />
    </svg>
  );
}

export function CrossIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.8v8.4M7.8 12h8.4" />
    </svg>
  );
}

export function PhoneIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6.9 3.6h2.7l1.3 4.1-2 1.3a12.2 12.2 0 0 0 6.1 6.1l1.3-2 4.1 1.3v2.7a2.2 2.2 0 0 1-2.4 2.2A17.1 17.1 0 0 1 4.7 6a2.2 2.2 0 0 1 2.2-2.4Z" />
    </svg>
  );
}

export function PinIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21.2s6.8-6 6.8-11.4a6.8 6.8 0 1 0-13.6 0C5.2 15.2 12 21.2 12 21.2Z" />
      <circle cx="12" cy="9.7" r="2.4" />
    </svg>
  );
}

export function NavigationIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m20.6 3.4-7.5 17.4-2.4-7.5-7.5-2.4Z" />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.7" />
      <path d="M12 7.4V12l3 1.8" />
    </svg>
  );
}

export function DocIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 3.3H7a2 2 0 0 0-2 2v13.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.8Z" />
      <path d="M13.5 3.3v5.5H19" />
      <path d="M8.6 13h6.8M8.6 16.3h4.6" />
    </svg>
  );
}

export function AlertIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10.5 4.2 2.9 17.5A1.6 1.6 0 0 0 4.3 20h15.4a1.6 1.6 0 0 0 1.4-2.5L13.5 4.2a1.7 1.7 0 0 0-3 0Z" />
      <path d="M12 9v4.2M12 16.7h.01" />
    </svg>
  );
}

export function InfoIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.7" />
      <path d="M12 11.2v4.6M12 7.9h.01" />
    </svg>
  );
}

export function ShieldIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.2 4.8 6v5.4c0 4.1 2.9 7.6 7.2 9.4 4.3-1.8 7.2-5.3 7.2-9.4V6Z" />
      <path d="m8.9 11.9 2.1 2.1 4.1-4.2" />
    </svg>
  );
}

export function WifiOffIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 3.5 21 20.5" />
      <path d="M8.6 15.7a5 5 0 0 1 6.8 0" />
      <path d="M5.3 12.3a10 10 0 0 1 4-2.3M14.9 10.1a10 10 0 0 1 3.8 2.2" />
      <path d="M2.4 9a15 15 0 0 1 3.4-2M18.2 7a15 15 0 0 1 3.4 2" />
      <path d="M12 19.1h.01" />
    </svg>
  );
}

export function AmbulanceIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.2 16.5V8.2a1 1 0 0 1 1-1h9.2v9.3" />
      <path d="M13.4 10.1h3.3l3.1 3.4v3h-2" />
      <path d="M6.4 16.5h7" />
      <circle cx="7.4" cy="17.7" r="1.7" />
      <circle cx="17.2" cy="17.7" r="1.7" />
      <path d="M7.4 9.5v4M5.4 11.5h4" />
    </svg>
  );
}

export function RouteIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="6.2" cy="6.2" r="2.4" />
      <circle cx="17.8" cy="17.8" r="2.4" />
      <path d="M8.6 6.2h5.1a3.1 3.1 0 0 1 0 6.2h-3.4a3.1 3.1 0 0 0 0 6.2h5.1" />
    </svg>
  );
}

export function SparkIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.4 13.8 9l5.6 1.8-5.6 1.8L12 18.2l-1.8-5.6L4.6 10.8 10.2 9Z" />
      <path d="M18.6 16.4l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z" />
    </svg>
  );
}

export function ArrowLeftIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function SortIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h10M4 12h7M4 17h4" />
      <path d="M17.5 4.5v14M17.5 18.5 14.8 16M17.5 18.5l2.7-2.5" />
    </svg>
  );
}

export function MapIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m3.2 6.4 5.6-2.2 6.4 2.2 5.6-2.2v13.4l-5.6 2.2-6.4-2.2-5.6 2.2Z" />
      <path d="M8.8 4.2v13.4M15.2 6.4v13.4" />
    </svg>
  );
}
