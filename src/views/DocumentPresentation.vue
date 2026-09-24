<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import {
  getRequestDocuments,
  presentationCanceled,
  confirmRequest,
  setVendorPresentationPreference,
} from '@/services/presentationService';
import { LxButton, LxDataBlock, LxLoaderView, LxIcon } from '@dativa-lv/lx-ui';
import Card from '@/components/Card.vue';
import StatePage from '@/components/StatePage.vue';
import { useRouter, onBeforeRouteLeave, useRoute } from 'vue-router';
import useConfirmStore from '@/stores/useConfirmStore';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import { goToDashboard } from '@/utils/navigationUtils';

const t = useI18n();
const router = useRouter();
const route = useRoute();
const confirmStore = useConfirmStore();
const notification = useNotifyStore();
const viewStore = useViewStore();

const approved = ref(false);
const document = ref();
const items = ref([]);
const loading = ref(false);
const error = ref(false);
const success = ref(false);
const rejected = ref(false);
const url = ref();
const allowNavigation = ref(false);
const quickFlowAvailable = ref(false);
const rememberVendor = ref(true);

function handleNavigationBack() {
  const { id } = route.params;
  if (id && !success.value && !error.value) {
    router.replace({ name: 'dashboard', params: { id } });
  } else {
    goToDashboard();
    viewStore.navbarSwitch = true;
  }
}

function reject() {
  rejected.value = true;
  handleNavigationBack();
}

function approve() {
  approved.value = true;
}

async function updatedChecked(index, item) {
  try {
    const doc = items.value?.[index]?.fields?.find((x) => x.id === item.id);
    doc.checked = !doc.checked;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
}

const requiredFields = computed(() =>
  document.value?.documents?.[0]?.fields?.filter((x) => x.isRequired)
);

const notSelectedRequiredFields = computed(() => requiredFields.value?.filter((x) => !x?.checked));

const optionalFields = computed(() =>
  document.value?.documents?.[0]?.fields?.filter((x) => !x.isRequired)
);

async function confirm() {
  if (notSelectedRequiredFields.value?.length > 0) {
    notification.pushError(t.t('pages.documentPresentation.requiredFieldsError'));

    const elem = window.document.getElementById(
      `document-presentation-required-field-${notSelectedRequiredFields.value[0].id}`
    );
    const elemWithPadding = elem.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: elemWithPadding, behavior: 'smooth' });

    return;
  }
  try {
    const fieldValues = {};
    items.value?.[0]?.fields.forEach((x) => {
      fieldValues[x.id] = x?.checked;
    });
    const selectedDocumentId = items.value?.[0]?.meta?.id;
    loading.value = true;
    const res = await confirmRequest(selectedDocumentId, fieldValues);
    url.value = res?.redirectUrl;
    success.value = true;
    notification.pushSuccess(t.t('pages.documentPresentation.documentSent'));
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    error.value = true;
  }
  loading.value = false;
}

async function endPresentation() {
  try {
    if (!error.value) {
      const vendorKey = document.value?.vendorKey;
      if (vendorKey) {
        await setVendorPresentationPreference(vendorKey, rememberVendor.value);
      }
    }
  } catch (e) {
    console.error(e);
  }
  allowNavigation.value = true;
  if (url.value) router.replace(url.value);
  else goToDashboard();
}

async function cancelPresentation(next) {
  next();
  presentationCanceled();
}

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'dashboard' && !allowNavigation.value && !success.value && !error.value) {
    confirmStore.pushObject({
      title: t.t('pages.documentPresentation.canceling'),
      message: rejected.value
        ? t.t('pages.documentPresentation.rejectDescription')
        : t.t('pages.documentPresentation.cancelingDescription'),
      primaryLabel: t.t('pages.documentPresentation.yes'),
      secondaryLabel: t.t('pages.documentPresentation.no'),
      primaryCallback: () => cancelPresentation(next),
      secondaryCallback: () => {
        confirmStore.confirm();
        next(false);
      },
      id: 'document-presentation-cancel-confirm-modal',
    });
  } else {
    next();
  }
  rejected.value = false;
  allowNavigation.value = false;
});

const showValues = ref(false);

function formatValues(item) {
  if (item?.elementIdentifier === 'portrait')
    return t.t('pages.documentPresentation.fields.portrait');
  return item?.value;
}

let doc = '';

const preparedDoc = computed(() => {
  doc = document.value?.documents?.[0]?.meta;

  if (doc) {
    return {
      docId: doc?.id,
      docName: doc?.documentDisplay?.name,
      docType: doc?.documentIdentifier,
      issuingAuthority: doc?.issuerDisplay?.issuingAuthority,
      issuanceDate: doc?.issuanceDate,
      expirationDate: doc?.expirationDate,
      hasExpired: doc?.hasExpired,
      docNumber: doc?.displayNumber,
      docDescription: doc?.documentDisplay?.description1,
      docDescription2: doc?.documentDisplay?.description2,
      docDescription3: doc?.documentDisplay?.description3,
    };
  }
  return {};
});

const stateKind = computed(() => (success.value ? 'success' : 'error'));

const stateTitle = computed(() =>
  success.value
    ? t.t('pages.documentPresentation.documentSent')
    : t.t('pages.documentPresentation.documentSentError')
);

const stateActions = computed(() => [
  ...(success.value
    ? [
        {
          id: 'rememberVendor',
          kind: 'toggle',
          label: t.t('pages.documentPresentation.rememberVendor', {
            verifierName: document.value?.verifierName,
          }),
          value: rememberVendor.value,
        },
      ]
    : []),
  { id: 'continue', label: t.t('pages.documentPresentation.continue'), icon: 'next' },
]);

function handleStateAction(id, val) {
  if (id === 'rememberVendor') {
    rememberVendor.value = val;
    return;
  }
  endPresentation();
}

onMounted(async () => {
  viewStore.navBar = false;

  window.addEventListener('lx-native-back', handleNavigationBack);
  try {
    loading.value = true;
    const res = await getRequestDocuments();
    document.value = res;
    if (res?.documents?.length === 0) error.value = true;
    if (res?.quickFlowAvailable && res?.savedSelectionApplied) {
      quickFlowAvailable.value = true;
    } else {
      quickFlowAvailable.value = false;
    }
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    error.value = true;
  }
  items.value = document.value?.documents;
  loading.value = false;
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', handleNavigationBack);
});
</script>
<template>
  <div class="page-wrapper">
    <div id="document-presentation-page" class="page presentation" :class="{ approved }">
      <LxLoaderView
        id="document-presentation-loader-view"
        :loading="loading"
        :label="t.t('general.loading.documentPresentation')"
      >
        <div class="close-button-wrapper">
          <LxButton
            id="document-presentation-close-button"
            icon="close"
            variant="icon-only"
            kind="ghost"
            :label="t.t('pages.dashboard.close')"
            @click="handleNavigationBack"
          />
        </div>

        <div v-if="!success && !error" class="layout" :class="{ approved }">
          <LxDataBlock
            id="document-presentation-verifier-block"
            :name="document?.verifierName"
            :force-uppercase="false"
            size="l"
            :icon="document?.verifierIsTrusted ? 'verified' : 'unverified'"
          />
          <LxIcon
            id="document-presentation-indicator-icon"
            class="indicator-icon"
            value="move-up"
          />
          <Transition name="fade">
            <div v-if="!approved" class="fab not-approved">
              <div class="lx-button-set">
                <LxButton
                  id="document-presentation-approve-button"
                  :label="t.t('pages.documentPresentation.approve')"
                  icon="tick"
                  @click="quickFlowAvailable ? confirm() : approve()"
                />
                <LxButton
                  v-if="quickFlowAvailable"
                  id="document-presentation-customize-button"
                  :label="t.t('pages.documentPresentation.customize')"
                  kind="secondary"
                  icon="edit"
                  @click="approve"
                />
                <LxButton
                  id="document-presentation-reject-button"
                  :label="t.t('pages.documentPresentation.reject')"
                  kind="secondary"
                  :destructive="true"
                  icon="close"
                  @click="reject"
                />
              </div>
            </div>
          </Transition>
          <Card id="document-presentation-card" :value="preparedDoc" :collapsed="approved" />

          <Transition name="slide-over">
            <div v-if="approved" class="presentation-field-wrapper">
              <div class="show-values">
                <p class="lx-secondary">
                  {{
                    t.t('pages.documentPresentation.dataAccess', {
                      verifierName: document?.verifierName,
                    })
                  }}
                </p>
                <LxButton
                  id="document-presentation-toggle-values-button"
                  kind="ghost"
                  :icon="showValues ? 'hidden' : 'visible'"
                  variant="icon-only"
                  :label="
                    showValues
                      ? t.t('pages.documentPresentation.hideValues')
                      : t.t('pages.documentPresentation.showValues')
                  "
                  @click="showValues = !showValues"
                />
              </div>
              <p v-if="requiredFields?.length > 0" class="list-heading">
                {{ t.t('pages.documentPresentation.requiredFields') }}
              </p>
              <div id="document-presentation-required-fields-list" class="check-list">
                <div
                  class="check-item-wrapper"
                  :id="`document-presentation-required-field-${item.id}`"
                  v-for="item in requiredFields"
                  :key="item.id"
                  @click="updatedChecked(0, item)"
                >
                  <div
                    class="check-item"
                    :class="[{ selected: item?.checked }, { 'not-selected': !item?.checked }]"
                  >
                    <div class="check-item-content">
                      <p :class="[{ 'lx-secondary': showValues }]">{{ item?.readableName }}</p>
                      <p v-if="showValues">{{ formatValues(item) }}</p>
                    </div>
                    <div class="check-item-icon-wrapper">
                      <LxIcon
                        :id="`document-presentation-required-field-${item.id}-icon`"
                        :value="item?.checked ? 'accept' : 'invalid'"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p v-if="optionalFields?.length > 0" class="list-heading">
                {{ t.t('pages.documentPresentation.optionalFields') }}
              </p>
              <div id="document-presentation-optional-fields-list" class="check-list">
                <div
                  class="check-item-wrapper"
                  :id="`document-presentation-optional-field-${item.id}`"
                  v-for="item in optionalFields"
                  :key="item.id"
                  @click="updatedChecked(0, item)"
                >
                  <div class="check-item" :class="[{ selected: item?.checked }]">
                    <div class="check-item-content">
                      <p :class="[{ 'lx-secondary': showValues }]">{{ item?.readableName }}</p>
                      <p v-if="showValues">{{ formatValues(item) }}</p>
                    </div>
                    <div class="check-item-icon-wrapper">
                      <LxIcon
                        :id="`document-presentation-optional-field-${item.id}-icon`"
                        :value="item?.checked ? 'accept' : 'unselected'"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div class="fab approved">
                <div class="lx-button-set">
                  <LxButton
                    id="document-presentation-cancel-selection-button"
                    :label="t.t('pages.documentPresentation.cancel')"
                    kind="secondary"
                    variant="icon-only"
                    icon="cancel"
                    @click="handleNavigationBack"
                  />
                  <LxButton
                    id="document-presentation-send-selected-button"
                    :label="t.t('pages.documentPresentation.sendSelected')"
                    icon="submit"
                    @click="confirm"
                  />
                </div>
              </div>
            </div>
          </Transition>
        </div>
        <StatePage
          id="document-presentation-state"
          v-else-if="success || error"
          :kind="stateKind"
          :title="stateTitle"
          :actionDefinitions="stateActions"
          @actionClick="handleStateAction"
        />
      </LxLoaderView>
    </div>
  </div>
</template>
