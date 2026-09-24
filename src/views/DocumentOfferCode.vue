<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { LxButton, LxLoaderView, LxTextInput } from '@dativa-lv/lx-ui';
import { getOfferCodeData, issueDocumentOffer } from '@/services/issuanceService';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import { goToDashboard } from '@/utils/navigationUtils';
import StatePage from '@/components/StatePage.vue';

const t = useI18n();
const notification = useNotifyStore();
const viewStore = useViewStore();

const globalLoading = ref(true);
const loading = ref(false);
const success = ref(false);
const error = ref(false);

const codesData = ref();
const inputCode = ref(null);

async function issueDocument() {
  try {
    loading.value = true;
    document.getElementById('document-offer-code-input-field').blur();
    await issueDocumentOffer(
      codesData.value?.offerUri,
      inputCode.value,
      codesData.value?.issuerName
    );
    notification.pushSuccess(t.t('pages.documentAdd.documentAdded'));
    success.value = true;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    inputCode.value = '';
  } finally {
    loading.value = false;
  }
}

function endAddition() {
  goToDashboard();
}

const stateKind = computed(() => (success.value ? 'success' : 'error'));

const stateTitle = computed(() =>
  success.value
    ? t.t('pages.documentAdd.documentAddedSuccess')
    : t.t('pages.documentAdd.documentAddedError')
);

const stateActions = computed(() => [
  { id: 'continue', label: t.t('pages.documentAdd.continue'), icon: 'next' },
]);

onMounted(async () => {
  viewStore.navBar = false;

  window.addEventListener('lx-native-back', goToDashboard);
  try {
    const res = await getOfferCodeData();
    codesData.value = res;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  globalLoading.value = false;
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', goToDashboard);
});
</script>
<template>
  <div class="page-wrapper">
    <div id="document-offer-code-page" class="page document-page">
      <LxLoaderView
        id="document-offer-code-loader"
        :loading="globalLoading || loading"
        :label="loading ? t.t('general.loading.addingDocument') : t.t('general.loading.generic')"
      >
        <div id="document-offer-code-header-row" class="close-button-wrapper">
          <p>{{ t.t('pages.documentAdd.description') }}</p>
          <LxButton
            id="document-offer-code-close-button"
            icon="close"
            variant="icon-only"
            kind="ghost"
            :label="t.t('pages.documentAdd.close')"
            @click="goToDashboard"
          />
        </div>
        <StatePage
          v-if="success || error"
          id="document-offer-code-state"
          :kind="stateKind"
          :title="stateTitle"
          :actionDefinitions="stateActions"
          @actionClick="endAddition"
        />
        <div v-else id="document-offer-code-form-section" class="document-add-code">
          <p v-if="codesData?.txCodeLength">{{ t.t('pages.documentAdd.documentAddCode.title') }}</p>
          <p v-if="codesData?.txCodeLength">
            {{ t.t('pages.documentAdd.documentAddCode.description') }}
          </p>
          <LxTextInput
            id="document-offer-code-input-field"
            v-model="inputCode"
            :maxlength="codesData?.txCodeLength"
            mask="numeric"
            v-if="codesData?.txCodeLength"
          />
          <LxButton
            id="document-offer-code-submit-button"
            :label="t.t('pages.documentAdd.addButton')"
            :disabled="inputCode?.length?.toString() !== codesData?.txCodeLength?.toString()"
            @click="issueDocument"
          />
        </div>
      </LxLoaderView>
    </div>
  </div>
</template>
