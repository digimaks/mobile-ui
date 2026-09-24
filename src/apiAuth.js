// SPDX-License-Identifier: EUPL-1.2

import axios from 'axios';
import { APP_CONFIG, AUTH_KEY_TOKEN_SESSION } from '@/constants';

export const setSessionKey = (key) => {
  sessionStorage.setItem(AUTH_KEY_TOKEN_SESSION, key);
};

export const getSessionKey = () => sessionStorage.getItem(AUTH_KEY_TOKEN_SESSION);

export const removeSessionKey = () => sessionStorage.removeItem(AUTH_KEY_TOKEN_SESSION);

export default () => {
  const http = axios.create({
    baseURL: APP_CONFIG.authUrl,
    withCredentials: false,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getSessionKey()}`,
    },
  });
  return http;
};
