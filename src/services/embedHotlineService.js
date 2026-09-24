// SPDX-License-Identifier: EUPL-1.2

import { lxStringUtils } from '@dativa-lv/lx-ui';
import { request, resolveRequest } from '@/utils/communicationUtils';

export async function getDocumentsTest(params, testGuid = null) {
  // testGuid ir tikai prieks testa, lai varetu imitet respone ar pogam
  const guid = testGuid || lxStringUtils.generateUUID();

  let data;
  await request('documents', 'getDocuments', params, guid)
    .then((res) => {
      console.log('Resolved:', res);
      data = res;
    })
    .catch((err) => {
      console.error('Rejected:', err);
    });

  return data;
}

export async function getDocumentInfo(params, testGuid = null) {
  // testGuid ir tikai prieks testa, lai varetu imitet respone ar pogam
  const guid = testGuid || lxStringUtils.generateUUID();

  let data;
  await request('documents', 'getDocumentInfo', params, guid)
    .then((res) => {
      console.log('Resolved:', res);
      data = res;
    })
    .catch((err) => {
      console.error('Rejected:', err);
    });

  return data;
}

export { resolveRequest };
