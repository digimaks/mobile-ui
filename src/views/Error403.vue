<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { LxErrorPage } from '@dativa-lv/lx-ui';
import { useRouter } from 'vue-router';

const router = useRouter();

function action(actionName) {
  if (actionName === 'dashboard') {
    router.push({ name: 'dashboard' });
    return;
  }
  router.go(-1);
}
</script>
<template>
  <LxErrorPage
    id="error-403-page"
    kind="403"
    @actionClick="action"
    :actionDefinitions="[
      { id: 'dashboard', name: 'Atgriezties atpakaļ', icon: 'undo' },
      {
        id: 'back',
        name: 'Atgriezties uz sākumu',
        icon: 'dashboard',
        kind: 'secondary',
      },
    ]"
  ></LxErrorPage>
</template>
