// SPDX-License-Identifier: EUPL-1.2

import { request } from '@/utils/communicationUtils';
import { APP_CONFIG } from '@/constants';
import { useMockStore } from '@/stores/useMockStore';

const mockStore = useMockStore();

const WAIT = 0;

export async function enableBiometrics(enable) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    const paramsObj = {
      enabled: enable,
    };
    await request('settings', 'enableBiometrics', paramsObj, undefined, 120000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function setLanguage(language) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, WAIT);
    });
  } else {
    const paramsObj = {
      language,
    };
    await request('settings', 'setLanguage', paramsObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getBiometricAvailability() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.getBiometricAvailability.response.data);
      }, WAIT);
    });
  } else {
    await request('settings', 'getBiometricAvailability', {})
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function changePin() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, WAIT);
    });
  } else {
    // 2 min timeout
    await request('settings', 'changePin', null, undefined, 120000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function deleteWallet() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, WAIT);
    });
  } else {
    // 2 min timeout
    await request('settings', 'deleteWallet', null, undefined, 120000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}
