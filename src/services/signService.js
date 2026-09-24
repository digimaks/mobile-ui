// SPDX-License-Identifier: EUPL-1.2

import { request } from '@/utils/communicationUtils';
import { APP_CONFIG } from '@/constants';
import { useMockStore } from '@/stores/useMockStore';

const mockStore = useMockStore();

const WAIT = 1000;

export async function pickFiles() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.pickFiles.response.data);
      }, WAIT);
    });
  } else {
    await request('sign', 'pickFiles', {}, undefined, 60000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getSigningMethods() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.getSigningMethods.response.data);
      }, WAIT);
    });
  } else {
    await request('sign', 'getSigningMethods', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function signDocument(filePath, documentId, outputFormat) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    const paramObj = {
      filePath,
      documentId,
      outputFormat,
    };

    await request('sign', 'signDocument', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function downloadSignedDocument() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    await request('sign', 'downloadSignedDocument', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function shareSignedDocument() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    await request('sign', 'shareSignedDocument', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getSharedFile(filePath) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.pickFiles.response.data);
      }, WAIT);
    });
  } else {
    const paramObj = {
      filePath,
    };
    await request('sign', 'getSharedFile', paramObj, undefined, 60000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function openFile(containerPath, fileName = null) {
  console.log('openFile', containerPath, fileName);
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    const paramObj = {
      containerPath,
      fileName,
    };
    await request('sign', 'openFile', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}
