<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { LxButton, LxList, LxIcon, LxLoaderView } from '@dativa-lv/lx-ui';
import { useRouter } from 'vue-router';
import { getDocumentOptions, issueDocument, scanQrCode } from '@/services/issuanceService';
import { APP_CONFIG } from '@/constants';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import { getDocTypeIcon } from '@/utils/dataUtils';
import { goToDashboard } from '@/utils/navigationUtils';

const t = useI18n();
const router = useRouter();
const viewStore = useViewStore();

const notification = useNotifyStore();

const documentList = ref([]);

const loading = ref(false);
const globalLoading = ref(false);

async function listActionClick(_, id) {
  try {
    const item = documentList.value.find((x) => x?.text === id);
    globalLoading.value = true;
    await issueDocument(item?.type);
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    globalLoading.value = false;
  }
}

async function scanQr() {
  try {
    await scanQrCode();
    if (!APP_CONFIG.embed) {
      router.replace({ name: 'documentOffer' });
    }
  } catch (e) {
    console.error(e);
  }
}

// TODO: add groups to communication functions
const groups = [
  { id: 'PID', name: 'PMLP', expanded: true },
  { id: 'mDL', name: 'CSDD', expanded: true },
  { id: 'Diploma', name: 'RTU', expanded: true },
  { id: 'LVRTC', name: 'LVRTC', expanded: true },
];

function getGroup(text) {
  if (text === 'eSeal' || text === 'eSign') {
    return 'LVRTC';
  }
  return text;
}

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', goToDashboard);
});

onMounted(async () => {
  viewStore.navBar = false;

  window.addEventListener('lx-native-back', goToDashboard);
  try {
    loading.value = true;
    const res = await getDocumentOptions();
    documentList.value = res?.options.map((x) => ({
      ...x,
      translatedName: t.t(`cards.names.${x.text?.toLowerCase()}`),
      icon: 'add',
      typeIcon: getDocTypeIcon(x?.text?.toLowerCase()),
      added: x?.exists === 'false',
      group: getGroup(x?.text),
    }));
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
});
</script>

<template>
  <div class="page-wrapper">
    <div id="add-document-add-document-page" class="page add-document-page">
      <LxLoaderView
        id="add-document-global-loader"
        :loading="globalLoading"
        :label="t.t('general.loading.addingDocument')"
      >
        <div id="add-document-header-row" class="close-button-wrapper">
          <LxButton
            id="add-document-close-button"
            icon="close"
            kind="ghost"
            variant="icon-only"
            :label="t.t('pages.documentAdd.close')"
            @click="goToDashboard"
          />
        </div>

        <div id="add-document-scan-button-group" class="lx-button-set">
          <LxButton
            id="add-document-scan-qr-button"
            :label="t.t('pages.documentAdd.scanQr')"
            icon="qr"
            @click="scanQr"
          />
        </div>
        <p class="document-list-call-action">
          {{ t.t('pages.documentAdd.documentList.callToAction') }}
        </p>
        <LxList
          id="add-document-list"
          :items="documentList"
          :groupDefinitions="groups"
          idAttribute="text"
          nameAttribute="translatedName"
          clickableAttribute="added"
          :has-search="true"
          list-type="1"
          icon-attribute="icon"
          :loading="loading"
          :hideFilteredItems="true"
          :texts="{
            placeholder: '',
            notFoundSearch: t.t('pages.documentAdd.documentList.notFoundSearch'),
            noItems: t.t('pages.documentAdd.documentList.noItems'),
            clear: t.t('pages.documentAdd.documentList.clear'),
            search: t.t('pages.documentAdd.documentList.search'),
          }"
          @actionClick="listActionClick"
        >
          <template #customItem="item">
            <div
              :id="`add-document-list-item-${item?.text}`"
              class="add-document-list-item"
              :class="[{ 'already-added': !item?.added }]"
            >
              <div class="add-item-group">
                <LxIcon
                  :id="`add-document-list-item-type-icon-${item?.text}`"
                  :value="item?.text?.toLowerCase() === 'pid' ? 'person' : item?.typeIcon?.icon"
                  :iconSet="
                    item?.text?.toLowerCase() === 'pid' ? 'phosphor' : item?.typeIcon?.iconSet
                  "
                />
                <p class="lx-primary">{{ item?.translatedName }}</p>
              </div>
              <LxIcon
                :id="`add-document-list-item-tick-icon-${item?.text}`"
                value="tick"
                v-if="!item?.added"
              />
            </div>
          </template>
          <template #customExpanderHeader="item">
            <p class="lx-secondary">{{ item?.name }}</p>
          </template>
        </LxList>
      </LxLoaderView>
    </div>
  </div>
</template>
