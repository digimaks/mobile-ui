<script setup>
import { LxButton, LxForm, LxRow, LxTile, LxFlag, LxInfoBox } from '@dativa-lv/lx-ui';
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { getDocuments, deleteDocument, setDocumentFavorite } from '@/services/documentService';
import { getCardDetails, getCardImage, getDataType, getDocType } from '@/utils/dataUtils';
import { goToDashboard } from '@/utils/navigationUtils';
import useNotifyStore from '@/stores/useNotifyStore';
import useConfirmStore from '@/stores/useConfirmStore';
import useViewStore from '@/stores/useViewStore';
import { useRouter, useRoute } from 'vue-router';
import { scanQrCode } from '@/services/presentationService';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/useUserStore';
import { getState } from '@/services/appService';
import CardList from '@/components/CardList.vue';
import { useMutationObserver } from '@vueuse/core';
import { setLanguage } from '@/services/settingsService';

const router = useRouter();
const route = useRoute();
const t = useI18n();
const viewStore = useViewStore();
const userStore = useUserStore();

const notification = useNotifyStore();
const confirmStore = useConfirmStore();

const lx = ref(null);
const selectedCardId = ref(null);
const selectedCard = ref(null);
const showFullCard = ref(false);
const documents = ref([]);
const loading = ref(false);
const loadingFavorite = ref(false);
const loadingDelete = ref(false);
const favorite = ref(false);
const docDetails = ref([]);
const docImage = ref(null);
const cardDetails = ref([]);
const isPlaceholderCard = ref(false);
const animationsReduced = ref(false);
const isTransitioning = ref(false);
const cardClickTimeout = ref(800);
const transitionTime = ref(500);
const cardListRef = ref(null);
const docViewRef = ref(null);
const cardHeight = ref(0);
const activeRouteId = ref(route.params.id);
const initialLoadComplete = ref(false);

watch(
  () => cardListRef.value?.cardHeight,
  (height) => {
    cardHeight.value = height || 0;
  },
  { immediate: true }
);

function checkForExpiredDocs(docs) {
  const currentTime = Date.now();
  const lastCheckTime = Number(localStorage.getItem('lastExpiryCheck')) || currentTime;

  const newlyExpired = docs.filter((doc) => {
    if (!doc.meta?.expirationDate) return false;
    const expiryTime = new Date(doc.meta.expirationDate).getTime();
    return expiryTime > lastCheckTime && expiryTime <= currentTime;
  });

  if (newlyExpired.length > 0) {
    notification.pushWarning(
      t.t('shell.notifications.expiredLabel'),
      t.t('shell.notifications.expiredDescription')
    );
  }

  localStorage.setItem('lastExpiryCheck', String(currentTime));
}

function addDocument() {
  router.push({ name: 'addDocument' });
}

async function openQrScan() {
  try {
    await scanQrCode();
  } catch (e) {
    console.error(e);
  }
}

const preparedDocuments = computed(() => {
  if (documents.value) {
    let res = documents.value.map((doc) => ({
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
    if (activeRouteId.value === 'favorites') {
      res = res.filter((doc) => doc.isFavorite);
    } else if (activeRouteId.value === 'hasExpired') {
      res = res.filter((doc) => doc.hasExpired);
    }

    res.sort((a, b) => {
      const aPid = getDocType(a?.preparedItem?.docType) === 'pid';
      const bPid = getDocType(b?.preparedItem?.docType) === 'pid';
      if (aPid === bPid) {
        return 0;
      }
      return aPid ? -1 : 1;
    });
    return res;
  }
  return [];
});

async function fetchDocuments() {
  loading.value = true;
  try {
    const res = await getDocuments();
    checkForExpiredDocs(res.documents);
    documents.value = res.documents;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
}

async function initDashboard() {
  await fetchDocuments();

  const routeId = route.params.id;
  const willSelect = routeId && routeId !== 'favorites' && routeId !== 'hasExpired';

  if (willSelect) {
    const selected = preparedDocuments.value.find((doc) => doc?.id === routeId);
    selectedCardId.value = routeId;
    selectedCard.value = selected?.preparedItem ?? null;
    favorite.value = selectedCard.value?.isFavorite;
    showFullCard.value = true;
    isPlaceholderCard.value = !selected || !selected.preparedItem;
  }

  initialLoadComplete.value = true;
}

const hasESign = computed(() =>
  documents.value.some((doc) => getDocType(doc.meta.documentIdentifier) === 'esign')
);

async function setShellName() {
  try {
    const res = await getState();
    if (res?.fullName)
      userStore.user = {
        firstName: res?.fullName?.split(' ')[0],
        lastName: res?.fullName?.split(' ')[1],
      };
  } catch (e) {
    console.error(e);
  }
}

function resetCard() {
  docViewRef.value?.scrollTo({ top: 0, behavior: 'instant' });
  showFullCard.value = false;
  selectedCard.value = null;
  selectedCardId.value = null;
  isPlaceholderCard.value = false;
}

function updateCardDetails(card) {
  docDetails.value = getCardDetails(card);
  docImage.value = getCardImage(card);
  const allDetails = card?.documentDetails || [];
  const requiredKeys = docDetails.value.map((d) => d.identifier);
  cardDetails.value = allDetails.filter((d) => !requiredKeys.includes(d.identifier));
}

async function startTransition(id) {
  const selected = preparedDocuments?.value.find((doc) => doc?.id === id) || null;
  await router.push({ name: 'dashboard', params: { id } });

  selectedCardId.value = id;
  selectedCard.value = selected?.preparedItem;

  favorite.value = selectedCard.value?.isFavorite;

  setTimeout(
    () => {
      showFullCard.value = true;
    },
    animationsReduced.value ? 0 : transitionTime.value
  );

  isPlaceholderCard.value = !selected || !selected.preparedItem;
  window.scrollTo({ top: 0, behavior: 'auto' });

  setTimeout(
    () => {
      isTransitioning.value = false;
    },
    animationsReduced.value ? 0 : cardClickTimeout.value
  );
}

async function reverseTransition() {
  if (!selectedCard.value && !isPlaceholderCard.value) return;
  goToDashboard();
  resetCard();
  setTimeout(
    () => {
      isTransitioning.value = false;
    },
    animationsReduced.value ? 0 : cardClickTimeout.value
  );
}

async function handleCardClick(id) {
  if (isTransitioning.value) return;
  isTransitioning.value = true;
  if (id === 'sign-card') {
    router.push({
      name: 'sign',
      params: { filePath: 'null', type: 'null' },
      query: { fromNav: 'true' },
    });
    return;
  }

  if (selectedCardId.value === id && (selectedCard.value || isPlaceholderCard.value)) {
    reverseTransition();
    return;
  }
  startTransition(id);
}

const handleNativeBack = () => {
  if (selectedCardId.value || isPlaceholderCard.value) {
    handleCardClick(selectedCardId.value);
  } else {
    goToDashboard();
  }
};

watch(
  () => selectedCard.value,
  (newVal) => {
    if (!newVal) {
      docDetails.value = [];
      docImage.value = null;
      cardDetails.value = [];
      return;
    }

    updateCardDetails(newVal);
  },
  { immediate: true }
);

watch(
  () => route.params.id,
  (newId) => {
    if (!newId || newId === 'favorites' || newId === 'all' || newId === 'hasExpired') {
      activeRouteId.value = newId;
      if (selectedCard.value) resetCard();
    }
  }
);

watch(
  () => userStore.language?.id,
  async (newLang, oldLang) => {
    if (!newLang || newLang === oldLang) return;
    try {
      await setLanguage(newLang);
      await fetchDocuments();

      const routeId = route.params.id;
      if (routeId && routeId !== 'favorites' && routeId !== 'hasExpired') {
        const selected = preparedDocuments.value.find((doc) => doc?.id === routeId);
        if (selected) {
          selectedCard.value = selected.preparedItem;
          favorite.value = selectedCard.value?.isFavorite;
          selectedCardId.value = routeId;
          showFullCard.value = true;

          updateCardDetails(selectedCard.value);
        }
      }
    } catch (e) {
      console.error(e);
      userStore.setLanguage(oldLang);
    }
  },
  { immediate: true }
);

const docType = computed(() =>
  selectedCard?.value?.docType ? getDocType(selectedCard?.value.docType) : null
);

const docName = computed(() => {
  if (selectedCard?.value?.docName && docType?.value !== 'pid') {
    return selectedCard?.value.docName;
  }
  if (docType?.value) {
    return t.t(`cards.names.${docType.value.toLowerCase()}`);
  }
  return '';
});

function stringToArray(str) {
  return str?.split(',')?.map((item) => item?.trim());
}

async function getDocumentTransactions(id) {
  router.push({ name: 'usageHistory', params: { id } });
}

async function changeFavorite() {
  loadingFavorite.value = true;
  try {
    const isFavorite = !favorite.value;
    await setDocumentFavorite(selectedCard?.value?.docId, isFavorite);

    const doc = documents.value.find((d) => d.meta.id === selectedCard.value.docId);
    if (doc) doc.meta.isFavorite = isFavorite;

    favorite.value = isFavorite;

    notification.pushSuccess(
      favorite.value ? t.t('pages.document.addedFavorite') : t.t('pages.document.removedFavorite')
    );

    if (!isFavorite && activeRouteId.value === 'favorites') {
      reverseTransition();
    }
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loadingFavorite.value = false;
}

async function deleteItem(item) {
  try {
    const data = await deleteDocument(item);
    if (data?.status === 'all_deleted') {
      await fetchDocuments();
    } else {
      documents.value = documents.value.filter((doc) => doc.meta.id !== selectedCard.value.docId);
    }
    notification.pushSuccess(t.t('pages.document.deleted'));

    resetCard();

    goToDashboard();
  } catch (e) {
    console.error(e);
    notification.pushError(t.t('pages.document.notDeleted'));
  }
}

function deleteCheck(item) {
  confirmStore.pushObject({
    title: t.t('pages.document.confirmTitle'),
    message: t.t('pages.document.confirmDelete'),
    primaryLabel: t.t('pages.document.yes'),
    secondaryLabel: t.t('pages.document.no'),
    primaryCallback: () => deleteItem(item),
    secondaryCallback: confirmStore.confirm,
    id: 'dashboard-delete-document-confirm-modal',
  });
}

onMounted(async () => {
  window.addEventListener('lx-native-back', handleNativeBack);

  lx.value = document.querySelector('.lx');
  if (lx.value) {
    animationsReduced.value = lx.value.classList.contains('lx-no-animations');
  }
  useMutationObserver(
    () => lx.value,
    () => {
      if (!lx.value) return;
      animationsReduced.value = lx.value.classList.contains('lx-no-animations');
    },
    { attributes: true }
  );

  viewStore.navBar = true;
  viewStore.header = true;

  const routeId = route.params.id;

  if (routeId === 'favorites' || routeId === 'hasExpired') {
    viewStore.lastDashboardFilter = routeId;
  }

  await initDashboard();
  await setShellName();

  if (routeId && routeId !== 'favorites' && routeId !== 'hasExpired') {
    const selected = preparedDocuments.value.find((doc) => doc?.id === routeId);
    if (selected) {
      isTransitioning.value = true;
      await startTransition(routeId);
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', handleNativeBack);
});

window.addEventListener('beforeunload', () => {
  sessionStorage.setItem('isReloading', 'true');
});

window.addEventListener('load', () => {
  if (sessionStorage.getItem('isReloading') === 'true') {
    sessionStorage.removeItem('isReloading');
    goToDashboard();
  }
});

const cardHeightCoefficient = computed(() => {
  if (!cardHeight.value) return 1;
  const scaledHeight = cardHeight.value * 0.275;
  return cardHeight.value / scaledHeight;
});
</script>

<template>
  <div
    id="dashboard-wrapper"
    class="dashboard"
    :class="{
      'is-transitioning': isTransitioning,
    }"
    :style="{
      '--card-height': `${cardHeight}px`,
      '--card-height-coefficient': `${cardHeightCoefficient}`,
    }"
  >
    <LxButton
      v-if="documents.length > 0 && !selectedCard"
      id="dashboard-add-document-button"
      kind="secondary"
      variant="icon-only"
      icon="add"
      :label="t.t('pages.dashboard.addDocument')"
      @click="addDocument"
    />
    <LxButton
      v-if="documents.length > 0 && !selectedCard"
      id="dashboard-favorite-documents-button"
      kind="secondary"
      variant="icon-only"
      icon="folder"
      :label="
        route.params.id
          ? route.params.id === 'all'
            ? t.t('pages.dashboard.allDocuments')
            : t.t('pages.dashboard.expiredDocuments')
          : t.t('pages.dashboard.favoriteDocuments')
      "
      @click="router.push({ name: 'dashboardMenu', params: { id: route.params.id } })"
    />
    <LxButton
      v-if="showFullCard && (selectedCard || isPlaceholderCard)"
      id="dashboard-go-home-button"
      kind="ghost"
      variant="icon-only"
      icon="close"
      @click="handleCardClick(selectedCardId)"
      :label="t.t('pages.dashboard.goHome')"
    />
    <CardList
      v-if="initialLoadComplete && preparedDocuments && preparedDocuments.length > 0"
      id="dashboard-card-list"
      ref="cardListRef"
      :selectedCard="selectedCard"
      :items="preparedDocuments"
      :loading="loading"
      :animationsReduced="animationsReduced"
      :hasESign="hasESign"
      @cardClick="handleCardClick"
    />
    <div
      id="dashboard-onboarding-options"
      class="onboarding-options"
      v-if="initialLoadComplete && documents.length === 0 && !loading"
    >
      <LxTile
        id="dashboard-onboarding-add-identity-tile"
        icon="add-user"
        :label="t.t('pages.onboarding.options.addIdentity')"
        :to="{ name: 'onboarding' }"
      />
      <LxTile
        id="dashboard-onboarding-sign-tile"
        icon="sign"
        :label="t.t('pages.onboarding.options.sign')"
        :to="{
          name: 'sign',
          params: { filePath: 'null', type: 'null' },
          query: { fromNav: 'true' },
        }"
      />
    </div>
    <TransitionGroup name="fade">
      <template v-if="selectedCard && !isPlaceholderCard">
        <div id="dashboard-document-view-background" class="document-view-background"></div>
        <div id="dashboard-document-view" class="document-view" ref="docViewRef">
          <div
            v-if="selectedCard?.hasExpired"
            id="dashboard-expired-block-wrapper"
            class="expired-block-wrapper"
          >
            <LxInfoBox
              id="dashboard-expired-info-box"
              :label="t.t('pages.documentPresentation.expiredLabel')"
              :description="t.t('pages.documentPresentation.expiredDescription')"
              variant="warning"
            />
            <!--TODO: add renewal function -->
            <LxButton
              id="dashboard-renew-document-button"
              :label="t.t('pages.documentPresentation.renew')"
              icon="refresh"
              :href="{ name: 'addDocument' }"
            />
          </div>
          <div class="presentation-button-wrapper" v-else>
            <LxButton
              v-if="
                selectedCard?.docType !== 'eu.digimaks.eseal' &&
                selectedCard?.docType !== 'eu.digimaks.esign'
              "
              id="dashboard-show-document-button"
              :label="t.t('pages.documentPresentation.showDocument')"
              icon="qr"
              :disabled="loading"
              @click="scanQrCode(selectedCard.docId)"
            />
            <LxButton
              v-else
              id="dashboard-seal-or-sign-button"
              :label="
                selectedCard?.docType === 'eu.digimaks.eseal'
                  ? t.t('pages.document.seal')
                  : t.t('pages.document.sign')
              "
              :icon="selectedCard?.docType === 'eu.digimaks.eseal' ? 'seal' : 'sign'"
              :href="{
                name: 'sign',
                params: {
                  filePath: 'null',
                  id: selectedCard?.docId,
                  type: selectedCard?.docType === 'eu.digimaks.eseal' ? 'seal' : 'sign',
                },
              }"
            />
          </div>
          <LxForm
            id="dashboard-document-form"
            kind="compact"
            :show-footer="false"
            :show-header="false"
            :column-count="1"
          >
            <hr v-if="docImage && docImage?.length > 0" class="custom-card-detail-divider" />
            <LxRow
              id="dashboard-document-image-row"
              :label="t.t('pages.document.image')"
              v-if="docImage"
            >
              <div class="document-view-image-wrapper">
                <img
                  :src="`data:image/png;base64,${docImage}`"
                  :alt="t.t('pages.document.image')"
                />
              </div>
            </LxRow>
            <LxRow
              :id="`dashboard-document-detail-${detail.identifier}`"
              :label="detail.label"
              v-for="detail in docDetails"
              v-bind:key="detail.identifier"
              :column-span="1"
            >
              <p
                class="lx-data"
                v-if="detail.value === null || detail.value === '' || detail.value === undefined"
              >
                —
              </p>
              <p class="lx-data" v-else-if="getDataType(detail.identifier) === 'date'">
                {{ detail.value }}
              </p>
              <p
                class="lx-data flag-display lx-aligned-row-inverse lx-aligned-row-5"
                v-else-if="getDataType(detail.identifier) === 'country'"
              >
                <LxFlag
                  :id="`dashboard-document-detail-${detail.identifier}-flag`"
                  :value="detail.value"
                />
                <span>{{ t.t(`cards.countries.${detail.value}`) }}</span>
              </p>
              <div class="array-wrapper" v-else-if="getDataType(detail.identifier) === 'array'">
                <div class="array-item" v-for="val in stringToArray(detail.value)" v-bind:key="val">
                  {{ val }}
                </div>
              </div>
              <p class="lx-data" v-else-if="getDataType(detail.identifier) === 'boolean'">
                {{
                  t.te(`pages.document.${detail.value}`)
                    ? t.t(`pages.document.${detail.value}`)
                    : detail.value
                }}
              </p>
              <p class="lx-data" v-else-if="getDataType(detail.identifier) === 'exception'">
                {{ t.t('pages.document.shownAbove') }}
              </p>
              <p class="lx-data" v-else>{{ detail.value }}</p>
            </LxRow>
            <hr class="custom-card-detail-divider" />
            <LxRow
              v-for="detail in cardDetails"
              :id="`dashboard-card-detail-${detail.identifier}`"
              :label="detail.label"
              v-bind:key="detail.identifier"
              :column-span="1"
            >
              <p
                class="lx-data"
                v-if="detail.value === null || detail.value === '' || detail.value === undefined"
              >
                —
              </p>
              <p class="lx-data" v-else-if="getDataType(detail.identifier) === 'date'">
                {{ detail.value }}
              </p>
              <p
                class="lx-data flag-display lx-aligned-row lx-aligned-row-inverse lx-aligned-row-5"
                v-else-if="getDataType(detail.identifier) === 'country'"
              >
                <LxFlag
                  :id="`dashboard-card-detail-${detail.identifier}-flag`"
                  :value="detail.value"
                />
                <span>{{ t.t(`cards.countries.${detail.value}`) }}</span>
              </p>
              <div class="array-wrapper" v-else-if="getDataType(detail.identifier) === 'array'">
                <div class="array-item" v-for="val in stringToArray(detail.value)" v-bind:key="val">
                  {{ val }}
                </div>
              </div>
              <p class="lx-data" v-else-if="getDataType(detail.identifier) === 'boolean'">
                {{
                  t.te(`pages.document.${detail.value}`)
                    ? t.t(`pages.document.${detail.value}`)
                    : detail.value
                }}
              </p>
              <p class="lx-data" v-else-if="getDataType(detail.identifier) === 'exception'">
                {{ t.t('pages.document.shownAbove') }}
              </p>
              <p class="lx-data" v-else>{{ detail.value }}</p>
            </LxRow>
            <LxRow
              v-if="docName"
              id="dashboard-document-name-row"
              :label="t.t('pages.document.documentName')"
              :column-span="1"
            >
              <p class="lx-data">{{ docName }}</p>
            </LxRow>
            <hr class="custom-card-detail-divider last" />
          </LxForm>
          <div id="dashboard-document-actions" class="lx-button-set">
            <LxButton
              id="dashboard-toggle-favorite-button"
              :label="
                favorite ? t.t('pages.document.removeFavorite') : t.t('pages.document.addFavorite')
              "
              :icon="favorite ? 'favorite-remove' : 'favorite-add'"
              kind="ghost"
              :busy="loadingFavorite"
              :disabled="loading"
              @click="changeFavorite"
            />
            <LxButton
              id="dashboard-usage-history-button"
              icon="history"
              kind="ghost"
              :label="t.t('pages.document.usageHistory')"
              :disabled="loading"
              @click="getDocumentTransactions(selectedCard?.docId)"
            />
            <LxButton
              id="dashboard-delete-document-button"
              icon="delete"
              kind="ghost"
              :label="t.t('pages.document.remove')"
              :busy="loadingDelete"
              :destructive="true"
              :disabled="loading"
              @click="deleteCheck(selectedCard?.docId)"
            />
          </div>
        </div>
      </template>
      <div id="dashboard-fab" class="fab" v-if="documents.length > 0 && !selectedCard" key="fab">
        <LxButton
          id="dashboard-scan-qr-button"
          :label="t.t('pages.dashboard.scanQr')"
          kind="primary"
          icon="qr"
          @click="openQrScan"
        />
      </div>
    </TransitionGroup>
  </div>
</template>
