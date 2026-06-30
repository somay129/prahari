import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Console surface (ink) ──────────────────────────────
        ink: {
          base:   '#0A0A0B',
          panel:  '#101015',
          raised: '#17171E',
          border: '#26262B',
          dim:    '#3A3A42',
          muted:  '#6B6B72',
          sub:    '#9A9AA5',
          text:   '#E8E6E1',
          bright: '#F5F3EF',
        },
        // ── Evidence surface (paper) ──────────────────────────
        paper: {
          base:   '#F3EFE6',
          warm:   '#EDE9DF',
          rule:   '#D8D2C4',
          faint:  '#C9C3B5',
          ink:    '#1A1814',
          sub:    '#4A443C',
          muted:  '#7A7269',
          dim:    '#B5AFA4',
        },
        // ── Signal palette (data only, never decorative) ──────
        oxblood: {
          DEFAULT: '#9B2C22',
          light:   '#C23B2F',
          dim:     '#6B1E16',
          tint:    '#9B2C221A',
          border:  '#9B2C2240',
        },
        forest: {
          DEFAULT: '#3B6B4A',
          light:   '#4E8C62',
          tint:    '#3B6B4A1A',
          border:  '#3B6B4A40',
        },
        ochre: {
          DEFAULT: '#B7791F',
          light:   '#D4921F',
          tint:    '#B7791F1A',
          border:  '#B7791F40',
        },
        neutral: {
          600: '#6B6B72',
        },
      },
      fontFamily: {
        spectral: ['var(--font-spectral)', 'Georgia', 'serif'],
        geist:    ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono:     ['var(--font-geist-mono)', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.06em' }],
        'xs':  ['11px', { lineHeight: '16px' }],
        'sm':  ['12px', { lineHeight: '18px' }],
        'base':['13px', { lineHeight: '20px' }],
        'md':  ['14px', { lineHeight: '22px' }],
        'lg':  ['16px', { lineHeight: '24px' }],
        'xl':  ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['40px', { lineHeight: '44px' }],
        '5xl': ['56px', { lineHeight: '60px' }],
      },
      letterSpacing: {
        caps:  '0.08em',
        wide:  '0.06em',
        tight: '-0.01em',
      },
      borderRadius: {
        sm:      '2px',
        DEFAULT: '2px',
        md:      '2px',
        lg:      '2px',
        full:    '9999px',
      },
      borderWidth: {
        DEFAULT: '1px',
        '0': '0px',
      },
      boxShadow: {
        none:    'none',
        seal:    '0 0 0 1px rgba(155,44,34,0.3), inset 0 0 12px rgba(155,44,34,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
