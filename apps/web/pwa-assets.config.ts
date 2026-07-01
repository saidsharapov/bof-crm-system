import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    apple: {
      sizes: [180],
      resizeOptions: { background: '#0d0d1f', fit: 'contain' },
    },
    maskable: {
      sizes: [512],
      resizeOptions: { background: '#0d0d1f', fit: 'contain' },
      padding: 0.3,
    },
    transparent: {
      sizes: [64, 192, 512],
      resizeOptions: { background: '#0d0d1f', fit: 'contain' },
      favicons: [[48, 'favicon-48x48.png']],
    },
  },
  images: ['public/icon.svg'],
})
