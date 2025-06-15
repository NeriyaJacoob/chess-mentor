/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend-react/src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Primary palette (Professional Blue-Gray)
        primary: {
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
        },
        
        // Chess-specific colors
        chess: {
          light: 'var(--board-light)',
          dark: 'var(--board-dark)',
          border: 'var(--board-border)',
          highlight: 'var(--board-highlight)',
          'legal-move': 'var(--board-legal-move)',
          capture: 'var(--board-capture)',
          check: 'var(--board-check)',
        },
        
        // Semantic colors
        success: {
          50: 'var(--success-50)',
          500: 'var(--success-500)',
          600: 'var(--success-600)',
          700: 'var(--success-700)',
        },
        warning: {
          50: 'var(--warning-50)',
          500: 'var(--warning-500)',
          600: 'var(--warning-600)',
          700: 'var(--warning-700)',
        },
        error: {
          50: 'var(--error-50)',
          500: 'var(--error-500)',
          600: 'var(--error-600)',
          700: 'var(--error-700)',
        },
        info: {
          50: 'var(--info-50)',
          500: 'var(--info-500)',
          600: 'var(--info-600)',
          700: 'var(--info-700)',
        },
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
      },
      
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      
      zIndex: {
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
        'toast': 'var(--z-toast)',
      },
      
      transitionDuration: {
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
      },
      
      transitionTimingFunction: {
        'ease-in-out': 'var(--ease-in-out)',
        'ease-out': 'var(--ease-out)',
        'ease-in': 'var(--ease-in)',
      },
      
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) var(--ease-out)',
        'slide-up': 'slideUp var(--duration-normal) var(--ease-out)',
        'scale-in': 'scaleIn var(--duration-fast) var(--ease-out)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    // Plugin for chess board squares
    function({ addUtilities }) {
      const chessUtilities = {
        '.chess-square': {
          position: 'relative',
          width: '3rem',
          height: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all var(--duration-fast) var(--ease-out)',
        },
        '.chess-square-light': {
          backgroundColor: 'var(--board-light)',
        },
        '.chess-square-dark': {
          backgroundColor: 'var(--board-dark)',
        },
        '.chess-square-selected': {
          backgroundColor: 'var(--board-highlight) !important',
          boxShadow: 'inset 0 0 0 3px var(--info-500)',
        },
        '.chess-square-legal-move::after': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '1.5rem',
          height: '1.5rem',
          backgroundColor: 'var(--board-legal-move)',
          borderRadius: '50%',
          opacity: '0.6',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        },
        '.chess-square-capture::after': {
          backgroundColor: 'transparent !important',
          border: '3px solid var(--board-capture)',
          width: '80%',
          height: '80%',
          opacity: '0.8',
        },
        '.chess-piece': {
          fontSize: '2.5rem',
          lineHeight: '1',
          transition: 'transform var(--duration-fast) var(--ease-out)',
          cursor: 'grab',
          userSelect: 'none',
          filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))',
        },
        '.chess-piece:hover': {
          transform: 'scale(1.05)',
        },
        '.chess-piece:active': {
          cursor: 'grabbing',
          transform: 'scale(1.1)',
        },
        '.chess-piece-dragging': {
          transform: 'scale(1.15)',
          zIndex: '1000',
          opacity: '0.9',
          filter: 'drop-shadow(4px 4px 12px rgba(0, 0, 0, 0.6))',
        }
      }
      
      addUtilities(chessUtilities)
    },
    
    // Plugin for component styles
    function({ addComponents }) {
      const components = {
        '.card': {
          backgroundColor: 'var(--gray-50)',
          border: '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'box-shadow var(--duration-fast) var(--ease-out)',
        },
        '.card:hover': {
          boxShadow: 'var(--shadow-md)',
        },
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          fontWeight: '500',
          fontSize: '0.875rem',
          lineHeight: '1',
          border: 'none',
          cursor: 'pointer',
          transition: 'all var(--duration-fast) var(--ease-out)',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        },
        '.btn-primary': {
          backgroundColor: 'var(--info-600)',
          color: 'white',
        },
        '.btn-primary:hover': {
          backgroundColor: 'var(--info-700)',
          transform: 'translateY(-1px)',
          boxShadow: 'var(--shadow-md)',
        },
        '.btn-secondary': {
          backgroundColor: 'var(--gray-100)',
          color: 'var(--gray-700)',
          border: '1px solid var(--gray-300)',
        },
        '.btn-secondary:hover': {
          backgroundColor: 'var(--gray-200)',
          borderColor: 'var(--gray-400)',
        },
      }
      
      addComponents(components)
    }
  ],
}