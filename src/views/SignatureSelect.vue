<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { ref, onMounted, onBeforeUnmount, toRaw } from 'vue';
import { LxButton, LxIcon } from '@dativa-lv/lx-ui';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import { getUserSignatureOptions, selectUserSignatures } from '@/services/issuanceService';
import useViewStore from '@/stores/useViewStore';
import { APP_CONFIG } from '@/constants';
import useConfirmStore from '@/stores/useConfirmStore';
import { goToDashboard } from '@/utils/navigationUtils';

const router = useRouter();
const notification = useNotifyStore();
const t = useI18n();
const viewStore = useViewStore();
const confirmStore = useConfirmStore();

const loading = ref(false);
const selectionData = ref(null);
const selectedItems = ref([]);
const eSign = ref(false);

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'dashboard') {
    confirmStore.pushObject({
      title: t.t('pages.documentAdd.canceling'),
      message: t.t('pages.documentAdd.cancelingDescription'),
      primaryLabel: t.t('pages.documentAdd.yes'),
      secondaryLabel: t.t('pages.documentAdd.no'),
      primaryCallback: () => next(),
      secondaryCallback: () => {
        confirmStore.confirm();
        next(false);
      },
      id: 'signature-select-cancel-confirm-modal',
    });
  } else {
    next();
  }
});

function toggleSelection(id) {
  const idx = selectedItems.value.indexOf(id);
  if (idx > -1) {
    selectedItems.value.splice(idx, 1);
  } else {
    selectedItems.value.push(id);
  }
}

async function submitSelection() {
  loading.value = true;
  try {
    const res = toRaw(selectedItems.value);
    await selectUserSignatures(res);
    if (!APP_CONFIG.embed)
      router.replace({ name: 'documentOfferManual', params: { status: 'success' } });
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
}

async function loadSelectionOptions() {
  loading.value = true;
  try {
    const response = await getUserSignatureOptions();
    selectionData.value = response.options?.eSign || response.options?.eSeal;
    if (response.options?.eSign) {
      eSign.value = true;
    }
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    router.back();
  }
  loading.value = false;
}

onMounted(async () => {
  viewStore.navBar = false;
  window.addEventListener('lx-native-back', goToDashboard);
  await loadSelectionOptions();
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', goToDashboard);
});
</script>

<template>
  <div class="page-wrapper">
    <div id="signature-select-signature-select-page" class="page signature-select">
      <div id="signature-select-header-row" class="close-button-wrapper">
        <LxButton
          id="signature-select-close-button"
          icon="close"
          variant="icon-only"
          kind="ghost"
          :label="t.t('pages.dashboard.close')"
          @click="goToDashboard"
        />
      </div>
      <p v-if="eSign">
        {{ t.t('pages.signatureSelect.eSign') }}
      </p>
      <p v-else>{{ t.t('pages.signatureSelect.eSeal') }}</p>

      <div v-if="selectionData">
        <div id="signature-select-check-list" class="check-list">
          <div
            v-for="item in selectionData"
            :id="`signature-select-item-${item.id}`"
            :key="item.id"
            class="check-item-wrapper"
            @click="toggleSelection(item.id)"
          >
            <div class="check-item" :class="{ selected: selectedItems.includes(item.id) }">
              <div class="check-item-content">
                <p>{{ item.name }}</p>
              </div>
              <div style="display: flex">
                <LxIcon
                  :id="`signature-select-item-${item.id}-icon`"
                  :value="selectedItems.includes(item.id) ? 'accept' : 'unselected'"
                  style="height: 1.5rem"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="fab">
          <LxButton
            id="signature-select-submit-button"
            :label="
              selectedItems.length === 0
                ? t.t('pages.signatureSelect.submitNull')
                : selectedItems.length === 1
                  ? t.t('pages.signatureSelect.submit', selectedItems.length)
                  : t.t('pages.signatureSelect.submitMultiple', selectedItems.length)
            "
            :loading="loading"
            :disabled="selectedItems.length === 0"
            icon="add"
            @click="submitSelection"
          />
          <LxButton
            id="signature-select-cancel-button"
            :label="t.t('pages.signatureSelect.cancel')"
            kind="secondary"
            :loading="loading"
            icon="undo"
            @click="goToDashboard"
          />
        </div>
      </div>
    </div>
  </div>
</template>
