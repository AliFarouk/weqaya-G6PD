import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand & System Palette (Resolved per §1 & §4)
        brand: {
          DEFAULT: '#5E72E4',       // Logo, main buttons, active chips, badges
          hover: '#4A5EC9',
          light: '#EEF1FD',
          text: '#3C51C2',          // Accessible link/text on light surfaces (WCAG AA)
        },
        safe: {
          DEFAULT: '#2DCE89',       // Fills, safe progress bar, safe action buttons
          hover: '#24B677',
          light: '#EAFBF3',
          text: '#139E69',          // Safe dark green text for WCAG compliance
        },
        danger: {
          DEFAULT: '#F5365C',       // Hemolysis progress bar, emergency banner, danger pills
          hover: '#E0264B',
          light: '#FEECEF',
          text: '#D81B43',
        },
        caution: {
          DEFAULT: '#FB6340',       // Caution risk tier
          hover: '#FA4920',
          light: '#FFF0EC',
          text: '#E03E19',
        },
        neutral: {
          title: '#32325D',         // Headings, body titles
          body: '#525F7F',          // Subtitles, descriptive copy
          muted: '#8898AA',         // Placeholders, borders, secondary metadata
          canvas: '#F8F9FE',        // Ambient background
          canvasEnd: '#EDF2F9',     // Canvas gradient stop
          card: '#FFFFFF',          // Card background
        },
        // Material-style surface tokens from DESIGN.md
        surface: {
          DEFAULT: '#fcf8ff',
          dim: '#d8d6ff',
          bright: '#fcf8ff',
          lowest: '#ffffff',
          low: '#f5f2ff',
          container: '#efecff',
          high: '#e8e5ff',
          highest: '#e2dfff',
        },
      },
      fontFamily: {
        cairo: ['var(--font-cairo)', 'sans-serif'],
        tajawal: ['var(--font-tajawal)', 'sans-serif'],
        nunito: ['var(--font-nunito)', 'sans-serif'],
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',             // 4px
        DEFAULT: '0.5rem',         // 8px
        md: '0.75rem',             // 12px (Buttons, Inputs per DESIGN.md)
        lg: '1rem',                // 16px (Cards, Modals per DESIGN.md)
        xl: '1.5rem',              // 24px
        full: '9999px',            // Full pills (Chips, Badges, Search bar)
      },
      boxShadow: {
        'level-0': 'none',
        'level-1': '0 4px 18px -2px rgba(50, 50, 93, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'level-2': '0 10px 30px -5px rgba(50, 50, 93, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.06)',
        'critical': '0 8px 24px -4px rgba(245, 54, 92, 0.22)',
        'search': '0 10px 30px rgba(50, 50, 93, 0.08)',
        'search-focus': '0 12px 36px rgba(94, 114, 228, 0.22)',
      },
      maxWidth: {
        'content': '1240px',
      },
    },
  },
  plugins: [],
};

export default config;
