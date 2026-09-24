<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import {
  LxButton,
  LxIcon,
  LxList,
  lxFileUploaderUtils,
  LxLoaderView,
  lxDateUtils,
  LxDropDownMenu,
} from '@dativa-lv/lx-ui';
import { useRouter, onBeforeRouteLeave, useRoute } from 'vue-router';
import useViewStore from '@/stores/useViewStore';
import { useI18n } from 'vue-i18n';
import {
  pickFiles,
  getSigningMethods,
  signDocument,
  getSharedFile,
  openFile,
  downloadSignedDocument,
  shareSignedDocument,
} from '@/services/signService';
import { APP_CONFIG } from '@/constants';
import CardList from '@/components/CardList.vue';
import useNotifyStore from '@/stores/useNotifyStore';
import { goToDashboard } from '@/utils/navigationUtils';

const t = useI18n();
const router = useRouter();
const viewStore = useViewStore();
const route = useRoute();
const notification = useNotifyStore();

const uploadedFiles = ref();
const details = ref(false);
const step = ref(1);
const signatureDocuments = ref();

const addFileLoading = ref(false);
const addSigLoading = ref(false);
const signDocumentLoading = ref(false);
const sharedFileLoading = ref(false);
const downloadLoading = ref(false);
const shareLoading = ref(false);
const selectedOutputFormat = ref(null);

const allowedOutputFormats = computed(() => {
  const formats = uploadedFiles.value?.files?.[0]?.allowedOutputFormats ?? [];
  return formats.map((f) => ({
    id: f,
    label: `${t.t(route.params.type === 'seal' ? 'pages.sign.sealAs' : 'pages.sign.signAs')} ${f}`,
  }));
});

onBeforeRouteLeave((to, _, next) => {
  next();
});

function goBack(value) {
  step.value = value - 1;
  if (value === 2) {
    uploadedFiles.value = [];
    selectedOutputFormat.value = null;
  }

  step.value = value - 1;
}

async function getAvailableSignatures() {
  try {
    const res = await getSigningMethods();
    signatureDocuments.value = res?.methods;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
}

async function addSignature(action) {
  addSigLoading.value = true;
  selectedOutputFormat.value = action ?? null;
  if (route.params.id) {
    try {
      await signDocument(
        uploadedFiles.value?.files?.[0]?.path,
        route.params.id,
        selectedOutputFormat.value
      );

      const updatedFile = await getSharedFile(uploadedFiles.value?.files?.[0]?.path);
      let updatedFilePath;

      if (updatedFile?.files?.length > 0) {
        uploadedFiles.value = updatedFile;
        updatedFilePath = updatedFile?.files[0]?.path;
      } else {
        updatedFilePath = uploadedFiles.value?.files?.[0]?.path;
      }

      if (!APP_CONFIG.embed)
        router.replace({
          name: 'signDone',
          params: {
            step: 'success',
            filePath: updatedFilePath,
            ...(route.params.type === 'seal' && { type: 'seal' }),
          },
        });
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
      if (!APP_CONFIG.embed)
        router.replace({
          name: 'signDone',
          params: {
            step: 'error',
            filePath: 'null',
            ...(route.params.type === 'seal' && { type: 'seal' }),
          },
        });
    }
  } else {
    try {
      await getAvailableSignatures();
      step.value = 3;
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    }
  }
  addSigLoading.value = false;
}

async function sendCode() {
  signDocumentLoading.value = true;
  try {
    await signDocument(
      uploadedFiles.value?.files?.[0]?.path,
      'eparaksts',
      selectedOutputFormat.value
    );
    if (!APP_CONFIG.embed) router.replace({ name: 'signDone', params: { step: 'success' } });
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    if (!APP_CONFIG.embed) router.replace({ name: 'signDone', params: { step: 'error' } });
    signDocumentLoading.value = false;
  }
}

function chooseMethod(action, item) {
  if (action === 'click' && item === 'mobile') {
    sendCode();
  }
}

const preparedDocuments = computed(() => {
  if (signatureDocuments.value) {
    const res = signatureDocuments.value.map((doc) => ({
      ...doc.meta,
      preparedItem: {
        docId: doc.meta.id,
        docName: doc.meta.documentDisplay.name,
        docType: doc.meta.documentIdentifier,
        docColor: doc.meta.documentDisplay.textColor,
        docBackgroundColor: doc.meta.documentDisplay.backgroundColor,
        issuingAuthority: doc.meta.issuerDisplay.issuingAuthority,
        issuanceDate: doc.meta.issuanceDate,
        expirationDate: doc.meta.expirationDate,
        hasExpired: doc.meta.hasExpired,
        docNumber: doc.meta.displayNumber,
        docDescription: doc.meta.documentDisplay.description1,
        docDescription2: doc.meta.documentDisplay.description2,
        docDescription3: doc.meta.documentDisplay.description3,
        isFavorite: doc.meta.isFavorite,
        documentDetails: doc.documentDetails,
      },
    }));
    return res;
  }
  return [];
});

async function listActionClick(_, item) {
  signDocumentLoading.value = true;
  try {
    await signDocument(uploadedFiles.value?.files?.[0]?.path, item, selectedOutputFormat.value);
    if (!APP_CONFIG.embed) router.replace({ name: 'signDone', params: { step: 'success' } });
    signDocumentLoading.value = false;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    signDocumentLoading.value = false;
  }
}

async function archiveListClick(_, item) {
  try {
    viewStore.blockNavigation();
    await openFile(uploadedFiles.value?.files?.[0]?.path, item);
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  viewStore.unblockNavigation();
}

async function openFileInfo() {
  if (uploadedFiles.value?.files?.[0]?.containerInfo?.files?.length > 1 && !addSigLoading.value)
    details.value = !details.value;
  else if (
    uploadedFiles.value?.files?.[0]?.containerInfo?.files?.length === 1 ||
    uploadedFiles.value?.files?.[0]?.containerInfo?.files?.length === 0 ||
    !uploadedFiles.value?.files?.[0]?.containerInfo
  ) {
    try {
      viewStore.blockNavigation();
      await openFile(
        uploadedFiles.value?.files?.[0]?.path,
        uploadedFiles.value?.files?.[0]?.containerInfo?.files?.[0]?.name
      );
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    }
    viewStore.unblockNavigation();
  }
}

async function addFile() {
  addFileLoading.value = true;
  try {
    const res = await pickFiles();

    if (!res || !res.files) {
      return;
    }

    if (res.files.length > 0 && res.files[0]?.isValid) {
      uploadedFiles.value = res;
      step.value = 2;
    } else if (res.files[0]?.isValid === false) {
      notification.pushError(t.t('pages.sign.invalidFile'));
    } else {
      notification.pushError(t.t('pages.sign.pickFileError'));
    }
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  } finally {
    addFileLoading.value = false;
  }
}

const fromNav = computed(() => route.query.fromNav === 'true');
const panelWasOpen = ref(true);

watch(
  () => viewStore.navbarSwitch,
  (val) => {
    if (val) panelWasOpen.value = true;
  }
);

function handleNativeBack() {
  if (step.value > 1) {
    goBack(step.value);
    return;
  }

  const { id } = route.params;

  if (fromNav.value) {
    goToDashboard();
  } else if (id) {
    router.back();
  } else if (panelWasOpen.value) {
    panelWasOpen.value = false;
    viewStore.navbarSwitch = false;
  } else {
    goToDashboard();
  }
}

onMounted(async () => {
  viewStore.navBar = false;
  window.addEventListener('lx-native-back', handleNativeBack);
  // Skip choosing file if file path is provided - used when opened from share sheet
  if (route.params.filePath !== 'null') {
    sharedFileLoading.value = true;
    try {
      const res = await getSharedFile(route.params.filePath);
      if (res && res?.files?.length > 0 && res?.files?.[0]?.isValid) {
        uploadedFiles.value = res;
        step.value = 2;
      } else if (res?.files?.[0]?.isValid === false) {
        notification.pushError(t.t('pages.sign.invalidFile'));
      } else {
        notification.pushError(t.t('pages.sign.pickFileError'));
      }
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    }
    sharedFileLoading.value = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', handleNativeBack);
});

async function download() {
  downloadLoading.value = true;
  try {
    await downloadSignedDocument();
    if (viewStore.system !== 'ios') notification.pushSuccess(t.t('pages.sign.downloadSuccess'));
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  downloadLoading.value = false;
}

async function share() {
  shareLoading.value = true;
  try {
    await shareSignedDocument();
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  shareLoading.value = false;
}

const isFileSigned = computed(() => {
  const file = uploadedFiles.value?.files?.[0];
  return Array.isArray(file?.containerInfo?.signers) && file.containerInfo.signers.length > 0;
});

const signButtonLabel = computed(() => {
  const isSeal = route.params.type === 'seal';
  if (allowedOutputFormats.value.length === 1) {
    return `${t.t(isSeal ? 'pages.sign.sealAs' : 'pages.sign.signAs')} ${allowedOutputFormats.value[0].id}`;
  }
  return t.t(isSeal ? 'pages.sign.addSeal' : 'pages.sign.addSignature');
});
</script>

<template>
  <div class="page-wrapper">
    <div id="sign-page" class="page sign-page">
      <LxLoaderView
        id="sign-loader"
        :loading="sharedFileLoading || signDocumentLoading"
        :label="
          signDocumentLoading && route.params.type === 'seal'
            ? t.t('general.loading.sealingDocument')
            : signDocumentLoading
              ? t.t('general.loading.signingDocument')
              : t.t('general.loading.generic')
        "
      >
        <div id="sign-header-row" class="close-button-wrapper">
          <LxButton
            v-if="step === 1"
            id="sign-close-button"
            icon="close"
            kind="ghost"
            :disabled="addFileLoading || addSigLoading || signDocumentLoading"
            variant="icon-only"
            :label="
              route.params.type === 'seal' ? t.t('pages.sign.closeSeal') : t.t('pages.sign.close')
            "
            @click="handleNativeBack"
          />
          <LxButton
            v-else
            id="sign-back-button"
            icon="undo"
            kind="ghost"
            variant="icon-only"
            :label="t.t('pages.sign.cancelSelection')"
            :disabled="addFileLoading || addSigLoading || signDocumentLoading"
            @click="goBack(step)"
          />
        </div>
        <div v-if="step === 1" id="sign-step-1-section">
          <div class="choose-file-texts">
            <p>
              {{
                route.params.type === 'seal'
                  ? t.t('pages.sign.descriptionFirstSeal')
                  : t.t('pages.sign.descriptionFirst')
              }}
            </p>
            <p>{{ t.t('pages.sign.descriptionSecond') }}</p>
            <p>{{ t.t('pages.sign.descriptionThird') }}</p>
          </div>

          <div class="fab">
            <LxButton
              id="sign-add-file-button"
              :label="t.t('pages.sign.addFile')"
              icon="add-item"
              customClass="action-button"
              :busy="addFileLoading"
              @click="addFile"
            />
          </div>
        </div>
        <div v-else-if="step === 2 && !details" id="sign-step-2-section">
          <div
            id="sign-file-details"
            class="file-details"
            tabindex="0"
            @click="openFileInfo"
            @keydown.space="openFileInfo"
          >
            <div class="file-details-info">
              <LxIcon
                id="sign-file-details-icon"
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
              <LxIcon
                id="sign-file-details-expand-icon"
                value="expand-right"
                v-if="uploadedFiles?.files?.[0]?.containerInfo?.files?.length > 1"
              />
            </div>
          </div>

          <template
            v-if="
              uploadedFiles?.files?.[0]?.containerInfo?.signers &&
              uploadedFiles?.files?.[0]?.containerInfo?.signers?.length > 0
            "
          >
            <p class="sign-secondary-label">{{ t.t('pages.sign.signatures') }}</p>
            <div class="signatures-list" :class="{ ios: viewStore.system === 'ios' }">
              <LxList
                id="sign-signatures-list"
                :items="uploadedFiles?.files?.[0]?.containerInfo?.signers"
                list-type="1"
                idAttribute="name"
              >
                <template #customItem="item">
                  <div class="signature-detail-item">
                    <LxIcon
                      :id="`sign-signature-item-${item.name}-icon`"
                      :value="item?.type === 'eSeal' ? 'seal' : 'sign'"
                    />
                    <div>
                      <p class="lx-primary">{{ item?.name }}</p>
                      <p class="lx-secondary">{{ lxDateUtils.formatDateTime(item?.signedAt) }}</p>
                    </div>
                  </div>
                </template>
              </LxList>
            </div>
          </template>
          <div class="fab">
            <LxDropDownMenu
              id="sign-add-signature-dropdown"
              v-if="allowedOutputFormats.length > 1"
              :actionDefinitions="allowedOutputFormats"
              placement="top"
              @actionClick="addSignature"
            >
              <LxButton
                id="sign-add-signature-dropdown-button"
                :label="
                  route.params.type === 'seal'
                    ? t.t('pages.sign.addSeal')
                    : t.t('pages.sign.addSignature')
                "
                icon="sign"
                customClass="action-button"
                :busy="addSigLoading"
                :disabled="downloadLoading || shareLoading"
              />
            </LxDropDownMenu>
            <LxButton
              v-else
              id="sign-add-signature-button"
              :label="signButtonLabel"
              icon="sign"
              customClass="action-button"
              :busy="addSigLoading"
              :disabled="downloadLoading || shareLoading"
              @click="addSignature(allowedOutputFormats[0]?.id)"
            />
            <LxButton
              v-if="isFileSigned"
              id="sign-download-button"
              kind="secondary"
              customClass="action-button"
              :label="
                viewStore.system !== 'ios'
                  ? t.t('pages.sign.download')
                  : t.t('pages.sign.downloadAndShare')
              "
              :icon="viewStore.system !== 'ios' ? 'download' : 'share'"
              :busy="downloadLoading"
              :disabled="addSigLoading || shareLoading"
              @click="download"
            />
            <LxButton
              v-if="viewStore.system !== 'ios' && isFileSigned"
              id="sign-share-button"
              kind="secondary"
              customClass="action-button"
              :label="t.t('pages.sign.share')"
              icon="share"
              :busy="shareLoading"
              :disabled="addSigLoading || downloadLoading"
              @click="share"
            />
          </div>
        </div>
        <div v-else-if="step === 2 && details" id="sign-step-2-details-section">
          <div
            id="sign-file-details-expanded"
            class="file-details details-active"
            tabindex="0"
            @click="details = !details"
            @keydown.space="details = !details"
          >
            <div class="file-details-info">
              <LxIcon id="sign-file-details-expanded-icon" value="collapse-left" />
              <p class="lx-primary">{{ uploadedFiles?.files?.[0]?.name }}</p>
            </div>
          </div>

          <LxList
            id="sign-file-archive-list"
            :items="uploadedFiles?.files?.[0]?.containerInfo?.files"
            list-type="1"
            idAttribute="name"
            clickableAttribute="name"
            class="file-archive-list"
            @actionClick="archiveListClick"
          >
            <template #customItem="item">
              <div class="file-archive-files">
                <LxIcon
                  :id="`sign-file-archive-item-${item.name}-icon`"
                  :value="lxFileUploaderUtils.provideDefaultIcon(item.name)"
                  icon-set="phosphor"
                />
                <p class="lx-primary">{{ item?.name }}</p>
              </div>
            </template>
          </LxList>
        </div>
        <div v-else-if="step === 3" id="sign-step-3-section">
          <div v-if="!signDocumentLoading">
            <p class="sign-primary-label">{{ t.t('pages.sign.chooseMethod') }}</p>
            <LxList
              id="sign-method-list"
              :items="[{ id: 'mobile', name: 'eParaksts mobile', icon: 'open', clickable: true }]"
              list-type="1"
              @actionClick="chooseMethod"
            >
              <template #customItem="item">
                <div class="signature-method-item">
                  <LxIcon id="sign-method-mobile-icon" value="eparaksts-mobile" icon-set="brand" />
                  <p>{{ item.name }}</p>
                </div>
              </template>
            </LxList>
            <p class="sign-primary-label" v-show="preparedDocuments.length > 0">
              {{ t.t('pages.sign.otherMethods') }}
            </p>
            <CardList
              id="sign-card-list"
              v-show="preparedDocuments.length > 0"
              :collapsed="true"
              :items="preparedDocuments"
              @cardClick="listActionClick"
            />
          </div>
        </div>
      </LxLoaderView>
    </div>
  </div>
</template>
