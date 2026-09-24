// SPDX-License-Identifier: EUPL-1.2

import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    language: { id: 'lv' },
  }),
  actions: {
    setLanguage(language) {
      this.language = { id: language };
    },
  },
});
