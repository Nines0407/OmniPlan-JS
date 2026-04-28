import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

function resolveJsToTs(): Plugin {
  return {
    name: 'resolve-js-to-ts',
    resolveId(source, importer) {
      if (!source.endsWith('.js') && !source.endsWith('.jsx')) return null;
      if (!importer) return null;

      const resolved = path.resolve(path.dirname(importer), source);
      const tsPath = resolved.replace(/\.jsx?$/, '.ts');
      const tsxPath = resolved.replace(/\.jsx?$/, '.tsx');

      if (fs.existsSync(tsPath)) return tsPath;
      if (fs.existsSync(tsxPath)) return tsxPath;

      return null;
    },
  };
}

export default defineConfig({
  plugins: [resolveJsToTs()],
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.test.ts', 'packages/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      include: ['packages/server/src/**/*.ts'],
      exclude: ['packages/server/src/db/seed.ts'],
    },
  },
});
