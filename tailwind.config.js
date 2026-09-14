/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          light: '#FFF0E5',
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        navy: {
          DEFAULT: '#172033',
          sidebar: '#172033',
          heading: '#172033',
          dark: '#0F172A',
          800: '#1E293B',
          900: '#172033',
        },
        cream: {
          DEFAULT: '#FFF8F1',
          bg: '#FFF8F1',
          light: '#FFFBF7',
        },
        appText: {
          DEFAULT: '#374151',
          muted: '#6B7280',
          dark: '#172033',
        },
        appBorder: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        info: {
          DEFAULT: '#2563EB',
          light: '#DBEAFE',
        }
      }
    },
  },
  plugins: [],
}
