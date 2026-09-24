// SPDX-License-Identifier: EUPL-1.2

import { request } from '@/utils/communicationUtils';
import { APP_CONFIG } from '@/constants';
import { useMockStore } from '@/stores/useMockStore';

const mockStore = useMockStore();

const WAIT = 1000;

export async function getTransactions(id = null) {
  let data;
  if (!APP_CONFIG.embed) {
    data = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockStore.getTransactions.response.data);
      }, WAIT);
    });
  } else {
    const paramsObj = {
      documentId: id,
    };
    await request('transactions', 'getTransactions', id ? paramsObj : {})
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        throw err;
      });
  }
  return data;
}
