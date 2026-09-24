<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { LxLoaderView, LxButton } from '@dativa-lv/lx-ui';
import StatePage from '@/components/StatePage.vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';
import useConfirmStore from '@/stores/useConfirmStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import useNotifyStore from '@/stores/useNotifyStore';
import { goToDashboard } from '@/utils/navigationUtils';

const t = useI18n();
const confirmStore = useConfirmStore();
const viewStore = useViewStore();
const route = useRoute();
const notification = useNotifyStore();

const loading = ref(true);
const allowNavigation = ref(false);

const success = ref(false);
const error = ref(false);

function continueToDashboard() {
  allowNavigation.value = true;
  goToDashboard();
}

const stateKind = computed(() => (success.value ? 'success' : 'error'));

const stateTitle = computed(() => {
  if (success.value) return t.t('pages.documentAdd.documentAddedSuccess');
  if (route?.params?.status === 'presentationError')
    return t.t('pages.documentAdd.documentPresentError');
  return t.t('pages.documentAdd.documentAddedError');
});

const stateActions = computed(() => [
  { id: 'continue', label: t.t('pages.documentAdd.continue'), icon: 'next' },
]);

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'dashboard' && !allowNavigation.value && !success.value && !error.value) {
    confirmStore.pushObject({
      title: t.t('pages.documentAdd.canceling'),
      message:
        route?.params?.status === 'presentationError'
          ? t.t('pages.documentPresentation.cancelingDescription')
          : t.t('pages.documentAdd.cancelingDescription'),
      primaryLabel: t.t('pages.documentAdd.yes'),
      secondaryLabel: t.t('pages.documentAdd.no'),
      primaryCallback: () => next(),
      secondaryCallback: () => {
        confirmStore.confirm();
        next(false);
      },
      id: 'document-offer-manual-cancel-confirm-modal',
    });
  } else {
    next();
  }
  allowNavigation.value = false;
});

onMounted(async () => {
  viewStore.navBar = false;
  viewStore.header = true;
  window.addEventListener('lx-native-back', goToDashboard);
  if (route?.params?.status === 'success') {
    success.value = true;
    loading.value = false;
  } else if (route?.params?.status === 'error' || route?.params?.status === 'presentationError') {
    error.value = true;
    loading.value = false;
    if (route?.query?.error && t.te(`errors.${route?.query?.error}`))
      notification.pushError(t.t(`errors.${route?.query?.error}`));
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', goToDashboard);
});
</script>
<template>
  <div class="page-wrapper">
    <div id="document-offer-manual-page" class="page document-page">
      <LxLoaderView
        id="document-offer-manual-loader"
        :loading="loading"
        :label="t.t('general.loading.generic')"
      >
        <div class="close-button-wrapper">
          <LxButton
            id="document-offer-manual-close-button"
            icon="close"
            variant="icon-only"
            kind="ghost"
            :label="t.t('pages.documentAdd.close')"
            @click="goToDashboard"
          />
        </div>
        <div class="document-offer-manual">
          <StatePage
            v-if="success || error"
            id="document-offer-manual-state"
            :kind="stateKind"
            :title="stateTitle"
            :actionDefinitions="stateActions"
            @actionClick="continueToDashboard"
          />
          <!-- <div v-else class="add-button">
          <p>{{ t.t('pages.documentAdd.documentAddManual.description') }}</p>
          <LxButton id="document-offer-manual-add-button" :label="t.t('pages.documentAdd.addButton')" @click="addToWallet(uriValue)" />
        </div> -->
        </div>
      </LxLoaderView>
    </div>
  </div>
</template>
