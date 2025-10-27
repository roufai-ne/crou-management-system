/**
 * FICHIER: apps\web\tailwind.config.js
 * CONFIG: Configuration TailwindCSS avec thème CROU complet
 * 
 * DESCRIPTION:
 * Système de design complet pour l'application CROU
 * Couleurs officielles, typographie, composants et tokens
 * Extensions pour formulaires, tableaux et composants métier
 * Support responsive et accessibilité WCAG 2.1 AA
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // Couleurs officielles CROU - Palette complète
      colors: {
        // Couleur principale CROU (Bleu institutionnel)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Couleur principale CROU
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        // Couleur secondaire (Gris neutre)
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        
        // États de validation et feedback
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // Vert CROU
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // Rouge CROU
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Orange CROU
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        info: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49'
        },
        
        // Couleurs spécifiques CROU
        crou: {
          // Couleurs institutionnelles Niger
          green: '#16a34a',  // Vert du drapeau
          orange: '#f59e0b', // Orange du drapeau
          white: '#ffffff',  // Blanc du drapeau
          
          // Couleurs métier
          budget: {
            allocated: '#3b82f6',
            spent: '#16a34a',
            remaining: '#f59e0b',
            overbudget: '#dc2626'
          },
          status: {
            active: '#16a34a',
            inactive: '#6b7280',
            pending: '#f59e0b',
            rejected: '#dc2626',
            approved: '#16a34a'
          }
        }
      },
      
      // Typographie CROU
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Monaco', 'monospace']
      },
      
      // Espacement et tailles
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      
      // Animations personnalisées
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'bounce-subtle': 'bounce-subtle 2s infinite',
        'pulse-slow': 'pulse 3s infinite'
      },
      
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      },
      
      // Grilles personnalisées
      gridTemplateColumns: {
        'dashboard': 'repeat(auto-fit, minmax(280px, 1fr))',
        'table-sm': 'repeat(auto-fit, minmax(120px, 1fr))',
        'table-md': 'repeat(auto-fit, minmax(150px, 1fr))',
        'table-lg': 'repeat(auto-fit, minmax(200px, 1fr))'
      },
      
      // Breakpoints personnalisés
      screens: {
        'xs': '475px',
        '3xl': '1600px'
      },
      
      // Box shadow personnalisées
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      },
      
      // Border radius
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class' // Utilisation avec la classe 'form-input', etc.
    }),
    require('@tailwindcss/typography'),
    
    // Plugin personnalisé pour les composants CROU
    function({ addComponents, theme }) {
      addComponents({
        // Cards CROU
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.card'),
          padding: theme('spacing.6'),
          border: `1px solid ${theme('colors.gray.200')}`,
          transition: 'all 0.2s ease-in-out'
        },
        '.card:hover': {
          boxShadow: theme('boxShadow.card-hover')
        },
        
        // Boutons CROU
        '.btn-primary': {
          backgroundColor: theme('colors.primary.600'),
          color: theme('colors.white'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.primary.700')
          },
          '&:disabled': {
            backgroundColor: theme('colors.gray.400'),
            cursor: 'not-allowed'
          }
        },
        
        // Badges de statut
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: `${theme('spacing.1')} ${theme('spacing.2')}`,
          fontSize: theme('fontSize.xs'),
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.full'),
          textTransform: 'uppercase',
          letterSpacing: theme('letterSpacing.wide')
        },
        '.badge-success': {
          backgroundColor: theme('colors.success.100'),
          color: theme('colors.success.800')
        },
        '.badge-warning': {
          backgroundColor: theme('colors.warning.100'),
          color: theme('colors.warning.800')
        },
        '.badge-danger': {
          backgroundColor: theme('colors.danger.100'),
          color: theme('colors.danger.800')
        },
        
        // Layout CROU
        '.sidebar': {
          backgroundColor: theme('colors.white'),
          borderRight: `1px solid ${theme('colors.gray.200')}`,
          minHeight: '100vh',
          width: theme('spacing.64'),
          position: 'fixed',
          top: '0',
          left: '0',
          zIndex: '40'
        },
        
        // Tables CROU
        '.table': {
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          overflow: 'hidden',
          boxShadow: theme('boxShadow.card')
        },
        '.table th': {
          backgroundColor: theme('colors.gray.50'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          textAlign: 'left',
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.semibold'),
          color: theme('colors.gray.700'),
          borderBottom: `1px solid ${theme('colors.gray.200')}`
        },
        '.table td': {
          padding: `${theme('spacing.4')} ${theme('spacing.4')}`,
          borderBottom: `1px solid ${theme('colors.gray.100')}`,
          fontSize: theme('fontSize.sm'),
          color: theme('colors.gray.900')
        },
        
        // Formulaires CROU
        '.form-group': {
          marginBottom: theme('spacing.4')
        },
        '.form-label': {
          display: 'block',
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.medium'),
          color: theme('colors.gray.700'),
          marginBottom: theme('spacing.2')
        },
        '.form-input': {
          display: 'block',
          width: '100%',
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.sm'),
          borderRadius: theme('borderRadius.md'),
          border: `1px solid ${theme('colors.gray.300')}`,
          backgroundColor: theme('colors.white'),
          transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`
          }
        },
        
        // Alertes CROU
        '.alert': {
          padding: theme('spacing.4'),
          borderRadius: theme('borderRadius.md'),
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.medium'),
          marginBottom: theme('spacing.4')
        },
        '.alert-info': {
          backgroundColor: theme('colors.primary.50'),
          color: theme('colors.primary.800'),
          borderLeft: `4px solid ${theme('colors.primary.500')}`
        },
        '.alert-success': {
          backgroundColor: theme('colors.success.50'),
          color: theme('colors.success.800'),
          borderLeft: `4px solid ${theme('colors.success.500')}`
        },
        '.alert-warning': {
          backgroundColor: theme('colors.warning.50'),
          color: theme('colors.warning.800'),
          borderLeft: `4px solid ${theme('colors.warning.500')}`
        },
        '.alert-danger': {
          backgroundColor: theme('colors.danger.50'),
          color: theme('colors.danger.800'),
          borderLeft: `4px solid ${theme('colors.danger.500')}`
        }
      })
    }
  ]
}