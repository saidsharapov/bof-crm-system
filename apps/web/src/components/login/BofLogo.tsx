import { memo } from 'react'

interface BofLogoProps {
  className?: string
  size?: number
}

// Animated SVG logo — BOF wordmark with geometric accent
const BofLogo = memo(function BofLogo({ className = '', size = 48 }: BofLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="BOF CRM"
    >
      {/* Outer hexagonal frame */}
      <path
        d="M24 3L42 13.5V34.5L24 45L6 34.5V13.5L24 3Z"
        stroke="url(#logoGradStroke)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="300"
        strokeDashoffset="300"
        style={{
          animation: 'drawLogo 1.2s cubic-bezier(0.16,1,0.3,1) 0.1s forwards',
        }}
      />

      {/* Inner fill — subtle */}
      <path
        d="M24 5.8L40 15.4V32.6L24 42.2L8 32.6V15.4L24 5.8Z"
        fill="url(#logoGradFill)"
        opacity="0.15"
        style={{ animation: 'fadeIn 0.6s ease 0.8s both' }}
      />

      {/* "B" letterform — geometric */}
      <path
        d="M16 16h6.5c2.2 0 3.8 1.4 3.8 3.2s-1 2.6-2.4 3c1.8.4 3 1.7 3 3.4C26.9 27.9 25.1 29.5 22.6 29.5H16V16zm2.4 5.5H22c.9 0 1.6-.6 1.6-1.6 0-.9-.7-1.5-1.6-1.5h-3.6v3.1zm0 5.6h3.8c1.1 0 1.9-.7 1.9-1.8s-.8-1.8-1.9-1.8h-3.8v3.6z"
        fill="white"
        fillOpacity="0.92"
        style={{ animation: 'fadeIn 0.4s ease 0.9s both' }}
      />

      {/* Accent dot */}
      <circle
        cx="32"
        cy="16"
        r="2.5"
        fill="url(#logoDotGrad)"
        style={{ animation: 'fadeIn 0.4s ease 1s both, pulseDot 2s ease-in-out 1.5s infinite' }}
      />

      <defs>
        <linearGradient id="logoGradStroke" x1="6" y1="3" x2="42" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8193fa" />
          <stop offset="1" stopColor="#5b6ef5" />
        </linearGradient>
        <linearGradient id="logoGradFill" x1="6" y1="3" x2="42" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8193fa" />
          <stop offset="1" stopColor="#3a46c8" />
        </linearGradient>
        <radialGradient id="logoDotGrad" cx="32" cy="16" r="2.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5b8fd" />
          <stop offset="1" stopColor="#5b6ef5" />
        </radialGradient>
      </defs>
    </svg>
  )
})

export default BofLogo
