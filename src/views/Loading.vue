<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, ref } from 'vue';
import { LxLoaderView } from '@dativa-lv/lx-ui';
import useViewStore from '@/stores/useViewStore';
import { initialiseWallet } from '@/services/onboardingService';
import useNotifyStore from '@/stores/useNotifyStore';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import StatePage from '@/components/StatePage.vue';

const t = useI18n();
const viewStore = useViewStore();
const notification = useNotifyStore();
const router = useRouter();

const error = ref(false);

const errorActions = [{ id: 'continue', label: t.t('pages.documentAdd.continue') }];

function handleErrorAction() {
  router.replace({ name: 'dashboard' });
}

onMounted(async () => {
  viewStore.navBar = false;
  viewStore.header = true;
  try {
    await initialiseWallet();
    router.replace({ name: 'dashboard' });
    notification.pushSuccess(t.t('pages.documentAdd.documentAddedSuccess'));
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    error.value = true;
  }
});
</script>

<template>
  <div id="loading-page">
    <LxLoaderView
      id="loading-spinner"
      :loading="true"
      v-if="!error"
      style="margin-top: 6rem"
      :label="t.t('general.loading.generic')"
    />
    <StatePage
      v-else
      id="loading-error-state"
      kind="error"
      :title="t.t('pages.documentAdd.documentAddedError')"
      :actionDefinitions="errorActions"
      @actionClick="handleErrorAction"
    />
  </div>
</template>
