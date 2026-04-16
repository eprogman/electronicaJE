// @ts-check
import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },

  vite: {
    plugins: [tailwindcss()]
  },
  site: 'https://www.jeelectronica.com',
  integrations: [react(),sitemap()]
});