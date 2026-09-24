<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { useI18n } from 'vue-i18n';
import { LxButton } from '@dativa-lv/lx-ui';
import useAuthStore from '@/stores/useAuthStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const i18n = useI18n();
const router = useRouter();

function testLogin() {
  // ToDO: change this for real login from authStore
  router.push({ name: 'authDone', query: { code: 'temp-code-for-mock' } });
}
</script>

<template>
  <LxButton
    id="login-authorized-button"
    :href="{ name: 'dashboard' }"
    :label="i18n.t('pages.home.buttons.loginAuthorized')"
    icon="dashboard"
  />
</template>
