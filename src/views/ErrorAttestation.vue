<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import useViewStore from '@/stores/useViewStore';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import StatePage from '@/components/StatePage.vue';

const viewStore = useViewStore();

const t = useI18n();

onMounted(async () => {
  viewStore.navBar = false;
});
</script>

<template>
  <StatePage
    id="error-attestation-state"
    kind="error"
    :title="t.t('pages.errorAttestation.title')"
    :description="t.t('pages.errorAttestation.description', { appName: 'Digimaks' })"
  />
</template>
