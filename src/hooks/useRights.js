// SPDX-License-Identifier: EUPL-1.2

import useAuthStore from '@/stores/useAuthStore';

export default () => {
  const authStore = useAuthStore();
  const webappScopes = {
    /** Game list scope, just example scope in order to test permissions */
    gameList: 'game/list',
  };
  return {
    // Temporary function to test permissions
    canViewDashboard: () =>
      authStore.session?.scope.some((scope) => scope.includes(webappScopes.gameList)),
  };
};
