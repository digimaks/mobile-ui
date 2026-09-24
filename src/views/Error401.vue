<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { LxErrorPage } from '@dativa-lv/lx-ui';
import { useRouter } from 'vue-router';

const router = useRouter();

function action(actionName) {
  if (actionName === 'authorize') {
    router.push({
      name: 'home',
      query: { returnPath: router.currentRoute.value?.query?.returnPath },
    });
    /*
    const retPath = router.currentRoute.value?.query?.returnPath;
    authStore.login(retPath);
    */
    return;
  }
  router.go(-1);
}
</script>
<template>
  <LxErrorPage
    id="error-401-page"
    kind="401"
    @actionClick="action"
    :actionDefinitions="[
      { id: 'authorize', name: 'Autorizēties', icon: 'next' },
      { id: 'back', name: 'Atgriezties atpakaļ', icon: 'undo', kind: 'secondary' },
    ]"
  ></LxErrorPage>
</template>
