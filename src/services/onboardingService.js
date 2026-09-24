// SPDX-License-Identifier: EUPL-1.2

import { request } from '@/utils/communicationUtils';
import { APP_CONFIG } from '@/constants';

const WAIT = 1000;

const response = {
  id: 'string',
  status: 'SUCCESS', // "error"
  message: 'string?',
};

export async function submitPhone(phone) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(response?.data);
      }, WAIT);
    });
  } else {
    const paramObj = {
      number: phone,
    };
    await request('onboarding', 'submitSms', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function verifyPhone(code) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(response?.data);
      }, WAIT);
    });
  } else {
    const paramObj = {
      otp: code,
    };
    await request('onboarding', 'verifySmsOTP', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function submitEmail(email) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(response?.data);
      }, WAIT);
    });
  } else {
    const paramObj = {
      email,
    };
    await request('onboarding', 'submitEmail', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function verifyEmail(code) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(response?.data);
      }, WAIT);
    });
  } else {
    const paramObj = {
      otp: code,
    };
    await request('onboarding', 'verifyEmailOTP', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function authenticate() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(response?.data);
      }, WAIT);
    });
  } else {
    const paramObj = {};
    await request('onboarding', 'initiateEParaksts', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function initiateSmartId() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, WAIT);
    });
  } else {
    const paramObj = {};
    await request('onboarding', 'initiateSmartID', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function getUserName() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      const result = response;
      result.data = { firstName: 'Jānis' };
      setTimeout(() => {
        resolve(result?.data);
      }, WAIT);
    });
  } else {
    const paramObj = {};
    await request('issuance', 'getPidDetails', paramObj)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function initialiseWallet() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      const result = response;
      setTimeout(() => {
        resolve(result?.data);
      }, WAIT);
    });
  } else {
    await request('onboarding', 'initialiseWallet', null, undefined, 120000)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}

export async function startWallet() {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      const result = response;
      setTimeout(() => {
        resolve(result?.data);
      }, WAIT);
    });
  } else {
    await request('onboarding', 'startWallet', null)
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}
