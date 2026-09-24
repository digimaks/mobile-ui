<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, ref, computed } from 'vue';
import useViewStore from '@/stores/useViewStore';
import { LxButton, LxDropDownMenu, LxLink, LxToggle } from '@dativa-lv/lx-ui';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/useUserStore';
import { useMutationObserver } from '@vueuse/core';
import { settingsLinks } from '@/utils/navigationUtils';
import { setLanguage } from '@/services/settingsService';

const t = useI18n();
const viewStore = useViewStore();
const router = useRouter();
const userStore = useUserStore();

const languages = [
  {
    id: 'lv',
    name: 'Latviešu',
  },
  {
    id: 'en',
    name: 'Angļu (English)',
  },
];

async function changeLanguage(language) {
  if (!language || language.id === userStore.language?.id) return;

  const oldLang = userStore.language?.id;
  try {
    await setLanguage(language.id);
    t.locale.value = language.id;
  } catch (e) {
    console.error(e);
    userStore.setLanguage(oldLang);
  }

  userStore.setLanguage(language.id);
}

const isDark = ref(false);
const lx = ref(null);
const userAgreementModel = ref(false);
const privacyPolicyModel = ref(false);

onMounted(async () => {
  viewStore.navBar = false;

  lx.value = document.querySelector('.lx');
  useMutationObserver(
    () => lx.value,
    () => {
      if (!lx.value) return;
      isDark.value = lx.value.classList.contains('lx-theme-dark');
    },
    { attributes: true }
  );
});

const canContinue = computed(() => userAgreementModel.value && privacyPolicyModel.value);
</script>
<template>
  <div class="page-wrapper activation-page">
    <LxDropDownMenu id="activation-language-menu">
      <LxButton
        id="activation-language-menu-button"
        customClass="lx-header-button"
        variant="icon-only"
        :label="t.t('shell.languagesTitle')"
        kind="ghost"
        icon="language"
      />

      <template #panel>
        <LxButton
          v-for="item in languages"
          :id="`activation-language-option-${item.id}`"
          kind="ghost"
          :key="item?.languages"
          :active="userStore.language.id === item.id"
          :label="item?.name"
          @click="changeLanguage(item)"
        />
      </template>
    </LxDropDownMenu>
    <div id="activation-page" class="page activation">
      <div class="onboarding-greeting first">
        <div id="activation-logo-wrapper" class="image-wrapper">
          <img v-if="!isDark" src="@/assets/digimaks-logo.png" />
          <img v-else src="@/assets/digimaks-logo-dark.png" />
        </div>
        <div class="onboarding-content">
          <div class="onboarding-top-content">
            <p class="highlight-text">{{ t.t('pages.activation.hi') }}</p>
            <p>{{ t.t('pages.activation.description') }}</p>
          </div>
          <div class="fab">
            <div class="onboarding-agreement-link-wrapper">
              <LxToggle id="activation-user-agreement-toggle" v-model="userAgreementModel">
                <template #default>
                  <div class="onboarding-agreement-text">
                    {{ t.t('pages.activation.agree') }}&nbsp;
                    <LxLink
                      id="activation-user-agreement-link"
                      :href="settingsLinks.userAgreement[userStore.language.id]"
                      @click.stop
                    >
                      {{ t.t('pages.activation.userAgreement') }}
                    </LxLink>
                  </div>
                </template>
              </LxToggle>
            </div>
            <div class="onboarding-agreement-link-wrapper">
              <LxToggle id="activation-privacy-policy-toggle" v-model="privacyPolicyModel">
                <template #default>
                  <div class="onboarding-agreement-text">
                    {{ t.t('pages.activation.agree') }}&nbsp;
                    <LxLink
                      id="activation-privacy-policy-link"
                      :href="settingsLinks.privacyPolicy[userStore.language.id]"
                      @click.stop
                    >
                      {{ t.t('pages.activation.privacyPolicy') }}
                    </LxLink>
                  </div>
                </template>
              </LxToggle>
            </div>
            <LxButton
              id="activation-activate-button"
              :label="t.t('pages.activation.activate')"
              icon="next"
              :disabled="!canContinue"
              @click="() => router.replace({ name: 'dashboard' })"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
