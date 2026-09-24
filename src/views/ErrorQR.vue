<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { scanQrCode } from '@/services/presentationService';
import useViewStore from '@/stores/useViewStore';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { goToDashboard } from '@/utils/navigationUtils';
import { LxButton } from '@dativa-lv/lx-ui';
import StatePage from '@/components/StatePage.vue';

const viewStore = useViewStore();
const t = useI18n();

async function openQrScan() {
  try {
    await scanQrCode();
  } catch (e) {
    console.error(e);
  }
}

onMounted(async () => {
  viewStore.navBar = false;
});
</script>

<template>
  <div class="close-button-wrapper">
    <LxButton
      id="error-qr-close-button"
      icon="close"
      kind="ghost"
      variant="icon-only"
      :label="t.t('pages.documentAdd.close')"
      @click="goToDashboard"
    />
  </div>
  <StatePage
    id="error-qr-state"
    kind="error"
    :title="t.t('pages.errorQR.invalidQR')"
    :actionDefinitions="[{ id: 'retry', label: t.t('pages.errorQR.tryAgain'), icon: 'undo' }]"
    @actionClick="openQrScan"
    @close="goToDashboard"
  />
</template>
