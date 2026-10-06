// Handgezeichnet wirkende Inline-SVGs – bewusst keine Icon-Font.

export function IconPlane({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 11.5 21 3l-6.5 18-3-7.5L3 11.5Z" />
      <path d="M11.5 13.5 21 3" />
    </svg>
  );
}

export function IconCompass({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

export function IconHeart({ filled, className = "" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20.5C7 16.5 3 13.2 3 9.3 3 6.4 5.2 4.5 7.7 4.5c1.7 0 3.3.9 4.3 2.4 1-1.5 2.6-2.4 4.3-2.4 2.5 0 4.7 1.9 4.7 4.8 0 3.9-4 7.2-9 11.2Z" />
    </svg>
  );
}

export function IconBook({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    </svg>
  );
}

export function IconChat({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a8 8 0 0 1-8 8H4l1.7-3.4A8 8 0 1 1 21 12Z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </svg>
  );
}

export function IconGlobe({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 4 5.7 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.7-4-9s1.5-6.4 4-9Z" />
    </svg>
  );
}

export function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconClose({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconHandshake({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m8 12-3.5-3L8 5.5 12 9l4-3.5L19.5 9 16 12" />
      <path d="m8 12 4 4 4-4" />
      <path d="m8 12-2.5 5M16 12l2.5 5" />
    </svg>
  );
}

export function IconSend({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12 20 4l-4 8 4 8-16-8Z" />
    </svg>
  );
}

export function IconLock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="10" width="14" height="10" rx="1.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconGoogle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z" />
      <path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.6Z" />
      <path fill="#FBBC05" d="M6.53 13.68a5.86 5.86 0 0 1 0-3.36V7.79H3.29a9.74 9.74 0 0 0 0 8.42l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.29c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.37 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.71 5.39l3.24 2.53C7.3 8.01 9.46 6.29 12 6.29Z" />
    </svg>
  );
}

export function IconApple({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.77 12.72c.02 2.34 2.05 3.12 2.07 3.13-.02.05-.32 1.1-1.07 2.17-.64.91-1.3 1.82-2.34 1.84-1.02.02-1.35-.59-2.52-.59-1.17 0-1.54.57-2.51.61-1.01.04-1.79-.98-2.44-1.89-1.33-1.86-2.35-5.26-.98-7.54.68-1.13 1.76-1.84 2.94-1.86 1-.02 1.94.65 2.52.65.58 0 1.68-.8 2.83-.68.48.02 1.84.19 2.72 1.46-.07.04-1.63.95-1.62 2.7ZM14.91 7.36c.52-.63.87-1.5.77-2.36-.75.03-1.65.5-2.19 1.13-.48.55-.9 1.44-.79 2.28.84.06 1.69-.43 2.21-1.05Z" />
    </svg>
  );
}

// Stempel-Sticker „Community seit 2024"
export function StickerBadge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <circle cx="60" cy="60" r="56" fill="#d5a39d" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="#f5f2e9" strokeWidth="1.5"
        strokeDasharray="4 4" />
      <path id="badge-circle" d="M60 20a40 40 0 1 1 0 80 40 40 0 1 1 0-80" fill="none" />
      <text fill="#f5f2e9" fontSize="11" fontWeight="700" letterSpacing="1.5"
        fontFamily="Manrope, sans-serif">
        <textPath href="#badge-circle">WYFARE · COMMUNITY · 2024 ·</textPath>
      </text>
      <path d="M48 60l8 8 16-16" fill="none" stroke="#f5f2e9" strokeWidth="4"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
