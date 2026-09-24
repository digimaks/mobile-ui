<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { LxButton } from '@dativa-lv/lx-ui';
import { useI18n } from 'vue-i18n';
import { deleteWallet } from '@/services/settingsService';
import useNotifyStore from '@/stores/useNotifyStore';
import { useRouter } from 'vue-router';
import useViewStore from '@/stores/useViewStore';
import { goToDashboard } from '@/utils/navigationUtils';

const t = useI18n();
const notification = useNotifyStore();
const router = useRouter();
const viewStore = useViewStore();

async function removeWallet() {
  try {
    await deleteWallet();
    notification.pushSuccess(t.t('pages.settings.walletDeletedSuccess'));
    router.replace({ name: 'activation' });
  } catch (e) {
    console.error(e);
    notification.pushError(t.t('pages.settings.walletDeletedError'));
  }
}

onMounted(() => {
  viewStore.navBar = false;
  viewStore.header = true;
  window.addEventListener('lx-native-back', goToDashboard);
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', goToDashboard);
});
</script>
<template>
  <div class="page-wrapper">
    <div id="document-deactivation-page" class="page deactivation">
      <p>{{ t.t('pages.settings.deleteWalletDescription') }}</p>
      <div id="document-deactivation-button-group" class="deactivate-wallet-buttons">
        <LxButton
          id="document-deactivation-confirm-button"
          :label="t.t('pages.settings.yes')"
          :destructive="true"
          icon="delete"
          @click="removeWallet()"
        />
        <LxButton
          id="document-deactivation-cancel-button"
          :label="t.t('pages.settings.no')"
          kind="secondary"
          icon="cancel"
          @click="goToDashboard"
        />
      </div>
    </div>
  </div>
</template>
