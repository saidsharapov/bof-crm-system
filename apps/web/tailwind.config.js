/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        // ── Foreground: in light mode maps to a dark color, in dark to white ──
        // All `text-white/*` and `bg-white/*` go through this variable.
        white: 'rgb(var(--fg) / <alpha-value>)',

        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d5fe',
          300: '#a5b8fd',
          400: '#8193fa',
          500: '#5b6ef5',
          600: '#4655e0',
          700: '#3a46c8',
          800: '#2f38a0',
          900: '#252d80',
        },

        // ── Background scale: remapped via CSS vars per theme ──────────────
        ink: {
          950: 'rgb(var(--bg-950) / <alpha-value>)',
          900: 'rgb(var(--bg-900) / <alpha-value>)',
          800: 'rgb(var(--bg-800) / <alpha-value>)',
          700: 'rgb(var(--bg-700) / <alpha-value>)',
          600: 'rgb(var(--bg-600) / <alpha-value>)',
          500: 'rgb(var(--bg-500) / <alpha-value>)',
        },

        // BOF DS semantic colors (reference CSS vars)
        'surface-card':      'var(--surface-card)',
        'surface-sunken':    'var(--surface-sunken)',
        'surface-hover':     'var(--surface-hover)',
        'bg-canvas':         'var(--bg-canvas)',
        'bg-subtle':         'var(--bg-subtle)',
        'border-subtle':     'var(--border-subtle)',
        'border-default-ds': 'var(--border-default)',
        'txt-primary':       'var(--text-primary)',
        'txt-secondary':     'var(--text-secondary)',
        'txt-tertiary':      'var(--text-tertiary)',
        'bof-accent':        'var(--accent)',
        'bof-accent-soft':   'var(--accent-soft)',
        'bof-accent-text':   'var(--accent-text)',
        'bof-action':        'var(--action-primary-bg)',
        'bof-action-fg':     'var(--action-primary-fg)',
        'success-bg-ds':     'var(--success-bg)',
        'success-fg-ds':     'var(--success-fg)',
        'success-bd-ds':     'var(--success-border)',
        'danger-bg-ds':      'var(--danger-bg)',
        'danger-fg-ds':      'var(--danger-fg)',
        'danger-bd-ds':      'var(--danger-border)',
        'warning-bg-ds':     'var(--warning-bg)',
        'warning-fg-ds':     'var(--warning-fg)',
        'warning-bd-ds':     'var(--warning-border)',
        'info-bg-ds':        'var(--info-bg)',
        'info-fg-ds':        'var(--info-fg)',
        'info-bd-ds':        'var(--info-border)',
      },

      animation: {
        'fade-up':   'fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':   'fadeIn 0.35s ease-out both',
        'shake':     'shake 0.45s cubic-bezier(0.36,0.07,0.19,0.97) both',
        'shimmer':   'shimmer 1.8s linear infinite',
        'float':     'float 3s ease-in-out infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'draw-logo': 'drawLogo 1.2s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeUp:   { '0%': { opacity:'0', transform:'translateY(18px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        fadeIn:   { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        shake:    { '0%,100%': { transform:'translateX(0)' }, '15%': { transform:'translateX(-7px)' }, '35%': { transform:'translateX(7px)' }, '55%': { transform:'translateX(-5px)' }, '75%': { transform:'translateX(5px)' }, '90%': { transform:'translateX(-2px)' } },
        shimmer:  { '0%': { backgroundPosition:'-200% center' }, '100%': { backgroundPosition:'200% center' } },
        float:    { '0%,100%': { transform:'translateY(0px)' }, '50%': { transform:'translateY(-6px)' } },
        pulseDot: { '0%,100%': { opacity:'1', transform:'scale(1)' }, '50%': { opacity:'0.4', transform:'scale(0.75)' } },
        drawLogo: { '0%': { strokeDashoffset:'300' }, '100%': { strokeDashoffset:'0' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.pb-safe': { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
        '.pt-safe': { paddingTop:    'env(safe-area-inset-top, 0px)'    },
      })
    },
  ],
}
