<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { shallowRef, onMounted, onUnmounted, computed } from 'vue';
import { LxList } from '@dativa-lv/lx-ui';
import useAuthStore from '@/stores/useAuthStore';
import useAppStore from '@/stores/useAppStore';
import router from '@/router';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';

const loading = shallowRef(true);
const busy = shallowRef(false);
const authStore = useAuthStore();
const viewStore = useViewStore();
const appStore = useAppStore();
const { t } = useI18n();

async function selectRole(action, role) {
  busy.value = true;
  try {
    const returnPath = await authStore.getReturnPath();

    await authStore
      .setRole(role)
      .then(await authStore.fetchSession())
      .then(await authStore.clearReturnPath())
      .then(() => {
        router.push(returnPath ? { path: returnPath } : { name: 'dashboard' });
      });
  } catch (e) {
    console.error(e.code);
  }
  busy.value = false;
}

const roleList = computed(() =>
  authStore.rolesState?.roles.map((i) => ({
    ...i,
    clickable: true,
    icon: 'role',
    label: t(`roles.${i.code}`),
    description: t(`roles.description.${i.code}`),
  }))
);

onMounted(async () => {
  await authStore.loadRoles();
  loading.value = false;
  viewStore.hideNavBar();
});
onUnmounted(async () => {
  viewStore.showNavBar();
});
</script>
<template>
  <div id="role-select-page">
    <p class="lx-description">{{ $t('pages.roleSelection.description') }}:</p>
    <p>&nbsp;</p>
    <LxList
      id="role-select-list"
      :items="roleList"
      @actionClick="selectRole"
      idAttribute="code"
      nameAttribute="label"
      descriptionAttribute="description"
      :busy="busy"
      :loading="loading"
    />
  </div>
</template>
