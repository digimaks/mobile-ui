// SPDX-License-Identifier: EUPL-1.2

import { request } from '@/utils/communicationUtils';
import { APP_CONFIG } from '@/constants';
import { useMockStore } from '@/stores/useMockStore';

const mockStore = useMockStore();

const WAIT = 0;

export async function getDocuments() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.getDocuments.response.data);
      }, WAIT);
    });
  } else {
    await request('dashboard', 'getDocuments', undefined, undefined, 0)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getDocumentDetails(params) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      const res = mockStore.getDocumentDetailsGetter(params);
      setTimeout(() => {
        resolve(res?.data);
      }, WAIT);
    });
  } else {
    const requestData = {
      documentId: params,
    };

    await request('dashboard', 'getDocumentDetails', requestData)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function deleteDocument(params) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      mockStore.deleteDocument(params);
      const res = {
        id: 'string',
        status: 'SUCCESS',
        data: {
          status: 'string',
        },
      };
      setTimeout(() => {
        resolve(res.data);
      }, WAIT);
    });
  } else {
    const requestData = {
      documentId: params,
    };

    await request('dashboard', 'deleteDocument', requestData)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function setDocumentFavorite(documentId, isFavorite) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    const requestData = {
      documentId,
      isFavorite,
    };

    await request('dashboard', 'setDocumentFavorite', requestData)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}
