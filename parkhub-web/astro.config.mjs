// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');

const buildHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return Date.now().toString(36);
  }
})();

const appVersion = (() => {
  try {
    return readFileSync(new URL('../VERSION', import.meta.url), 'utf8').trim();
  } catch {
    try {
      const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
      return pkg.version || 'dev';
    } catch {
      return 'dev';
    }
  }
})();

/** @type {import('astro').AstroIntegration} */
const swBuildHashIntegration = {
  name: 'sw-build-hash',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const { readFileSync, writeFileSync } = await import('node:fs');
      const swPath = new URL('sw.js', dir);
      try {
        const content = readFileSync(swPath, 'utf8');
        writeFileSync(swPath, content.replace('__BUILD_HASH__', buildHash));
      } catch {
        // sw.js not present — skip
      }
    },
  },
};

export default defineConfig({
  output: 'static',
  devToolbar: {
    enabled: false
  },
  integrations: [react(), swBuildHashIntegration],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['react-router-dom'],
    },
    ssr: {
      noExternal: [/^@fontsource/, /^@fontsource-variable/, 'mappls-web-maps', '@phosphor-icons/react'],
    },
    optimizeDeps: {
      include: [
        'mappls-web-maps',
        'date-fns',
        'date-fns/locale',
        'laravel-echo',
        'pusher-js',
        '@react-google-maps/api',
      ]
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://127.0.0.1:8000'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/node_modules\/(react|react-dom|react-router|react-router-dom)\//.test(id))
              return 'vendor-react';
            if (/node_modules\/framer-motion\//.test(id))
              return 'vendor-motion';
            if (/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector)\//.test(id))
              return 'vendor-i18n';
          },
        },
      },
    },
  },
  fonts: process.env.CI || process.env.DOCKER ? [] : [
    {
      name: 'Outfit',
      cssVariable: '--font-outfit',
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700, 800],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      name: 'Work Sans',
      cssVariable: '--font-work-sans',
      provider: fontProviders.google(),
      weights: [300, 400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
