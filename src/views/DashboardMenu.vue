<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { LxList, LxButton } from '@dativa-lv/lx-ui';
import { getDocuments } from '@/services/documentService';
import { goToDashboard } from '@/utils/navigationUtils';
import useViewStore from '@/stores/useViewStore';
import useNotifyStore from '@/stores/useNotifyStore';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const t = useI18n();
const viewStore = useViewStore();
const notification = useNotifyStore();
const router = useRouter();
const route = useRoute();

const documents = ref([]);
const loading = ref(false);

const groups = computed(() => {
  const group = [
    {
      id: 'all',
      name: t.t('pages.dashboard.allDocuments'),
      count: 0,
      icon: !route.params.id ? 'accept' : 'unselected',
    },
    {
      id: 'favorites',
      name: t.t('pages.dashboard.favoriteDocuments'),
      count: 0,
      icon: route.params.id === 'favorites' ? 'accept' : 'unselected',
    },
    {
      id: 'hasExpired',
      name: t.t('pages.dashboard.expiredDocuments'),
      count: 0,
      icon: route.params.id === 'hasExpired' ? 'accept' : 'unselected',
    },
  ];

  if (documents.value) {
    documents.value.forEach((x) => {
      if (x.meta.hasExpired) {
        group[2].count++;
      }
      if (x.meta.isFavorite) {
        group[1].count++;
      }
      group[0].count++;
    });
  }
  group.map((x) => (x.clickable = x.count > 0));
  return group;
});

function listActionClicked(action, item) {
  if (action === 'click') {
    viewStore.lastDashboardFilter =
      item === 'favorites' || item === 'hasExpired' ? item : 'dashboard';

    goToDashboard();
  }
}

async function fetchDocuments() {
  loading.value = true;
  try {
    const res = await getDocuments();
    documents.value = res.documents;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
}

onMounted(async () => {
  viewStore.navBar = false;
  window.addEventListener('lx-native-back', goToDashboard);
  await fetchDocuments();
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-native-back', goToDashboard);
});
</script>

<template>
  <div class="page-wrapper">
    <div id="dashboard-menu-dashboard-menu-page" class="page dashboard-page">
      <div id="dashboard-menu-header-row" class="close-button-wrapper">
        <p>{{ t.t('pages.dashboard.chooseFolder') }}</p>
        <LxButton
          id="dashboard-menu-close-button"
          icon="close"
          variant="icon-only"
          kind="ghost"
          :label="t.t('pages.dashboard.close')"
          @click="() => router.replace({ name: 'dashboard', params: { id: route.params.id } })"
        />
      </div>

      <LxList
        id="dashboard-menu-filter-list"
        :items="groups"
        list-type="1"
        @actionClick="listActionClicked"
        class="filter-list"
      >
        <template #customItem="item">
          <p
            :id="`dashboard-menu-filter-option-${item.id}`"
            class="lx-primary"
            :class="[
              {
                'selected ': item.id === route.params.id || (item.id === 'all' && !route.params.id),
              },
            ]"
          >
            {{ item.name }} ({{ item.count }})
          </p>
        </template>
      </LxList>
    </div>
  </div>
</template>
