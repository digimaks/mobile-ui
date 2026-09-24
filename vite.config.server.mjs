/**
 * @param { ReturnType<getEnvVariables> } env
 * @returns { import('vite').ServerOptions }
 */
export const devServerSettings = (env) => {
  const url = new URL(env.BASE_URL);
  return {
    port: url.port,
    https: url.protocol === 'https:',
    fs: {
      // Allow serving files from one level up to the project root, in order to show lx fonts in serving mode
      allow: ['..'],
    },
  };
};
