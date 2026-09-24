// SPDX-License-Identifier: EUPL-1.2

import { defineStore } from 'pinia';
import { LxViewStore } from '@dativa-lv/lx-ui';

export default defineStore('viewStore', {
  ...LxViewStore,
  state: () => ({
    ...LxViewStore.state(), // Include existing state
    showSigning: false,
    system: null,
    lastDashboardFilter: 'dashboard',
    navbarSwitch: true,
  }),
});
