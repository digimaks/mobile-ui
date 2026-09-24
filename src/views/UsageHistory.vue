<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getTransactions } from '@/services/transactionsService';
import { LxLoaderView, LxButton } from '@dativa-lv/lx-ui';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import TransactionList from '@/components/TransactionList.vue';
import useViewStore from '@/stores/useViewStore';
import { goToDashboard } from '@/utils/navigationUtils';
import StatePage from '@/components/StatePage.vue';

const t = useI18n();
const notification = useNotifyStore();
const viewStore = useViewStore();
const route = useRoute();
const router = useRouter();

const transactions = ref([]);
const loading = ref(true);
const error = ref(false);
const panelWasOpen = ref(true);

function handleNavigationBack() {
  const { id } = route.params;
  if (id) {
    router.back();
  } else if (panelWasOpen.value) {
    panelWasOpen.value = false;
    viewStore.navbarSwitch = false;
  } else {
    goToDashboard();
  }
}

watch(
  () => viewStore.navbarSwitch,
  (val) => {
    if (val) panelWasOpen.value = true;
  }
);

onMounted(async () => {
  viewStore.navBar = false;
  viewStore.header = true;
  window.addEventListener('lx-native-back', handleNavigationBack);
  try {
    const { id } = route.params;
    const res = id ? await getTransactions(id) : await getTransactions();
    transactions.value = res?.transactions;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    error.value = true;
  }
  loading.value = false;
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', handleNavigationBack);
});
</script>

<template>
  <div class="page-wrapper usage-history">
    <LxLoaderView
      id="usage-history-loader"
      :loading="loading"
      :label="t.t('general.loading.usageHistory')"
    >
      <div class="close-button-wrapper">
        <p>{{ t.t('pages.usageHistory.title') }}</p>
        <LxButton
          id="usage-history-close-button"
          icon="close"
          variant="icon-only"
          kind="ghost"
          :label="t.t('pages.dashboard.close')"
          @click="handleNavigationBack"
        />
      </div>
      <div id="usage-history-page" class="page">
        <StatePage
          v-if="error"
          id="usage-history-error-state"
          kind="error"
          :title="t.t('pages.usageHistory.error')"
        />
        <TransactionList
          id="usage-history-transaction-list"
          :items="transactions"
          v-if="!loading && !error"
        />
      </div>
    </LxLoaderView>
  </div>
</template>
