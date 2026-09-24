// SPDX-License-Identifier: EUPL-1.2

import useViewStore from '@/stores/useViewStore';
import router from '@/router';

const viewStore = useViewStore();

export function goToDashboard() {
  const filter = viewStore.lastDashboardFilter;
  const params = filter === 'favorites' || filter === 'hasExpired' ? { id: filter } : { id: '' };

  router.replace({ name: 'dashboard', params });
}

export const settingsLinks = {
  userAgreement: {
    lv: 'https://digimaks.eu/user-agreement?src=embed',
    en: 'https://digimaks.eu/en/user-agreement?src=embed',
  },
  privacyPolicy: {
    lv: 'https://digimaks.eu/privacy?src=embed',
    en: 'https://digimaks.eu/en/privacy?src=embed',
  },
};
