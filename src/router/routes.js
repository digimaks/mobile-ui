// SPDX-License-Identifier: EUPL-1.2

/**
 * @typedef {Object} CustomMetaProps
 * @property {(i18n: ReturnType<typeof import('vue-i18n').useI18n>) => string} [title]
 * @property {boolean} [canGoBack] - if true, the route will have a back button
 * @property {string} [backRouteName] - name of the route to go back to
 * @property {boolean} [anonymous] - if true, the route is accessible also for anonymous users
 * @property {boolean} [onlyAnonymous] - if true, the route is accessible only for anonymous users
 * @property {{ text: string, to: import('vue-router').RouteLocationRaw }[]} [breadcrumbs] - array of breadcrumbs
 * @property {(rights: ReturnType<typeof import('@/hooks/useRights').default>) => boolean} [access] - route access function that returns true if the user has access to the route
 */
/**
 * @typedef {import('vue-router').RouteRecordRaw & { meta?: CustomMetaProps, children?: CustomRoute[] }} CustomRoute
 */

/** @type {CustomRoute[]} */
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: {
      title: (i18n) => i18n.t('pages.home.title'),
    },
    children: [
      {
        path: '/dashboard/:id?',
        name: 'dashboard',
        meta: {
          title: (i18n) => i18n.t('pages.dashboard.title'),
          // access: (rights) => rights.canViewDashboard(),
        },
        component: () => import('@/views/Dashboard.vue'),
      },
      {
        path: '/onboarding/:step?',
        name: 'onboarding',
        meta: {
          title: (i18n) => i18n.t('pages.onboarding.title'),
        },
        component: () => import('@/views/Onboarding.vue'),
      },
      {
        path: '/add-document',
        name: 'addDocument',
        meta: {
          title: (i18n) => i18n.t('pages.documentAdd.title'),
        },
        component: () => import('@/views/Add.vue'),
      },
      {
        path: '/document-offer',
        name: 'documentOffer',
        meta: {
          title: (i18n) => i18n.t('pages.documentAdd.title'),
        },
        component: () => import('@/views/DocumentOffer.vue'),
      },
      {
        path: '/document-offer-code',
        name: 'documentOfferCode',
        meta: {
          title: (i18n) => i18n.t('pages.documentAdd.title'),
        },
        component: () => import('@/views/DocumentOfferCode.vue'),
      },
      {
        path: '/document-offer-manual/:status?',
        name: 'documentOfferManual',
        meta: {
          title: (i18n) => i18n.t('pages.documentAdd.title'),
        },
        component: () => import('@/views/DocumentOfferManual.vue'),
      },
      {
        path: '/document-presentation/:id?',
        name: 'documentPresentation',
        meta: {
          title: (i18n) => i18n.t('pages.documentPresentation.title'),
        },
        component: () => import('@/views/DocumentPresentation.vue'),
      },
      {
        path: '/loading',
        name: 'loading',
        meta: {
          // title: (i18n) => i18n.t('pages.documentPresentation.title'),
        },
        component: () => import('@/views/Loading.vue'),
      },
      {
        path: '/usage-history/:id?',
        name: 'usageHistory',
        meta: {
          title: (i18n) => i18n.t('pages.usageHistory.title'),
        },
        component: () => import('@/views/UsageHistory.vue'),
      },
      {
        path: '/document-deactivation',
        name: 'settings',
        meta: {
          title: (i18n) => i18n.t('pages.usageHistory.title'),
        },
        component: () => import('@/views/DocumentDeactivation.vue'),
      },
      {
        path: '/activation/:step?',
        name: 'activation',
        meta: {
          // title: (i18n) => i18n.t('pages.usageHistory.title'),
        },
        component: () => import('@/views/Activation.vue'),
      },
      {
        path: '/privacy-policy',
        name: 'privacyPolicy',
        meta: {
          title: (i18n) => i18n.t('pages.privacyPolicy.title'),
          // access: (rights) => rights.canViewDashboard(),
        },
        component: () => import('@/views/PrivacyPolicy.vue'),
      },
      {
        path: '/dashboard-menu/:id?',
        name: 'dashboardMenu',
        meta: {
          title: (i18n) => i18n.t('pages.privacyPolicy.title'),
          // access: (rights) => rights.canViewDashboard(),
        },
        component: () => import('@/views/DashboardMenu.vue'),
      },
      {
        path: '/sign/:filePath/:type/:id?',
        name: 'sign',
        meta: {
          // title: (i18n) => i18n.t('pages.privacyPolicy.title'),
          // access: (rights) => rights.canViewDashboard(),
        },
        component: () => import('@/views/Sign.vue'),
      },
      {
        path: '/signature-select',
        name: 'signatureSelect',
        component: () => import('@/views/SignatureSelect.vue'),
      },
      {
        path: '/sign-done/:step/:filePath/:type?',
        name: 'signDone',
        component: () => import('@/views/SignDone.vue'),
      },
      {
        path: '/auth-done',
        name: 'authDone',
        component: () => import('@/views/AuthDone.vue'),
        meta: {
          title: (i18n) => i18n.t('pages.auth.title'),
          anonymous: true,
        },
      },
      {
        path: '/sessionEnded',
        name: 'sessionEnded',
        component: () => import('@/views/SessionEnded.vue'),
        meta: {
          title: (i18n) => i18n.t('pages.sessionEnded.title'),
          anonymous: true,
        },
      },
      {
        path: '/error',
        name: 'error',
        component: () => import('@/views/Error404.vue'),
        meta: { anonymous: true },
      },
      {
        path: '/forbidden',
        name: 'forbidden',
        component: () => import('@/views/Error403.vue'),
        meta: { anonymous: true },
      },
      {
        path: '/not-authorized',
        name: 'notAuthorized',
        component: () => import('@/views/Error401.vue'),
        meta: { anonymous: true },
      },
      {
        path: '/qr-invalid',
        name: 'qrInvalid',
        component: () => import('@/views/ErrorQR.vue'),
        meta: { anonymous: true },
      },
      {
        path: '/attestation-invalid',
        name: 'attestationInvalid',
        component: () => import('@/views/ErrorAttestation.vue'),
        meta: { anonymous: true },
      },
    ],
  },
];

export default routes;
