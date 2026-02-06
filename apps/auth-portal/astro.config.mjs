import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile', // Optimize images at build time (sharp not supported at runtime)
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [tailwind()],
  // Disable Astro's built-in origin check for OAuth flows
  // We use our own CSRF token validation in oauth/login.astro
  security: {
    checkOrigin: false,
  },
});
