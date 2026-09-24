<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, onBeforeUnmount, shallowRef, ref, computed } from 'vue';
import { LxButton, LxLoaderView, LxIcon, lxFileUploaderUtils, LxInfoBox } from '@dativa-lv/lx-ui';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import { downloadSignedDocument, shareSignedDocument, getSharedFile } from '@/services/signService';
import useNotifyStore from '@/stores/useNotifyStore';
import { goToDashboard } from '@/utils/navigationUtils';
import StatePage from '@/components/StatePage.vue';

const t = useI18n();
const route = useRoute();
const router = useRouter();
const viewStore = useViewStore();
const notification = useNotifyStore();

const downloadLoading = shallowRef(false);
const shareLoading = shallowRef(false);
const disabled = shallowRef(false);
const uploadedFiles = ref({ files: [] });
const fileLoading = ref(false);

async function download() {
  downloadLoading.value = true;
  disabled.value = true;
  try {
    await downloadSignedDocument();
    if (viewStore.system !== 'ios') notification.pushSuccess(t.t('pages.sign.downloadSuccess'));
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  downloadLoading.value = false;
  disabled.value = false;
}

async function share() {
  shareLoading.value = true;
  disabled.value = true;
  try {
    await shareSignedDocument();
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  shareLoading.value = false;
  disabled.value = false;
}

function goToSecondStep(filePath) {
  if (!filePath) return;
  router.push({
    name: 'sign',
    params: {
      step: 2,
      filePath: filePath || 'null',
      type: route.params.type || 'null',
    },
  });
}

const signStateTitle = computed(() => {
  if (route.params.step === 'success') {
    if (route.params.type === 'seal') return t.t('pages.sign.successSeal');
    return t.t('pages.sign.success');
  }
  if (route.params.type === 'seal') return t.t('pages.sign.errorSeal');
  return t.t('pages.sign.error');
});

const signStateActions = computed(() => {
  if (route.params.step === 'error') {
    return [{ id: 'continue', label: t.t('pages.sign.continue'), icon: 'next' }];
  }

  const actions = [];

  actions.push({
    id: 'download',
    label:
      viewStore.system !== 'ios' ? t.t('pages.sign.download') : t.t('pages.sign.downloadAndShare'),
    icon: viewStore.system !== 'ios' ? 'download' : 'share',
    busy: downloadLoading.value,
    disabled: disabled.value,
    group: 'sign-actions',
  });

  if (viewStore.system !== 'ios') {
    actions.push({
      id: 'share',
      label: t.t('pages.sign.share'),
      icon: 'share',
      busy: shareLoading.value,
      disabled: disabled.value,
      group: 'sign-actions',
    });
  }

  actions.push({
    id: 'continue',
    label: t.t('pages.sign.continue'),
    icon: 'cancel',
    kind: 'secondary',
    variant: viewStore.system !== 'ios' ? 'default' : 'icon-only',
    disabled: disabled.value,
    group: 'sign-actions',
  });

  return actions;
});

const signStateKind = computed(() => (route.params.step === 'success' ? 'success' : 'error'));

function handleSignStateAction(id) {
  if (id === 'download') download();
  else if (id === 'share') share();
  else goToDashboard();
}

onMounted(async () => {
  viewStore.navBar = false;
  window.addEventListener('lx-native-back', goToDashboard);

  if (route.params.filePath) {
    fileLoading.value = true;
    const res = await getSharedFile(route.params.filePath);
    if (res?.files?.length && res.files[0]?.isValid) {
      uploadedFiles.value = res;

      fileLoading.value = false;
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', goToDashboard);
});
</script>

<template>
  <div class="page-wrapper">
    <div id="sign-done-page" class="page sign-page" :class="[viewStore.system]">
      <LxLoaderView
        id="sign-done-loader"
        :loading="route.params.step === 'loading' || fileLoading"
        :label="
          route.params.type === 'seal'
            ? t.t('general.loading.sealingDocument')
            : t.t('general.loading.signingDocument')
        "
      >
        <div class="close-button-wrapper" v-if="route.params.step !== 'loading' && !fileLoading">
          <LxButton
            id="sign-done-close-button"
            icon="close"
            kind="ghost"
            variant="icon-only"
            :label="
              route.params.type === 'seal' ? t.t('pages.sign.closeSeal') : t.t('pages.sign.close')
            "
            :disabled="disabled"
            @click="goToDashboard"
          />
        </div>
        <StatePage
          v-if="route.params.step === 'success' || route.params.step === 'error'"
          id="sign-done-state"
          :kind="signStateKind"
          :title="signStateTitle"
          :actionDefinitions="signStateActions"
          @actionClick="handleSignStateAction"
        >
          <template v-if="route.params.step === 'success'" #info>
            <LxInfoBox id="sign-done-success-info-box" :label="t.t('pages.sign.successInfo')" />
          </template>
          <template #fab>
            <div
              v-if="route.params.step === 'success'"
              id="sign-done-file-details"
              class="file-details"
              tabindex="0"
              @click="goToSecondStep(uploadedFiles?.files?.[0]?.path)"
            >
              <div class="file-details-info">
                <LxIcon
                  id="sign-done-file-icon"
                  :value="lxFileUploaderUtils.provideDefaultIcon(uploadedFiles?.files?.[0]?.name)"
                />
                <div>
                  <p class="lx-primary">{{ uploadedFiles?.files?.[0]?.name }}</p>
                  <p v-if="uploadedFiles?.files?.[0]?.containerInfo?.files?.length === 1">
                    {{ uploadedFiles?.files?.[0]?.containerInfo?.files[0]?.name }}
                  </p>
                  <p
                    class="lx-secondary"
                    v-else-if="uploadedFiles?.files?.[0]?.containerInfo?.files?.length > 1"
                  >
                    {{ uploadedFiles?.files?.[0]?.containerInfo?.files?.length }}
                    {{ t.t('pages.sign.files') }}
                  </p>
                </div>
                <LxIcon id="sign-done-expand-icon" value="expand-right" />
              </div>
            </div>
          </template>
        </StatePage>
      </LxLoaderView>
    </div>
  </div>
</template>
