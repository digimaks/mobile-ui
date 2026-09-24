// SPDX-License-Identifier: EUPL-1.2

import { lxStringUtils } from '@dativa-lv/lx-ui';
import router from '@/router/index';

const promiseMap = new Map();

const TIMEOUT = 20000;

export function request(bridge, func, params, guid = lxStringUtils.generateUUID(), timeout = null) {
  return new Promise((resolve, reject) => {
    promiseMap.set(guid, { resolve, reject });

    window.lxBridge.postMessage(bridge, {
      id: guid,
      function: func,
      data: params,
    });

    // Timeout logic
    if (timeout !== 0) {
      const timeoutId = setTimeout(() => {
        if (promiseMap.has(guid)) {
          promiseMap.get(guid).reject(null);
          promiseMap.delete(guid);
        }
      }, timeout || TIMEOUT);

      promiseMap.get(guid).timeoutId = timeoutId;
    } else {
      promiseMap.get(guid).timeoutId = null;
    }
  });
}

window.addEventListener('lx-embed-response', (event) => {
  const response = event.detail;
  const { id, status, data, error } = response;

  if (promiseMap.has(id)) {
    const { resolve, reject, timeoutId } = promiseMap.get(id);
    clearTimeout(timeoutId);
    promiseMap.delete(id);

    if (status === 'SUCCESS') {
      resolve(data);
    } else {
      reject(error || 'Unknown error');
    }
  }
});

export function resolveRequest(requestId) {
  // TODO: add systemId to the event name
  window.postMessage({
    event: 'lx-embed-response',
    data: {
      id: requestId,
      status: 'success',
      data: `${requestId} dati atnak atpakal`,
    },
  });
}

window.addEventListener('lx-navigation', (event) => {
  const response = event.detail;
  const { path, params, query } = response;

  router.replace({ name: path, params, query });
});
