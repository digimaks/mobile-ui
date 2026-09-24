// SPDX-License-Identifier: EUPL-1.2

import { request } from '@/utils/communicationUtils';
import { APP_CONFIG } from '@/constants';
import { useMockStore } from '@/stores/useMockStore';
import router from '@/router/index';

const mockStore = useMockStore();

const WAIT = 0;

const originalMockFields = JSON.parse(
  JSON.stringify(mockStore.getRequestDocuments.response.data.documents.map((d) => d.fields))
);

let savedMockFieldSelection = null;

export async function scanQrCode(docId) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        router.push({ name: 'documentPresentation', params: { id: docId } });
        resolve(data);
      }, WAIT);
    });
  } else {
    await request('presentation', 'scanQrCode', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getRequestDocuments() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        const responseData = mockStore.getRequestDocuments.response.data;

        responseData.documents.forEach((doc, i) => {
          doc.fields?.forEach((field, j) => {
            field.checked = savedMockFieldSelection?.[i]?.[j]?.checked ?? field.checked;
          });
        });

        responseData.quickFlowAvailable = !!savedMockFieldSelection;
        responseData.savedSelectionApplied = !!savedMockFieldSelection;

        resolve(responseData);
      }, WAIT);
    });
  } else {
    await request('presentation', 'getRequestDocuments', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function confirmRequest(selectedDocumentId, fields) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        data = { redirectUrl: '/dashboard' };
        resolve(data);
      }, WAIT);
    });
  } else {
    // 2 min timeout
    await request(
      'presentation',
      'confirmRequest',
      { selectedDocumentId, fields },
      undefined,
      120000
    )
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function presentationCanceled() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, WAIT);
    });
  } else {
    await request('presentation', 'presentationCanceled', null, undefined, 10000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function setVendorPresentationPreference(vendorKey, remember) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        if (remember) {
          savedMockFieldSelection = mockStore.getRequestDocuments.response.data.documents.map(
            (doc) => doc.fields?.map((field) => ({ checked: field.checked }))
          );
        } else {
          savedMockFieldSelection = null;
          mockStore.getRequestDocuments.response.data.documents.forEach((doc, i) => {
            doc.fields?.forEach((field, j) => {
              field.checked = originalMockFields[i]?.[j]?.checked ?? field.checked;
            });
          });
        }
        resolve(data);
      }, WAIT);
    });
  } else {
    await request('presentation', 'setVendorPresentationPreference', { vendorKey, remember })
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}
