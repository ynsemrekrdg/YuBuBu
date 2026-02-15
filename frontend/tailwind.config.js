/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dyslexia palette
        dyslexia: {
          bg: '#FFFACD',
          text: '#1A1A2E',
          primary: '#FF6B35',
          secondary: '#F7C948',
          accent: '#E8475F',
        },
        // Dysgraphia palette (writing-focused, green)
        dysgraphia: {
          bg: '#F0FFF4',
          text: '#22543D',
          primary: '#38A169',
          secondary: '#68D391',
          accent: '#48BB78',
          card: '#C6F6D5',
        },
        // Dyscalculia palette
        dyscalculia: {
          bg: '#FFF5F7',
          text: '#2D1B4E',
          primary: '#8B5CF6',
          secondary: '#EC4899',
          accent: '#06B6D4',
          card: '#F3E8FF',
        },

        // App-wide
        yub: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFD54F',
          300: '#FFCA28',
          400: '#FFC107',
          500: '#FFB300',
          600: '#FFA000',
          700: '#FF8F00',
          800: '#FF6F00',
          900: '#E65100',
        },
      },
      fontFamily: {
        dyslexic: ['"OpenDyslexic"', '"Comic Sans MS"', 'cursive'],
        calm: ['"Nunito"', '"Rounded Mplus 1c"', 'sans-serif'],
        fun: ['"Fredoka One"', '"Bubblegum Sans"', 'cursive'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'confetti': 'confetti 1s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255,107,53,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(255,107,53,0.6)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
