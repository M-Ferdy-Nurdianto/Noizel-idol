/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Noize Dark Mode Colors
        'nz-bg': '#09090B',
        'nz-surface': '#13121D',
        'nz-hover': '#1E1C2E',
        'nz-primary': '#9D26FF',
        'nz-primary-hover': '#8215db',
        'nz-magenta': '#FF1CE3',
        'nz-cyan': '#24C6F5',
        'nz-text': '#F8FAFC',
        'nz-muted': '#94A3B8',
        'nz-border': '#272438',
        
        // Aliases for compatibility
        'custom-green': '#9D26FF',
        'custom-green-light': '#b347ff',
        'custom-green-dark': '#8215db',
        'bg-dark': '#09090B',
        'dark': '#09090B',
        'bg-card': '#13121D',
        'accent-yellow': '#24C6F5',
        'accent-blue': '#24C6F5',
        'accent-emerald': '#FF1CE3',
        'aca-blue': '#24C6F5',
      },
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #9D26FF 0%, #FF1CE3 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #24C6F5 0%, #9D26FF 100%)',
        'gradient-dark': 'linear-gradient(180deg, #09090B 0%, #13121D 100%)',
      },
      animation: {
        'pulse-custom': 'pulse-custom 2s infinite cubic-bezier(0.4, 0, 0.6, 1)',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-custom': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(157, 38, 255, 0.6)' },
          '50%': { boxShadow: '0 0 0 10px rgba(157, 38, 255, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          'from': { 'box-shadow': '0 0 5px #9D26FF, 0 0 10px #9D26FF' },
          'to': { 'box-shadow': '0 0 15px #FF1CE3, 0 0 25px #24C6F5' },
        }
      },
    },
  },
  plugins: [],
}
