<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { LxButton, LxLoaderView } from '@dativa-lv/lx-ui';
import { resolveDocumentOffer } from '@/services/issuanceService';
import { useRouter } from 'vue-router';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import { goToDashboard } from '@/utils/navigationUtils';

const t = useI18n();
const router = useRouter();
const notification = useNotifyStore();
const viewStore = useViewStore();

const loading = ref(true);

function addDocument() {
  router.replace({ name: 'documentOfferCode' });
}

const resolveDocumentValue = ref();

onMounted(async () => {
  viewStore.navBar = false;
  viewStore.header = true;
  window.addEventListener('lx-native-back', goToDashboard);
  try {
    const res = await resolveDocumentOffer();
    resolveDocumentValue.value = res;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    router.replace({ name: 'documentOfferManual', params: { status: 'error' } });
  }
  loading.value = false;
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', goToDashboard);
});
</script>

<template>
  <div class="page-wrapper">
    <div id="document-offer-document-offer-page" class="page document-page">
      <LxLoaderView
        id="document-offer-loader"
        :loading="loading"
        :label="t.t('general.loading.generic')"
      >
        <div id="document-offer-header-row" class="close-button-wrapper">
          <p>{{ t.t('pages.documentAdd.description') }}</p>
          <LxButton
            id="document-offer-close-button"
            icon="close"
            variant="icon-only"
            kind="ghost"
            @click="goToDashboard"
            :label="t.t('pages.documentAdd.close')"
          />
        </div>
        <div v-if="!loading" id="document-offer-content" class="document-offer">
          <p>
            {{ t.t('pages.documentAdd.confirmation') }}
            <b v-for="item in resolveDocumentValue?.documents" :key="item.title">
              "{{
                t.te(`cards.names.${item.title?.toLowerCase()}`)
                  ? t.t(`cards.names.${item.title?.toLowerCase()}`)
                  : item?.title
              }}"
            </b>
            ?
          </p>

          <div id="document-offer-actions" class="fab">
            <LxButton
              id="document-offer-add-button"
              :label="t.t('pages.documentAdd.addButton')"
              icon="add"
              @click="addDocument"
            />
            <LxButton
              id="document-offer-cancel-button"
              :label="t.t('pages.documentAdd.cancelButton')"
              @click="goToDashboard"
              icon="undo"
              kind="secondary"
            />
          </div>
        </div>
      </LxLoaderView>
    </div>
  </div>
</template>
