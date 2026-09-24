<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { ref, computed } from 'vue';
import { LxList, lxDateUtils, LxStateDisplay, LxIcon, LxToggle } from '@dativa-lv/lx-ui';
import { getDocType } from '@/utils/dataUtils';
import { useI18n } from 'vue-i18n';

const t = useI18n();

const props = defineProps({
  id: { type: String, default: 'transaction-list' },
  items: { type: Array, default: () => [] },
});

const toggle = ref(false);

const preparedTransactions = computed(() =>
  props.items
    .map((x) => {
      const docType = x?.documentIdentifier ? getDocType(x.documentIdentifier) : null;

      let docName = '';

      if (x?.documentDisplay?.name && docType !== 'pid') {
        docName = x.documentDisplay.name;
      } else if (docType) {
        docName = t.t(`cards.names.${docType?.toLowerCase()}`);
      }

      return {
        id: x?.id,
        docName,
        docType,
        date: x?.timestamp,
        type: x?.eventType,
        status: x?.status,
        authority: x?.authority,
      };
    })
    .filter((x) => !toggle.value || x.status === 'SUCCESS')
);

function getTypeIcon(type) {
  if (type === 'DOCUMENT_PRESENTED') {
    return 'status-seen';
  }
  if (type === 'DOCUMENT_DELETED') {
    return 'status-deleted';
  }
  if (type === 'DOCUMENT_ISSUED') {
    return 'status-new';
  }
  if (type === 'DOCUMENT_SIGNED') {
    return 'status-signed';
  }
  return 'status-default';
}

function getTypeText(type) {
  if (type === 'DOCUMENT_PRESENTED') {
    return t.t('pages.usageHistory.presented');
  }
  if (type === 'DOCUMENT_DELETED') {
    return t.t('pages.usageHistory.deleted');
  }
  if (type === 'DOCUMENT_ISSUED') {
    return t.t('pages.usageHistory.issued');
  }
  if (type === 'DOCUMENT_SIGNED') {
    return t.t('pages.usageHistory.signed');
  }
  return t.t('pages.usageHistory.other');
}

const statusDictionary = computed(() => [
  {
    value: 'SUCCESS',
    displayName: t.t('pages.usageHistory.successLabel'),
    displayType: 'finished',
  },
  {
    value: 'ERROR',
    displayName: t.t('pages.usageHistory.errorLabel'),
    displayType: 'error',
  },
  {
    value: 'CANCELLED',
    displayName: t.t('pages.usageHistory.cancelledLabel'),
    displayType: 'disabling',
  },
]);
</script>
<template>
  <div :id="id">
    <div class="history-toggle-wrapper">
      <LxToggle :id="`${id}-show-success-toggle`" v-model="toggle">
        {{ t.t('pages.usageHistory.showSuccess') }}
      </LxToggle>
    </div>
    <LxList
      :id="`${id}-list`"
      :items="preparedTransactions"
      list-type="1"
      nameAttribute="docName"
      :texts="{ noItems: t.t('pages.documentAdd.documentList.noItems') }"
    >
      <template #customItem="item">
        <div :id="`${id}-item-${item.id}`" class="transaction-item">
          <div class="first-row">
            <p class="lx-primary">
              {{ item?.docName }}
            </p>
            <p>{{ lxDateUtils.formatDateTime(new Date(item?.date)) }}</p>
          </div>
          <div class="second-row">
            <div class="status-wrapper">
              <LxStateDisplay
                :id="`${id}-item-${item.id}-status`"
                :value="item.status"
                :dictionary="statusDictionary"
              />
            </div>
            <div class="type-wrapper">
              <p>{{ getTypeText(item.type) }}</p>
              <LxIcon
                :id="`${id}-item-${item.id}-type-icon`"
                :value="getTypeIcon(item.type)"
                icon-set="material"
              />
            </div>
          </div>
        </div>
      </template>
    </LxList>
  </div>
</template>
