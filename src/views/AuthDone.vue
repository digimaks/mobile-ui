<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LxLoader } from '@dativa-lv/lx-ui';
import useAuthStore from '@/stores/useAuthStore';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';

import useAppStore from '@/stores/useAppStore';
import useErrors from '@/hooks/useErrors';
import { HttpStatusCode } from 'axios';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();
const notify = useNotifyStore();
const translate = useI18n();
const errors = useErrors();
/**
 * @type {Record<string, () => {title: string, description: string}>}
 * @description possible error codes returned by the server: [invalid_callback, invalid_token, server_error, invalid_client, no_session, invalid_rights, blocked, invalid_request
 */
const errCodeMessage = {
  unknown: () => ({
    title: translate.t('pages.auth.errors.unknownTitle'),
    description: translate.t('pages.auth.errors.unknownDescription'),
  }),
  invalid_rights: () => ({
    title: translate.t('pages.auth.errors.invalidRightsTitle'),
    description: translate.t('pages.auth.errors.invalidRightsDescription'),
  }),
  blocked: () => ({
    title: translate.t('pages.auth.errors.blockedTitle'),
    description: translate.t('pages.auth.errors.blockedDescription'),
  }),
  invalid_request: () => ({
    title: translate.t('pages.auth.errors.invalidRequestTitle'),
    description: translate.t('pages.auth.errors.invalidRequestDescription'),
  }),
};

onMounted(async () => {
  if (route.query?.error) {
    const err = (errCodeMessage[route.query.error.toString()] || errCodeMessage.unknown)();
    appStore.setError(err.title); // ToDo: use description too when error page is ready
    return;
  }
  if (route.query?.code) {
    await authStore.setSessionKey(route.query.code.toString());
    try {
      await authStore.fetchSession();
    } catch (err) {
      const error = errors.get(err);
      if (error.status === HttpStatusCode.Unauthorized) {
        authStore.logout();
      } else if (error.data) {
        notify.pushError(error.data);
      }
      router.push({ name: 'error' });
      return;
    }
    if (authStore.session.st) {
      if (authStore.isAuthorized) {
        switch (authStore.session?.st) {
          case 'req_role':
            router.push({ name: 'roleSelection' });
            break;
          default:
            router.push({ name: 'dashboard' });
            break;
        }
      } else {
        notify.pushError(translate.t('shell.notifications.unknownState'));
      }
    }
    return;
  }
  const err = errCodeMessage.unknown();
  appStore.setError(err.title); // ToDo: use description too when error page is ready
});
</script>
<template>
  <div id="auth-done-page" class="lx-plate">
    <LxLoader id="auth-done-loader" loading size="l" />
    <p class="lx-description">{{ $t('pages.auth.description') }}</p>
  </div>
</template>
