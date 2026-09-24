<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWindowSize, useResizeObserver } from '@vueuse/core';
import Card from '@/components/Card.vue';
import { getDocType, remToPx } from '@/utils/dataUtils';

const t = useI18n();

const props = defineProps({
  id: { type: String, default: 'card-list' },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
  animationsReduced: { type: Boolean, default: false },
  selectedCard: { type: Object, default: null },
  hasESign: { type: Boolean, default: false },
});

const emit = defineEmits(['cardClick']);

const { height: windowHeight } = useWindowSize();
const containerRef = ref(null);
const cardHeight = ref(0);
const customGap = ref(0);
const cardAnimationTime = 500;
const layoutReady = ref(false);

const normalizedItems = computed(() => {
  if (!props.items?.length) return props.items;

  const hasPID = props.items.some((item) => getDocType(item.documentIdentifier) === 'pid');

  if (!props.hasESign && hasPID) {
    return [
      ...props.items,
      {
        id: 'sign-card',
        preparedItem: {
          docId: 'sign-card',
          docName: t.t('pages.onboarding.options.sign'),
          docIcon: 'sign',
        },
      },
    ];
  }
  return props.items;
});

const selectedIndex = computed(() =>
  props.selectedCard
    ? normalizedItems.value.findIndex((i) => i.preparedItem?.docId === props.selectedCard.docId)
    : null
);

const flipped = ref(selectedIndex.value !== null);
const animationDone = ref(selectedIndex.value !== null);

function getFirstCardHeight() {
  const card = containerRef.value?.querySelector('.custom-card');
  if (!card) return 0;

  const rect = card.getBoundingClientRect();

  return rect.height;
}

function updateCustomGap() {
  const itemCount = normalizedItems.value?.length || 0;
  if (itemCount <= 1) {
    customGap.value = 0;
    return;
  }

  if (props.collapsed) {
    customGap.value = remToPx(5);
    return;
  }

  const card = containerRef.value?.querySelector('.custom-card');
  if (!card) return;

  const fab = document.querySelector('.fab');

  const nativeInsetTop =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--native-inset-top')) ||
    0;

  const availableSpace =
    window.innerHeight - nativeInsetTop - (fab?.offsetHeight || 0) - remToPx(3.5);

  const fullySpacedGap = remToPx(0.5);
  // If cards have enough space to spread out - add 0.5rem gap between them
  const totalIdealHeight = cardHeight.value * itemCount + fullySpacedGap * (itemCount - 1);

  let finalGap;

  if (totalIdealHeight <= availableSpace) {
    finalGap = cardHeight.value + fullySpacedGap;
  } else {
    const gap = (availableSpace - cardHeight.value) / (itemCount - 1);
    finalGap = gap;
  }

  customGap.value = Math.max(remToPx(5), finalGap);
}

const updateLayout = () => {
  const height = getFirstCardHeight();
  if (!height) return;

  cardHeight.value = height;
  updateCustomGap();

  if (!layoutReady.value) {
    requestAnimationFrame(() => {
      layoutReady.value = true;
    });
  }
};
useResizeObserver(containerRef, () => {
  nextTick(updateLayout);
});

const cardStyles = computed(() =>
  normalizedItems.value.map((_, index) => {
    const selected = selectedIndex.value;

    if (!cardHeight.value) {
      return {};
    }

    if (props.animationsReduced) {
      if (selected === null) {
        const y = index * customGap.value;
        return {
          position: 'absolute',
          transform: `translateY(${y}px)`,
          zIndex: index,
        };
      }
      if (index !== selected) {
        return {
          position: 'absolute',
          transform: 'translateY(120dvh)',
          zIndex: index,
          opacity: 0,
          pointerEvents: 'none',
        };
      }
      return {
        position: 'absolute',
        transform: 'translateY(0)',
        zIndex: index,
      };
    }

    const base = {
      transition: layoutReady.value
        ? `transform ${cardAnimationTime}ms cubic-bezier(0.33, 0, 0.1, 1), opacity ${cardAnimationTime}ms ease`
        : 'none',
      position: 'absolute',
    };

    if (selected === null) {
      const y = index * customGap.value;
      return {
        ...base,
        transform: `translateY(${y}px)`,
        zIndex: index,
      };
    }
    if (index < selected) {
      return {
        ...base,
        transform: 'translateY(-120dvh)',
        zIndex: index,
        transitionDelay: `${(selected - index) * 20}ms`,
        opacity: 0,
        pointerEvents: 'none',
      };
    }
    if (index > selected) {
      return {
        ...base,
        transform: 'translateY(120dvh)',
        zIndex: index,
        transitionDelay: `${(index - selected) * 20}ms`,
        opacity: 0,
        pointerEvents: 'none',
      };
    }
    return { ...base, zIndex: index, transform: 'translateY(0)' };
  })
);

watch(selectedIndex, async (val) => {
  if (val !== null) {
    animationDone.value = false;
    flipped.value = false;
    await nextTick();
    requestAnimationFrame(() => {
      flipped.value = true;
      setTimeout(() => {
        animationDone.value = true;
      }, cardAnimationTime + 50);
    });
  } else {
    animationDone.value = false;
  }
});

watch(windowHeight, () => {
  nextTick(updateLayout);
});

onMounted(() => {
  if (selectedIndex.value !== null) {
    flipped.value = true;
    animationDone.value = true;
  }

  nextTick(() => {
    requestAnimationFrame(() => {
      updateLayout();
    });
  });
});

const listHeight = computed(() => {
  const count = normalizedItems.value.length || 0;
  return count ? customGap.value * (count - 1) + cardHeight.value : 0;
});

defineExpose({ cardHeight });
</script>

<template>
  <div
    :id="id"
    ref="containerRef"
    :style="{
      height: selectedIndex !== null && cardHeight > 0 ? `${cardHeight}px` : undefined,
      overflow: selectedIndex !== null && cardHeight > 0 && animationDone ? 'hidden' : undefined,
      'min-height': selectedIndex === null ? `${listHeight}px` : undefined,
    }"
  >
    <Card
      v-for="(item, index) in normalizedItems"
      :key="item.preparedItem?.docId"
      :id="`${id}-item-${item.preparedItem?.docId}`"
      :style="cardStyles[index]"
      :class="{
        'selected-card': selectedIndex === index,
      }"
      :kind="item.preparedItem?.docId !== 'sign-card' ? 'clickable' : 'default'"
      :flipped="
        selectedIndex === index &&
        selectedIndex !== null &&
        item.preparedItem?.docId !== 'sign-card' &&
        flipped
      "
      :collapsed="collapsed"
      :value="item.preparedItem"
      @click="emit('cardClick', item.preparedItem?.docId)"
    />
  </div>
</template>
