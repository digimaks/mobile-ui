<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { computed, ref, onMounted, onBeforeMount, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { LxShell } from '@dativa-lv/lx-ui';
import { invoke, until, useIdle, useIntervalFn } from '@vueuse/core';

import LoginView from '@/views/Login.vue';
import useErrors from '@/hooks/useErrors';
import useAuthStore from '@/stores/useAuthStore';
import useAppStore from '@/stores/useAppStore';
import useNotifyStore from '@/stores/useNotifyStore';
import useConfirmStore from '@/stores/useConfirmStore';
import useViewStore from '@/stores/useViewStore';
import { getState } from '@/services/appService';
import { useUserStore } from '@/stores/useUserStore';
import { settingsLinks } from '@/utils/navigationUtils';

const { lxVersion } = window.config;

const authStore = useAuthStore();
const notify = useNotifyStore();
const viewStore = useViewStore();
const errors = useErrors();
const router = useRouter();
const confirmStore = useConfirmStore();
const appStore = useAppStore();
const userStore = useUserStore();

const secondsToIdle = 10;
const secondsCheckApiInterval = 30;

const { idle } = useIdle(secondsToIdle * 1000);

const idleModalOpened = ref(false);

// ToDo: develop login & get session
// eslint-disable-next-line no-unused-vars

const translate = useI18n();
const route = useRoute();
const shellMode = computed(() => 'digimaks-lite');

const shell = ref();
const lx = ref(null);
const env = ref(null);
const hasReduceTransparency = ref(false);
const hasReduceMotion = ref(false);
const appVersion = ref('');
const scaleFactor = ref(null);

function dashboardRouteFromFilter() {
  const filter = viewStore.lastDashboardFilter;
  return {
    name: 'dashboard',
    params: filter === 'favorites' || filter === 'hasExpired' ? { id: filter } : { id: '' },
  };
}

const nav = computed(() => [
  {
    id: 'app-nav-home',
    label: translate.t('pages.dashboard.title'),
    icon: 'dashboard',
    to: dashboardRouteFromFilter(),
  },
  {
    id: 'app-nav-sign',
    label: translate.t('pages.sign.title'),
    icon: 'sign',
    to: { name: 'sign', params: { filePath: 'null', type: 'null' } },
  },
  {
    id: 'app-nav-usage-history',
    label: translate.t('pages.usageHistory.title'),
    icon: 'history',
    to: { name: 'usageHistory' },
    type: 'secondary',
  },
  {
    id: 'app-nav-delete-wallet',
    label: translate.t('pages.settings.deleteWallet'),
    icon: 'delete',
    to: { name: 'settings' },
    type: 'user-menu',
  },
  {
    id: 'app-nav-user-agreement',
    label: translate.t('pages.settings.userAgreement'),
    icon: 'open',
    link: settingsLinks?.userAgreement[userStore.language?.id],
    type: 'settings-menu-links',
  },
  {
    id: 'app-nav-privacy-policy',
    label: translate.t('pages.settings.privacyPolicy'),
    icon: 'open',
    link: settingsLinks?.privacyPolicy[userStore.language?.id],
    type: 'settings-menu-links',
  },
  {
    id: 'app-nav-version',
    label: translate.t('pages.settings.appVersion', { version: appVersion.value }),
    to: null,
    type: userStore.user ? 'user-menu' : 'settings-menu-links',
  },
  {
    id: 'lx-nav-version',
    label: translate.t('pages.settings.lxVersion', { version: lxVersion }),
    to: null,
    type: userStore.user ? 'user-menu' : 'settings-menu-links',
  },
]);

const systemName = computed(() => translate.t('title.shortName'));
const pageTitle = computed(() => {
  if (typeof router.currentRoute.value.meta.title === 'function') {
    return router.currentRoute.value.meta.title(translate);
  }
  return translate.t(String(router.currentRoute.value.meta.title));
});

const breadcrumbs = computed(() => {
  const ret = [];

  if (route.meta.breadcrumbs) {
    // @ts-ignore
    route.meta.breadcrumbs.forEach((item) => {
      ret.push({
        label: translate.t(item.text),
        to: item.to,
      });
    });
  }
  return ret;
});

const showBackButton = computed(() => breadcrumbs.value.length > 0);

const selectedNavItems = computed(() => {
  const ret = {};
  ret[router.currentRoute.value.name] = true;
  if (route.meta?.breadcrumbs) {
    // @ts-ignore
    route.meta?.breadcrumbs.forEach((item) => {
      ret[item.to?.name] = true;
    });
  }
  return ret;
});

function goBack(path) {
  if (path !== -1) {
    router.push(path);
  } else {
    router.back();
  }
}
function goHome(path) {
  router.push(path);
}

const systemIcon = ref('zz-lx');

const closeModal = () => {
  idleModalOpened.value = false;
};

const openModal = () => {
  idleModalOpened.value = true;
};

async function logout() {
  try {
    const resp = await authStore.logout();
    if (resp.status === 200 && resp.data) {
      window.location.href = resp.data;
    } else {
      notify.pushSuccess(translate.t('shell.notifications.logOut'));
    }
  } catch (err) {
    const error = errors.get(err);
    if (error.status !== 401 && error.data) {
      notify.pushError(error.data);
    }
  } finally {
    closeModal();
    router.push({ name: 'sessionEnded' });
  }
}

function primary() {
  logout();
  confirmStore.$state.isOpen = false;
}
function secondary() {
  confirmStore.$state.isOpen = false;
}

function openConfirmModal() {
  confirmStore.pushObject({
    title: translate.t('shell.logOutModal.title'),
    message: translate.t('shell.logOutModal.description'),
    primaryLabel: translate.t('shell.logOutModal.yes'),
    secondaryLabel: translate.t('shell.logOutModal.no'),
    primaryCallback: primary,
    secondaryCallback: secondary,
    id: 'app-log-out-confirm-modal',
  });
}

function confirmModalClose() {
  confirmStore.$state.isOpen = false;
}

async function getSession() {
  try {
    await authStore.fetchSession();
  } catch (err) {
    const error = errors.get(err);
    if (error.status === 401) {
      logout();
    } else if (error.data) {
      notify.pushError(error.data);
    }
  }
}

async function callKeepAlive() {
  try {
    await authStore.keepAlive();
  } catch (err) {
    const error = errors.get(err);
    if (error.status === 401) {
      logout();
    } else if (error.data) {
      notify.pushError(error.data);
    }
  }
}

const checkApiSession = () => {
  if (idle.value || idleModalOpened.value) {
    getSession();
  } else {
    callKeepAlive();
  }
};

useIntervalFn(() => {
  if (!authStore.session.active) {
    if (idleModalOpened.value) {
      closeModal();
      router.push({ name: 'sessionEnded' });
    }
    return;
  }
  if (authStore.session.secondsToLive < 1) {
    logout();
    closeModal();
    return;
  }
  if (authStore.session.secondsToLive < authStore.session.secondsToCountdown) {
    if (!idleModalOpened.value) {
      openModal();
    }
  } else if (idleModalOpened.value) {
    closeModal();
    return;
  }
  const refreshIntervals = authStore.session.secondsToLive % secondsCheckApiInterval === 0;
  const refreshBeforeWarn =
    authStore.session.secondsToLive - 3 < authStore.session.secondsToCountdown && !idle.value;
  const refreshBeforeLogout = authStore.session.secondsToLive === 3;
  if (refreshIntervals || refreshBeforeWarn || refreshBeforeLogout) {
    checkApiSession();
  }
  authStore.session.secondsToLive -= 1;
}, 1000);

async function continueSession() {
  try {
    await authStore.keepAlive();
    notify.pushSuccess(translate.t('shell.notifications.sessionContinued'));
  } catch (err) {
    notify.pushError(translate.t('shell.notifications.sessionContinuedFailed'));
    if (err.response.status === 401) {
      logout();
    }
  } finally {
    closeModal();
  }
}

invoke(async () => {
  // @ts-ignore
  await until(() => authStore.showSessionEndCountdown).toBe(true);
  notify.pushWarning(translate.t('shell.notifications.sessionEndingSoon'));
});

function idleModalPrimary() {
  continueSession();
}
function idleModalSecondary() {
  logout();
}

const shellTexts = computed(() => ({
  languagesTitle: translate.t('shell.languagesTitle'),
  userTitle: translate.t('shell.user'),
  settings: translate.t('shell.settings'),
  openNavbar: translate.t('shell.openNavbar'),
  close: translate.t('shell.close'),
  themeTitle: translate.t('shell.themeTitle'),
  animations: translate.t('shell.animations'),
  touchMode: translate.t('shell.touchMode'),
  transparency: translate.t('shell.transparency'),
  fonts: translate.t('shell.fonts'),
  reduceMotionOff: translate.t('shell.reduceMotionOff'),
  reduceMotionOn: translate.t('shell.reduceMotionOn'),
  systemFontsOff: translate.t('shell.systemFontsOff'),
  systemFontsOn: translate.t('shell.systemFontsOn'),
  touchModeOff: translate.t('shell.touchModeOff'),
  touchModeOn: translate.t('shell.touchModeOn'),
  reduceTransparencyOff: translate.t('shell.reduceTransparencyOff'),
  reduceTransparencyOn: translate.t('shell.reduceTransparencyOn'),
  themeAuto: translate.t('shell.themeAuto'),
  themeLight: translate.t('shell.themeLight'),
  themeDark: translate.t('shell.themeDark'),
  logOut: translate.t('shell.logOut'),
}));

const languages = computed(() => [
  { id: 'lv', name: translate.t('shell.languages.lv') },
  { id: 'en', name: translate.t('shell.languages.en') },
]);

function languageChange(language) {
  if (!language?.id || language?.id === userStore.language?.id) return;
  userStore.setLanguage(language.id);
  translate.locale.value = language.id;
}

const envMap = {
  dev: 'development',
  prod: 'production',
};

async function applyAppState() {
  try {
    const res = await getState();

    if (res?.env) env.value = envMap[res.env];
    if (res?.scaleFactor) scaleFactor.value = res.scaleFactor;
    if (res?.appVersion) appVersion.value = res.appVersion;

    const isIos = res.system === 'ios';
    hasReduceTransparency.value = isIos ? (res.ios?.reduceTransparency ?? false) : false;
    hasReduceMotion.value = res.reduceMotion ?? false;

    const language = res?.language || 'lv';
    userStore.language = { id: language };
    translate.locale.value = language;

    if (res?.fullName) {
      userStore.user = {
        firstName: res?.fullName?.split(' ')[0],
        lastName: res?.fullName?.split(' ')[1],
      };
    }

    if (res.system) viewStore.system = res.system;
  } catch (e) {
    console.error(e);
    userStore.language = { id: 'lv' };
    translate.locale.value = 'lv';
    if (e.code === 'attestation_certificate_invalid') {
      router.replace({ name: 'attestationInvalid' });
    }
  }
}

function onNativeStateChange(e) {
  const res = e.detail;
  if (res?.scaleFactor) scaleFactor.value = res.scaleFactor;
  if (res?.reduceMotion !== undefined) hasReduceMotion.value = res.reduceMotion;
  if (res?.reduceTransparency !== undefined) hasReduceTransparency.value = res.reduceTransparency;
}

function applyScale(factor) {
  if (!lx.value) return;
  lx.value.classList.remove('lx-tscale-100', 'lx-tscale-150', 'lx-tscale-200');
  let cls;
  if (!factor || factor < 1.5) {
    cls = 'lx-tscale-100';
  } else if (factor >= 2.0) {
    cls = 'lx-tscale-200';
  } else {
    cls = 'lx-tscale-150';
  }
  lx.value.classList.add(cls);
}

watch(scaleFactor, applyScale);

onMounted(() => {
  lx.value = document.querySelector('.lx');
  applyScale(scaleFactor.value);

  if (route.name === 'home') router.replace({ name: 'dashboard' });

  window.addEventListener('lx-native-back', () => {
    if (route.name === 'attestationInvalid') return;
    shell.value.closeEverything();
  });

  window.addEventListener('lx-native-state-change', onNativeStateChange);
});

onBeforeMount(async () => {
  userStore.language = { id: 'lv' };
  translate.locale.value = 'lv';

  await applyAppState();
});

onUnmounted(() => {
  window.removeEventListener('lx-native-state-change', onNativeStateChange);
});
</script>
<template>
  <div id="app-root">
    <div
      id="app-shell-wrapper"
      :class="[
        {
          'hide-user-nav': !userStore.user,
          'lx-prod': env === 'production',
        },
      ]"
    >
      <LxShell
        id="app-shell"
        ref="shell"
        :system-name="translate.t('title.fullName')"
        :system-subheader="translate.t('title.subheader')"
        :system-name-short="systemName"
        :user-info="userStore.user"
        :nav-items="nav"
        :nav-items-selected="selectedNavItems"
        :mode="shellMode"
        :page-label="pageTitle"
        :page-back-button-visible="showBackButton"
        :page-breadcrumbs="breadcrumbs"
        :page-index-path="{ name: 'dashboard' }"
        :system-icon="systemIcon"
        :has-cover-logo="false"
        :cover-image="null"
        :cover-image-dark="null"
        :cover-logo="null"
        :has-reduced-animations="hasReduceMotion"
        :has-reduced-transparency="hasReduceTransparency"
        :languages="languages"
        :has-language-picker="true"
        v-model:selectedLanguage="userStore.language"
        :navigating="appStore.$state.isNavigating || viewStore.blockNav"
        :showIdleModal="idleModalOpened"
        :secondsToLive="authStore.session.secondsToLive"
        :confirmDialogData="confirmStore"
        :confirmPrimaryButtonBusy="false"
        :confirmPrimaryButtonDestructive="true"
        v-model:notifications="notify.notifications"
        :hideNavBar="!viewStore.navBar"
        v-model:navBarSwitch="viewStore.navbarSwitch"
        :texts="shellTexts"
        :page-header-visible="viewStore.header"
        :has-theme-picker="false"
        :environment="{ environment: env }"
        @languageChange="languageChange"
        @confirmModalClose="confirmModalClose"
        @go-home="goHome"
        @go-back="goBack"
        @log-out="openConfirmModal"
        @idleModalPrimary="idleModalPrimary"
        @idleModalSecondary="idleModalSecondary"
      >
        <template #coverArea>
          <div id="app-login-cover-area" class="lx-button-set">
            <LoginView></LoginView>
          </div>
        </template>

        <template #logo>
          <svg
            id="app-logo"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 50 50"
          >
            <path
              d="M25,1.7C12.1,1.7,1.7,12.1,1.7,25c0,8.4,4.5,15.8,11.2,19.9L25,32.8l0,0l0,0l9.1,9.1c0,0,0,0,0,0l3,3
	c6.7-4.1,11.2-11.5,11.2-20C48.3,12.1,37.9,1.7,25,1.7z M12.6,39.6C8.4,36.1,5.8,30.8,5.8,25c0-3.3,0.8-6.3,2.3-9L22.1,30L12.6,39.6
	z M10.4,12.6c3.5-4.1,8.8-6.8,14.6-6.8c5.8,0,11.1,2.6,14.6,6.8L25,27.2L10.4,12.6z M37.4,39.6L27.8,30l14.1-14.1
	c1.5,2.7,2.3,5.8,2.3,9.1C44.2,30.9,41.5,36.1,37.4,39.6z"
            />
          </svg>
        </template>

        <template #logoSmall>
          <svg
            id="app-logo-small"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 50 50"
          >
            <path
              d="M25,1.7C12.1,1.7,1.7,12.1,1.7,25c0,8.4,4.5,15.8,11.2,19.9L25,32.8l0,0l0,0l9.1,9.1c0,0,0,0,0,0l3,3
	c6.7-4.1,11.2-11.5,11.2-20C48.3,12.1,37.9,1.7,25,1.7z M12.6,39.6C8.4,36.1,5.8,30.8,5.8,25c0-3.3,0.8-6.3,2.3-9L22.1,30L12.6,39.6
	z M10.4,12.6c3.5-4.1,8.8-6.8,14.6-6.8c5.8,0,11.1,2.6,14.6,6.8L25,27.2L10.4,12.6z M37.4,39.6L27.8,30l14.1-14.1
	c1.5,2.7,2.3,5.8,2.3,9.1C44.2,30.9,41.5,36.1,37.4,39.6z"
            />
          </svg>
        </template>
        <router-view />
      </LxShell>
    </div>
  </div>
</template>
