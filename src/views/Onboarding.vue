<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  submitPhone,
  verifyPhone,
  submitEmail,
  verifyEmail,
  authenticate,
  initiateSmartId,
  getUserName,
} from '@/services/onboardingService';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import {
  LxTextInput,
  LxButton,
  LxToggle,
  LxList,
  LxLoaderView,
  LxModal,
  lxStringUtils,
} from '@dativa-lv/lx-ui';
import useNotifyStore from '@/stores/useNotifyStore';
import useConfirmStore from '@/stores/useConfirmStore';
import { enableBiometrics, getBiometricAvailability } from '@/services/settingsService';
import { useI18n } from 'vue-i18n';
import { APP_CONFIG } from '@/constants';
import useViewStore from '@/stores/useViewStore';
import { getState } from '@/services/appService';
import { useUserStore } from '@/stores/useUserStore';
import { scanQrCode } from '@/services/issuanceService';
import ResendCode from '@/components/ResendCode.vue';

const COUNTDOWN_TIME = 60;

const t = useI18n();
const router = useRouter();
const route = useRoute();
const notification = useNotifyStore();
const confirmStore = useConfirmStore();
const viewStore = useViewStore();
const userStore = useUserStore();

const phoneNumber = ref('');
const phoneCode = ref('');
const email = ref('');
const emailCode = ref('');

const agreePhone = ref(false);
const agreeEmail = ref(false);

const loading = ref(false);
const resendLoading = ref(false);

const phoneHidden = computed(
  () => `${phoneNumber.value?.substring(0, 2)}****${phoneNumber.value?.substring(6, 8)}`
);

const emailHidden = computed(() => {
  const [localPart, domain] = email.value.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  return `${firstChar}****${lastChar}@${domain}`;
});

function routeTo(value) {
  router.push({ name: 'onboarding', params: { step: value } });
}

const userName = ref(null);

async function fetchUserName() {
  const res = await getUserName();
  userName.value = res.firstName;
}

const hideBiometrics = ref(true);
const biometricOptions = ref();

async function getBiometricOptions() {
  try {
    const res = await getBiometricAvailability();
    hideBiometrics.value = true;
    biometricOptions.value = res?.type;
  } catch (e) {
    console.error(e);
    hideBiometrics.value = false;
  }
}

function pickBiometricIcon(biometrics) {
  if (biometrics === 'faceId') {
    return 'face-id';
  }
  if (biometrics === 'touchId') {
    return 'touch-id';
  }
  return 'biometrics';
}

function pickBiometricLabel(biometrics) {
  if (biometrics === 'faceId') {
    return t.t('pages.onboarding.biometrics.faceIdButton');
  }
  if (biometrics === 'touchId') {
    return t.t('pages.onboarding.biometrics.touchIdButton');
  }
  return t.t('pages.onboarding.biometrics.biometricsButton');
}

const timeLeft = ref(60);
const timer = ref(null);
const isRunning = ref(false);

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60);
  const seconds = timeLeft.value % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
});

function startTimer() {
  if (timer.value) clearInterval(timer.value); // Reset timer if running

  timeLeft.value = COUNTDOWN_TIME;
  isRunning.value = true;

  timer.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value -= 1;
    } else {
      clearInterval(timer.value);
      isRunning.value = false;
    }
  }, 1000);
}

const invalidPhone = ref(false);
const invalidEmail = ref(false);

function validateNumber(number) {
  if (number.startsWith('+371')) {
    return number.length === 12;
  }
  if (number.startsWith('00')) {
    return number.length === 13;
  }
  return true;
}

async function sendNumber(number) {
  if (!validateNumber(number)) {
    notification.pushError(t.t('pages.onboarding.phone.invalidPhone'));
    invalidPhone.value = true;
    return;
  }
  invalidPhone.value = false;
  loading.value = true;
  let data = number;
  if (!data.startsWith('+371') && !data.startsWith('00')) {
    data = `+371${data}`;
  }
  try {
    await submitPhone(data);
    routeTo('2');
    // start 'send again' timer
    startTimer();
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
}

async function resendNumber(number) {
  resendLoading.value = true;
  let data = number;
  if (!data.startsWith('+371') && !data.startsWith('00')) {
    data = `+371${data}`;
  }
  try {
    await submitPhone(data);
    startTimer();
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  resendLoading.value = false;
  notification.pushSuccess(t.t('pages.onboarding.phoneValidation.sentAgain'));
}

const phoneLength = computed(() => {
  if (phoneNumber.value.startsWith('+371')) {
    return 12;
  }
  if (phoneNumber.value.startsWith('00371')) {
    return 13;
  }
  return null;
});

async function confirmNumber(code) {
  loading.value = true;
  try {
    await verifyPhone(code);
    notification.pushSuccess(t.t('pages.onboarding.phoneValidation.confirmed'));
    routeTo('3');
  } catch (e) {
    console.error(e);
    if (e === 'toomanyattempts') {
      notification.pushError(t.t('errors.toomanyattempts'));
      routeTo('1');
      phoneNumber.value = '';
    } else {
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    }
    phoneCode.value = '';
  }
  loading.value = false;
}

async function sendEmail(emailValue) {
  if (!lxStringUtils.isEmail(emailValue)) {
    notification.pushError(t.t('pages.onboarding.email.invalidEmail'));
    invalidEmail.value = true;
    return;
  }
  invalidEmail.value = false;
  loading.value = true;
  try {
    await submitEmail(emailValue);
    routeTo('4');
    // start 'send again' timer
    startTimer();
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
}

async function resendEmail(emailValue) {
  resendLoading.value = true;
  try {
    await submitEmail(emailValue);
    // start 'send again' timer
    startTimer();
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  resendLoading.value = false;

  notification.pushSuccess(t.t('pages.onboarding.emailValidation.sentAgain'));
}

async function confirmEmail(code) {
  loading.value = true;
  try {
    await verifyEmail(code);
    notification.pushSuccess(t.t('pages.onboarding.emailValidation.confirmed'));
    router.replace({ name: 'loading' });
    // await fetchUserName();
    // routeTo('5');
  } catch (e) {
    console.error(e);
    if (e === 'toomanyattempts') {
      notification.pushError(t.t('errors.toomanyattempts'));
      routeTo('3');
      email.value = '';
    } else {
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    }
    emailCode.value = '';
  }
  loading.value = false;
}

const listLoading = ref(false);

async function authAction(action, id) {
  listLoading.value = true;
  if (action === 'click' && id === 'mobile') {
    try {
      await authenticate();
      // TODO: FOR WEB DEVELOPMENT ONLY!!!
      if (!APP_CONFIG.embed) routeTo('1');
    } catch (e) {
      console.error(e);
    }
  } else if (action === 'click' && id === 'qr') {
    try {
      await scanQrCode();
      // TODO: FOR WEB DEVELOPMENT ONLY!!!
      if (!APP_CONFIG.embed) routeTo('1');
    } catch (e) {
      console.error(e);
    }
  } else if (action === 'click' && id === 'smart-id') {
    try {
      await initiateSmartId();
      // TODO: FOR WEB DEVELOPMENT ONLY!!!
      if (!APP_CONFIG.embed) routeTo('1');
    } catch (e) {
      console.error(e);
    }
  }
  listLoading.value = false;
}

async function approveBiometrics() {
  try {
    await enableBiometrics(true);
    notification.pushSuccess(t.t('pages.onboarding.biometrics.biometricsAdded'));
    hideBiometrics.value = false;
  } catch (e) {
    console.error(e);
    notification.pushError(t.t('pages.onboarding.biometrics.biometricsError'));
  }
}

function getConfirmLabel(biometrics) {
  if (biometrics === 'faceId') {
    return `${t.t(
      'pages.onboarding.biometrics.description'
    )}  ${t.t('pages.onboarding.biometrics.faceId')} ?`;
  }
  if (biometrics === 'touchId') {
    return `${t.t(
      'pages.onboarding.biometrics.description'
    )}  ${t.t('pages.onboarding.biometrics.touchId')} ?`;
  }
  return `${t.t(
    'pages.onboarding.biometrics.description'
  )}  ${t.t('pages.onboarding.biometrics.biometrics')} ?`;
}

function addBiometrics(biometrics) {
  confirmStore.pushObject({
    title: t.t('pages.onboarding.biometrics.title'),
    message: getConfirmLabel(biometrics),
    primaryLabel: t.t('pages.onboarding.biometrics.yes'),
    secondaryLabel: t.t('pages.onboarding.biometrics.no'),
    primaryCallback: () => approveBiometrics(),
    secondaryCallback: confirmStore.confirm,
    id: 'onboarding-biometrics-confirm-modal',
  });
}

const allowNavigation = ref(false);

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'dashboard' && !allowNavigation.value) {
    confirmStore.pushObject({
      title: t.t('pages.onboarding.confirm.canceling'),
      message: t.t('pages.onboarding.confirm.cancelingDescription'),
      primaryLabel: t.t('pages.onboarding.confirm.yes'),
      secondaryLabel: t.t('pages.onboarding.confirm.no'),
      primaryCallback: () => next(),
      secondaryCallback: () => {
        confirmStore.confirm();
        next(false);
      },
      id: 'onboarding-cancel-confirm-modal',
    });
  } else {
    next();
  }
  allowNavigation.value = false;
});

const privacyModal = ref();

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'privacyPolicy') privacyModal.value?.open();
  else next();
});

async function setShellName() {
  try {
    const res = await getState();
    userStore.user = {
      firstName: res?.fullName?.split(' ')[0],
      lastName: res?.fullName?.split(' ')[1],
    };
  } catch (e) {
    console.error(e);
  }
}

watch(
  () => [route.name, route.params.step],
  (newValue) => {
    if (newValue[1] === '5') {
      fetchUserName();
      getBiometricOptions();
      setShellName();
    } else if (newValue[1] === '2' || newValue[1] === '4') {
      startTimer();
    }
  }
);

onMounted(() => {
  if (route.params.step === '5') {
    fetchUserName();
    getBiometricOptions();
    setShellName();
  } else if (route.params.step === '2' || route.params.step === '4') {
    startTimer();
  }
  viewStore.navBar = false;
  viewStore.header = false;
});
</script>

<template>
  <div class="page-wrapper">
    <div id="onboarding-onboarding-page" class="page onboarding">
      <LxLoaderView
        id="onboarding-loader"
        :loading="listLoading"
        :label="t.t('general.loading.generic')"
      >
        <div id="onboarding-header-row" class="close-button-wrapper">
          <p>{{ t.t('pages.onboarding.description') }}</p>
          <LxButton
            id="onboarding-close-button"
            icon="close"
            kind="ghost"
            variant="icon-only"
            :label="t.t('pages.documentAdd.close')"
            @click="() => router.push({ name: 'dashboard' })"
          />
        </div>
        <div v-if="!route.params.step" id="onboarding-auth-section" class="onboarding-auth">
          <!-- TODO: Add custom list with colorful icons -->
          <template v-if="!listLoading">
            <p>{{ t.t('pages.onboarding.start') }}:</p>
            <LxList
              id="onboarding-auth-method-list"
              :items="[
                {
                  id: 'mobile',
                  name: 'eParaksts mobile',
                  icon: 'eparaksts-mobile',
                  iconSet: 'brand',
                  clickable: true,
                },
                {
                  id: 'smart-id',
                  name: t.t('pages.documentAdd.smartId'),
                  icon: 'smartid',
                  iconSet: 'brand',
                  clickable: true,
                },
                {
                  id: 'qr',
                  name: t.t('pages.documentAdd.scanQr'),
                  icon: 'qr',
                  clickable: true,
                },
              ]"
              @actionClick="authAction"
              list-type="1"
            />
          </template>
        </div>
        <div
          v-if="route.params.step === '1'"
          id="onboarding-phone-section"
          class="onboarding-input"
        >
          <b>
            <p>{{ t.t('pages.onboarding.phone.title') }}</p>
          </b>
          <p>
            {{ t.t('pages.onboarding.phone.description') }}
          </p>

          <LxTextInput
            id="onboarding-phone-input"
            v-model="phoneNumber"
            :disabled="loading"
            kind="phone"
            :maxlength="phoneLength"
            :invalid="invalidPhone"
            :invalidation-message="t.t('pages.onboarding.phone.invalidPhone')"
          />
          <div id="onboarding-phone-agreement-row" class="confirmation-wrapper">
            <LxToggle
              id="onboarding-phone-agreement-toggle"
              v-model="agreePhone"
              :disabled="loading"
            >
              <template #default
                >{{ t.t('pages.onboarding.phone.agreement') }}
                <RouterLink
                  id="onboarding-phone-privacy-policy-link"
                  :to="{ name: 'privacyPolicy' }"
                >
                  {{ t.t('pages.privacyPolicy.title') }}
                </RouterLink></template
              >
            </LxToggle>
          </div>

          <LxButton
            id="onboarding-phone-submit-button"
            :label="t.t('pages.onboarding.phone.useThisNumber')"
            icon="next"
            :disabled="!agreePhone || phoneNumber.length === 0"
            :busy="loading"
            @click="sendNumber(phoneNumber)"
          />
        </div>
        <div
          v-else-if="route.params.step === '2'"
          id="onboarding-phone-confirm-section"
          class="onboarding-confirmation"
        >
          <b>
            <p>{{ t.t('pages.onboarding.phoneValidation.title') }} {{ phoneHidden }}</p>
          </b>

          <p>{{ t.t('pages.onboarding.phoneValidation.description') }}</p>
          <LxTextInput
            id="onboarding-phone-code-input"
            v-model="phoneCode"
            :disabled="loading"
            :maxlength="6"
            mask="numeric"
            autocomplete="one-time-code"
          />
          <div class="onboarding-button-wrapper">
            <LxButton
              id="onboarding-phone-confirm-button"
              :label="t.t('pages.onboarding.phoneValidation.confirm')"
              icon="next"
              @click="confirmNumber(phoneCode)"
              :busy="loading"
              :disabled="phoneCode.length !== 6 || resendLoading"
            />
          </div>
          <ResendCode
            id="onboarding-phone-resend-code"
            :time-left="timeLeft"
            :formatted-time="formattedTime"
            :loading="resendLoading"
            :disabled="loading"
            @click="resendNumber(phoneNumber)"
          />
        </div>
        <div
          v-else-if="route.params.step === '3'"
          id="onboarding-email-section"
          class="onboarding-input"
        >
          <b>
            <p>{{ t.t('pages.onboarding.email.title') }}</p>
          </b>

          <p>
            {{ t.t('pages.onboarding.email.description') }}
          </p>

          <LxTextInput
            id="onboarding-email-input"
            v-model="email"
            :disabled="loading"
            mask="email"
            :invalid="invalidEmail"
            :invalidation-message="t.t('pages.onboarding.email.invalidEmail')"
          />
          <div id="onboarding-email-agreement-row" class="confirmation-wrapper">
            <LxToggle
              id="onboarding-email-agreement-toggle"
              v-model="agreeEmail"
              :disabled="loading"
            >
              <template #default>
                {{ t.t('pages.onboarding.email.agreement') }}
                <RouterLink
                  id="onboarding-email-privacy-policy-link"
                  :to="{ name: 'privacyPolicy' }"
                >
                  {{ t.t('pages.privacyPolicy.title') }}
                </RouterLink>
              </template>
            </LxToggle>
          </div>

          <LxButton
            id="onboarding-email-submit-button"
            :label="t.t('pages.onboarding.email.useThisNumber')"
            icon="next"
            @click="sendEmail(email)"
            :disabled="!agreeEmail || email.length === 0"
            :busy="loading"
          />
        </div>
        <div
          v-else-if="route.params.step === '4'"
          id="onboarding-email-confirm-section"
          class="onboarding-confirmation"
        >
          <b>
            <p>{{ t.t('pages.onboarding.emailValidation.title') }} {{ emailHidden }}</p>
          </b>

          <p>{{ t.t('pages.onboarding.emailValidation.description') }}</p>

          <LxTextInput
            id="onboarding-email-code-input"
            v-model="emailCode"
            :disabled="loading"
            :maxlength="6"
            mask="numeric"
          />
          <div class="onboarding-button-wrapper">
            <LxButton
              id="onboarding-email-confirm-button"
              :label="t.t('pages.onboarding.emailValidation.confirm')"
              icon="next"
              :busy="loading"
              :disabled="emailCode.length !== 6 || resendLoading"
              @click="confirmEmail(emailCode)"
            />
          </div>

          <ResendCode
            id="onboarding-email-resend-code"
            :time-left="timeLeft"
            :formatted-time="formattedTime"
            :loading="resendLoading"
            :disabled="loading"
            @click="resendEmail(email)"
          />
        </div>
        <div
          v-else-if="route.params.step === '5'"
          id="onboarding-greeting-section"
          class="onboarding-greeting"
        >
          <div class="image-wrapper">
            <img src="@/assets/wallet_logo.png" />
          </div>
          <p class="highlight-text">{{ t.t('pages.onboarding.greeting.hi') }} {{ userName }}!</p>
          <p>{{ t.t('pages.onboarding.greeting.title') }}</p>
          <LxButton
            id="onboarding-greeting-begin-button"
            :label="t.t('pages.onboarding.greeting.begin')"
            icon="next"
            @click="() => ((allowNavigation = true), router.replace({ name: 'dashboard' }))"
          />
          <p v-if="hideBiometrics && biometricOptions !== 'exists'">
            {{ t.t('pages.onboarding.greeting.biometrics') }}
          </p>
          <LxButton
            v-if="hideBiometrics && biometricOptions !== 'exists'"
            id="onboarding-greeting-biometrics-button"
            :label="pickBiometricLabel(biometricOptions)"
            :icon="pickBiometricIcon(biometricOptions)"
            :iconSet="
              biometricOptions !== 'faceId' && biometricOptions !== 'touchId' ? 'phosphor' : 'brand'
            "
            kind="secondary"
            @click="addBiometrics(biometricOptions)"
          />
        </div>
      </LxLoaderView>
    </div>
    <LxModal
      id="onboarding-privacy-policy-modal"
      ref="privacyModal"
      :label="t.t('pages.privacyPolicy.title')"
    >
      {{ t.t('pages.privacyPolicy.text') }}
    </LxModal>
  </div>
</template>
