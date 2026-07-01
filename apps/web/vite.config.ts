import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // Generated PNG icons + other static assets to precache
      includeAssets: [
        'favicon.svg',
        'favicon-48x48.png',
        'icon.svg',
        'pwa-64x64.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
        'apple-touch-icon-180x180.png',
        'bof-logo.png',
      ],

      manifest: {
        name: 'BOF CRM',
        short_name: 'BOF',
        description: 'CRM система для управления заказами, производством и складом',
        lang: 'ru',
        theme_color: '#0d0d1f',
        background_color: '#0d0d1f',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'BOF CRM — Главный экран',
          },
        ],
      },

      workbox: {
        // Precache all JS/CSS/HTML/fonts/images produced by Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // SPA fallback — always serve index.html for navigation
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],

        // Runtime caching rules
        runtimeCaching: [
          // Google Fonts stylesheet
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API calls — NetworkFirst so data stays fresh, falls back to cache offline
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24h
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 10,
            },
          },
        ],

        // Don't cache these patterns
        navigateFallbackAllowlist: [/^(?!\/(api|_)).*$/],
      },

      devOptions: {
        // Enable SW in dev for testing; disable in daily dev to avoid caching noise
        enabled: false,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  server: { port: 3000 },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':  ['@tanstack/react-query'],
          'vendor-form':   ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-state':  ['zustand', 'axios'],
          'vendor-icons':  ['@phosphor-icons/react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
