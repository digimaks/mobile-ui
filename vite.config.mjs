// SPDX-License-Identifier: EUPL-1.2

/* eslint-disable no-console -- for debugging */
/* eslint-disable no-restricted-imports -- vite doesn`t use aliases in imports */
/* eslint-disable import/no-extraneous-dependencies -- vite mostly should use dev dependencies */
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { createHtmlPlugin } from 'vite-plugin-html';
import mkcert from 'vite-plugin-mkcert';
import { fileURLToPath } from 'url';
import dns from 'dns';
import packageJson from './package.json' assert { type: 'json' };
import { devServerSettings } from './vite.config.server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// set ip4 as default dns lookup in order to support localhost
// https://vitejs.dev/config/server-options.html#server-host
dns.setDefaultResultOrder('ipv4first');

const CONFIG = {
  appName: 'webapp',
  appDescription: 'Embeddable WebApp',
  defaultUrl: 'https://localhost:44342/',
  defaultClient: 'webapp',
};

const getEnvVariables = (mode, serving) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  const envVariables = {
    VUE_APP_VERSION: packageJson.version,
    VUE_APP_ENVIRONMENT: serving ? 'local' : env.NODE_ENV,
    VUE_APP_NAME: CONFIG.appName,
    VUE_APP_DESCRIPTION: CONFIG.appDescription,
    BASE_PATH: env.BASE_PATH,
    VUE_APP_IS_EMBED: env.IS_EMBED,
    VUE_APP_LX_UI_VERSION: `${packageJson.dependencies['@dativa-lv/lx-ui']}`,

    // dev only
    VUE_APP_SERVICE_URL_PROXY: '',
  };
  if (serving) {
    envVariables.BASE_URL = env.PUBLIC_URL || CONFIG.defaultUrl;
    envVariables.BASE_PATH = envVariables.BASE_PATH || '';
    envVariables.VUE_APP_VERSION += '-serve';
    envVariables.USE_MOCK_MIDDLEWARE = env.USE_MOCK_MIDDLEWARE === 'true';
  } else {
    envVariables.VUE_APP_ENVIRONMENT = env.NODE_ENV;
    envVariables.BASE_PATH = envVariables.BASE_PATH || '';
  }
  return envVariables;
};

/**
 * @returns { import('vite').UserConfigExport }
 * @description https://vitejs.dev/config/
 */
export default defineConfig((command) => {
  const serving = command?.command === 'serve' && command?.mode === 'development';
  const envVariables = getEnvVariables(command.mode, serving);
  return {
    base: envVariables.BASE_PATH,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '/lx-fonts': fileURLToPath(
          new URL('./node_modules/@dativa-lv/lx-ui/dist/lx-fonts', import.meta.url)
        ),
      },
    },
    plugins: [
      vue(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: envVariables,
        },
      }),
      serving && mkcert(),
    ],
    build: serving
      ? {
          // https://vitejs.dev/config/#build-target
          target: ['es2020'],
          outDir: './dist',
          sourcemap: true, // in prod env you can build with `pnpm run build --sourcemap=false` in order to disable sourcemaps
        }
      : {
          lib: {
            entry: path.resolve(__dirname, 'src/lib.js'),
            name: 'MobileUI',
            fileName: (format) => `edim-mobile-ui.${format}.js`,
            formats: ['esm', 'umd'],
          },
        },
    server: serving ? devServerSettings(envVariables) : {},
    test: {
      globals: true,
      setupFiles: [path.resolve(__dirname, './tests/setup.js')],
      environment: 'jsdom',
      isolate: false,
      include: ['tests/unit/**/*.js'],
    },
  };
});
