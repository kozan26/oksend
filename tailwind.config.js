/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--m3-primary)',
        'on-primary': 'var(--m3-on-primary)',
        'primary-container': 'var(--m3-primary-container)',
        'on-primary-container': 'var(--m3-on-primary-container)',

        surface: 'var(--m3-surface)',
        'on-surface': 'var(--m3-on-surface)',
        'surface-variant': 'var(--m3-surface-variant)',
        'on-surface-variant': 'var(--m3-on-surface-variant)',
        'surface-container': 'var(--m3-surface-container)',
        outline: 'var(--m3-outline)',

        error: 'var(--m3-error)',
        'on-error': 'var(--m3-on-error)',
        'error-container': 'var(--m3-error-container)',
        'on-error-container': 'var(--m3-on-error-container)',
        
        accent: 'var(--m3-accent)',
        'on-accent': 'var(--m3-on-accent)'
      },
      boxShadow: {
        'e1': 'var(--m3-elev-1)',
        'e2': 'var(--m3-elev-2)',
        'e3': 'var(--m3-elev-3)',
        'e4': 'var(--m3-elev-4)',
        'e5': 'var(--m3-elev-5)'
      },
      borderRadius: {
        'm3-sm': 'var(--m3-radius-sm)',
        'm3-md': 'var(--m3-radius-md)',
        'm3-lg': 'var(--m3-radius-lg)'
      }
    },
  },
  plugins: [],
};

