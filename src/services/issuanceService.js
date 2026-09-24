// SPDX-License-Identifier: EUPL-1.2

import { request } from '@/utils/communicationUtils';
import { APP_CONFIG } from '@/constants';
import { useMockStore } from '@/stores/useMockStore';
import router from '@/router/index';

const mockStore = useMockStore();

const WAIT = 0;

export async function scanQrCode() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, WAIT);
    });
  } else {
    await request('issuance', 'scanQrCode', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getDocumentOptions() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.getDocumentOptions.response.data);
      }, WAIT);
    });
  } else {
    await request('issuance', 'getDocumentOptions', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function issueDocument(type) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        router.push({ name: 'documentOfferManual', params: { status: 'success' } });
        resolve(null);
      }, WAIT);
    });
  } else {
    const requestData = {
      method: 'openid4vci',
      documentType: type,
    };
    await request('issuance', 'issueDocument', requestData)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function resumeIssuance(uri) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    const requestData = {
      uri,
    };
    await request('issuance', 'resumeIssuance', requestData)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function resolveDocumentOffer() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.resolveDocumentOffer.response.data);
      }, WAIT);
    });
  } else {
    await request('issuance', 'resolveDocumentOffer', undefined)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getOfferCodeData() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      const response = {
        offerUri: 'string',
        issuerName: 'string',
        txCodeLength: 5,
      };
      setTimeout(() => {
        resolve(response);
      }, WAIT);
    });
  } else {
    await request('issuance', 'getOfferCodeData', {})
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function issueDocumentOffer(uri, code, name) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    const paramObj = {
      offerUri: uri,
      txCode: code,
      issuerName: name,
    };
    await request('issuance', 'issueDocumentOffer', paramObj, undefined, 120000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getUserSignatureOptions() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.getUserSignOptions.response.data);
      }, WAIT);
    });
  } else {
    await request('issuance', 'getUserSignatureOptions', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function selectUserSignatures(idArray) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    const paramObj = {
      selectedIds: idArray,
    };
    await request('issuance', 'selectUserSignatures', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}
