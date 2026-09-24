// SPDX-License-Identifier: EUPL-1.2

import { defineStore } from 'pinia';
import { LxAuthStore, LxAuthService } from '@dativa-lv/lx-ui';
import { AUTH_KEY_TOKEN_SESSION, AUTH_SCOPE, APP_CONFIG } from '@/constants';

export default defineStore(
  'authStore',
  LxAuthStore(
    // @ts-ignore // ToDo: fix types in lx/ui
    LxAuthService,
    APP_CONFIG.authUrl,
    APP_CONFIG.publicUrl,
    APP_CONFIG.clientId,
    AUTH_SCOPE,
    AUTH_KEY_TOKEN_SESSION
  )
);
