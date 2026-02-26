/**
 * LogoIcon — marca del enso + tendencia, usable en cualquier tamaño.
 * Usar className para controlar width/height (ej. "w-9 h-9", "w-16 h-16").
 */
export function LogoIcon({ className = "w-9 h-9" }) {
  return (
    <svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="fz-g" gradientUnits="userSpaceOnUse" x1="10" y1="10" x2="100" y2="100">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* Enso — círculo zen con apertura en la parte superior */}
      <path
        d="M 67.2 9.6 A 47 47 0 1 1 42.8 9.6"
        fill="none"
        stroke="url(#fz-g)"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Línea de tendencia alcista */}
      <path
        d="M 22 73 L 37 58 L 51 67 L 66 50 L 83 40"
        fill="none"
        stroke="url(#fz-g)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Punto en el pico */}
      <circle cx="83" cy="40" r="5" fill="#06B6D4" />
    </svg>
  );
}
