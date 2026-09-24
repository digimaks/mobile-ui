<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { computed } from 'vue';
import { LxIllustration, LxButton, LxToggle, lxGeneralUtils } from '@dativa-lv/lx-ui';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  id: { type: String, default: 'state-page' },
  kind: { type: String, default: 'error' },
  title: { type: String, default: null },
  description: { type: String, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  texts: { type: Object, default: () => ({}) },
});

const emits = defineEmits(['actionClick', 'close']);

const { t } = useI18n();

const textsDefault = {
  error: {
    title: t('statusScreen.error.title'),
    description: t('statusScreen.error.description'),
  },
  success: {
    title: t('statusScreen.success.title'),
    description: t('statusScreen.success.description'),
  },
  close: t('shell.close'),
};

const displayTexts = computed(() => lxGeneralUtils.getDisplayTexts(props.texts, textsDefault));

const illustration = computed(() => (props.kind === 'success' ? 'success' : 'error'));

const titleText = computed(() => props.title ?? displayTexts.value[props.kind]?.title);
const descriptionText = computed(
  () => props.description ?? displayTexts.value[props.kind]?.description
);

function handleActionClick(actionId, value) {
  emits('actionClick', actionId, value);
}

const groupedActions = computed(() =>
  props.actionDefinitions.reduce((groups, action) => {
    if (action.group != null) {
      const last = groups[groups.length - 1];
      if (Array.isArray(last) && last[0]?.group === action.group) {
        last.push(action);
      } else {
        groups.push([action]);
      }
    } else {
      groups.push([action]);
    }
    return groups;
  }, [])
);
</script>

<template>
  <div
    :id="`${id}-${kind === 'success' ? 'success' : 'error'}`"
    :class="kind === 'success' ? 'success-screen' : 'error-screen'"
    class="state-screen"
  >
    <LxIllustration
      :id="`${id}-illustration`"
      :value="illustration"
      :class="kind === 'success' ? 'accept-icon' : 'error-illustration'"
    />

    <p v-if="titleText" :id="`${id}-title`" class="lx-primary">{{ titleText }}</p>
    <div v-if="descriptionText" :id="`${id}-description`" class="lx-secondary">
      {{ descriptionText }}
    </div>

    <slot name="info" />

    <div
      v-if="actionDefinitions.length || $slots.default || $slots.fab"
      :id="`${id}-actions`"
      class="fab"
    >
      <slot name="fab" />
      <slot />
      <template v-for="(group, index) in groupedActions" :key="index">
        <div v-if="group.length > 1" class="lx-button-set">
          <template v-for="action in group" :key="action.id">
            <LxToggle
              v-if="action.kind === 'toggle'"
              :id="`${id}-action-${action.id}`"
              :model-value="action.value"
              @update:model-value="handleActionClick(action.id, $event)"
            >
              <template #default>{{ action.label }}</template>
            </LxToggle>
            <LxButton
              v-else
              :id="`${id}-action-${action.id}`"
              :label="action.label || action.name"
              :icon="action.icon"
              :kind="action.kind"
              :variant="action.variant"
              :busy="action.busy"
              :disabled="action.disabled"
              @click="handleActionClick(action.id)"
            />
          </template>
        </div>
        <template v-else v-for="action in group" :key="action.id">
          <LxToggle
            v-if="action.kind === 'toggle'"
            :id="`${id}-action-${action.id}`"
            :model-value="action.value"
            @update:model-value="handleActionClick(action.id, $event)"
          >
            <template #default>{{ action.label }}</template>
          </LxToggle>
          <LxButton
            v-else
            :id="`${id}-action-${action.id}`"
            :label="action.label || action.name"
            :icon="action.icon"
            :kind="action.kind"
            :variant="action.variant"
            :busy="action.busy"
            :disabled="action.disabled"
            @click="handleActionClick(action.id)"
          />
        </template>
      </template>
    </div>
  </div>
</template>
