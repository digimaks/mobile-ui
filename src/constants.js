// SPDX-License-Identifier: EUPL-1.2

export const APP_CONFIG = {
  // @ts-ignore
  apiUrl: window.config.serviceUrl,
  // @ts-ignore
  authUrl: window.config.serviceUrl,
  // @ts-ignore
  publicUrl: window.config.publicUrl,
  // @ts-ignore
  clientId: window.config.clientId,
  // @ts-ignore
  environment: window.config.environment,
  // @ts-ignore
  embed: window.config.embed === 'true',
};

export const AUTH_KEY_TOKEN_SESSION = 'webapp-sessionkey';

export const AUTH_SCOPE = 'vpm';
