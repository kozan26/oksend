/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'apple-primary': 'var(--apple-primary)',
        'apple-primary-hover': 'var(--apple-primary-hover)',
        'apple-gray-1': 'var(--apple-gray-1)',
        'apple-gray-2': 'var(--apple-gray-2)',
        'apple-gray-3': 'var(--apple-gray-3)',
        'apple-gray-4': 'var(--apple-gray-4)',
        'apple-gray-5': 'var(--apple-gray-5)',
        'apple-gray-6': 'var(--apple-gray-6)',
        'apple-background': 'var(--apple-background)',
        'apple-background-secondary': 'var(--apple-background-secondary)',
        'apple-label': 'var(--apple-label)',
        'apple-label-secondary': 'var(--apple-label-secondary)',
        'apple-label-tertiary': 'var(--apple-label-tertiary)',
        'apple-separator': 'var(--apple-separator)',
        'apple-error': 'var(--apple-error)',
        'apple-success': 'var(--apple-success)',
      },
      boxShadow: {
        'apple-sm': 'var(--apple-shadow-sm)',
        'apple-md': 'var(--apple-shadow-md)',
        'apple-lg': 'var(--apple-shadow-lg)',
        'apple-xl': 'var(--apple-shadow-xl)',
      },
      borderRadius: {
        'apple-sm': 'var(--apple-radius-sm)',
        'apple-md': 'var(--apple-radius-md)',
        'apple-lg': 'var(--apple-radius-lg)',
        'apple-xl': 'var(--apple-radius-xl)',
      },
      spacing: {
        'apple-xs': 'var(--apple-spacing-xs)',
        'apple-sm': 'var(--apple-spacing-sm)',
        'apple-md': 'var(--apple-spacing-md)',
        'apple-lg': 'var(--apple-spacing-lg)',
        'apple-xl': 'var(--apple-spacing-xl)',
        'apple-2xl': 'var(--apple-spacing-2xl)',
      },
    },
  },
  plugins: [],
};
