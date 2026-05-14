import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/@tanstack/react-virtual')) return 'virtualizer';
          if (id.includes('/react') || id.includes('/react-dom')) return 'react';
          return undefined;
        },
      },
    },
  },
});
