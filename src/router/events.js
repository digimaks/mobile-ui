// SPDX-License-Identifier: EUPL-1.2

import useAuthStore from '@/stores/useAuthStore';
import useAppStore from '@/stores/useAppStore';
import { lxFlowUtils } from '@dativa-lv/lx-ui';

export default (router) => {
  router.beforeEach(async (to, from) => {
    const authStore = useAuthStore();
    const appStore = useAppStore();
    await lxFlowUtils.beforeEach(to, from, appStore, authStore);
  });
  router.afterEach(async (to, from) => {
    const appStore = useAppStore();
    await lxFlowUtils.afterEach(to, from, appStore);
  });
};
