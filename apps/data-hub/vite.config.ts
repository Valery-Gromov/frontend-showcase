import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('"use client"')) {
          return;
        }
        defaultHandler(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes('/recharts/') || id.includes('/d3-')) return 'charts';
          if (id.includes('/@tanstack/')) return 'query';
          if (id.includes('/react') || id.includes('/react-dom')) return 'react';
          return undefined;
        },
      },
    },
  },
});
