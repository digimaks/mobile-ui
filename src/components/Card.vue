<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { lxStringUtils, LxIcon, LxLogoDisplay, LxCard } from '@dativa-lv/lx-ui';
import {
  getDocType,
  getDocTypeIcon,
  getCardColor,
  getCardImage,
  getCardLogo,
  getCardDetails,
  remToPx,
} from '@/utils/dataUtils';
import { useI18n } from 'vue-i18n';
import { useElementSize } from '@vueuse/core';

const t = useI18n();

const props = defineProps({
  id: { type: String, default: null },
  value: { type: Object, default: () => ({}) },
  kind: {
    type: String,
    default: 'default', // default, clickable, button
  },
  collapsed: { type: Boolean, default: false },
  flipped: { type: Boolean, default: false },
  interactive: { type: Boolean, default: false },
});

const emit = defineEmits(['update:flipped']);

const cardRef = ref(null);
const fullWidth = ref(remToPx(26)); // card max-width = 26rem
const svgRef = ref(null);
const baseAngles = [0, 15, 22, 30, 45].map((d) => d * (Math.PI / 180));
const lineLength = 1750;
const pointCount = 150;
const spacing = 200;
const transitionCount = 30;
const isFlipped = ref(props.flipped);
const { width: cardWidth } = useElementSize(cardRef);
const docDetails = ref([]);
const docImage = ref(null);

watch(
  () => props.flipped,
  (newValue) => {
    isFlipped.value = newValue;
  },
  { immediate: true }
);

watch(isFlipped, (newValue) => {
  emit('update:flipped', newValue);
});

const docIcon = computed(() => {
  if (props.value?.docId === 'sign-card') {
    return { icon: 'sign', iconSet: 'phosphor' };
  }

  return getDocTypeIcon(getDocType(props.value?.docType), props.value?.issuingAuthority);
});

const docType = computed(() => (props.value?.docType ? getDocType(props.value?.docType) : null));

const docName = computed(() => {
  if (props.value?.docName && docType?.value !== 'pid') {
    return props.value.docName;
  }
  if (docType?.value) {
    return t.t(`cards.names.${docType?.value.toLowerCase()}`);
  }
  return t.t('pages.document.title');
});

const docColor = computed(() => {
  const color = props.value?.docColor || '#FFFFFF';
  return {
    '--color-card-foreground': color,
  };
});

const docBackgroundColor = computed(() =>
  (() => {
    if (props.value?.hasExpired) {
      return '--color-card-background: #555555';
    }
    if (props.value?.issuingAuthority?.toLowerCase() === 'sia dativa') {
      return '--color-card-background: #8232F7'; // --color-brand in light mode
    }
    const color = getCardColor(props.value?.docBackgroundColor, docType?.value);
    return color
      ? `--color-card-background: ${color}`
      : '--color-card-background: var(--color-disabled)';
  })()
);

const docDescription = computed(() => {
  if (props.value?.docDescription === 'LV') return t.t('cards.countries.LV');
  return props.value?.docDescription || '';
});

const docDescription2 = computed(() => {
  if (props.value?.docDescription2 === 'LV') return t.t('cards.countries.LV');
  return props.value?.docDescription2 || '';
});

const docDescription3 = computed(() => {
  if (props.value?.docDescription3 === 'LV') return t.t('cards.countries.LV');
  return props.value?.docDescription3 || '';
});

const docDates = computed(() => {
  const issuanceDate = props.value?.issuanceDate;
  const expirationDate = props.value?.expirationDate;

  if (!issuanceDate && !expirationDate) return '—';

  return `${issuanceDate ?? ''}${expirationDate ? '–' : ''}${expirationDate ?? ''}`;
});

const scaleValue = computed(() => {
  if (!cardWidth.value) return {};
  const factor = cardWidth.value / fullWidth.value;
  return Math.max(factor < 1 ? factor : 1, 0.6);
});

const docScale = computed(() => ({
  transform: `scale(${scaleValue.value})`,
}));

watch(
  () => props.value,
  (newVal) => {
    if (!newVal) {
      docDetails.value = [];
      docImage.value = null;
      return;
    }

    const details = getCardDetails(newVal);
    docDetails.value = Array.isArray(details) ? details : [];

    const image = getCardImage(newVal);
    docImage.value = image || null;
  },
  { immediate: true }
);

const docLogo = computed(() => {
  const logo = getCardLogo(props.value);
  return logo || 'digimaks';
});

function noise2D(x, y) {
  return Math.sin(x * 2 + y * 1.5) + Math.sin(x * 1 + y * 0.5);
}

const pivots = [
  { x: -350, y: 0, rotation: 0 }, // 0: top-left
  { x: 500, y: -900, rotation: Math.PI / 3 }, // 1: top
  { x: 1200, y: -200, rotation: (2 * Math.PI) / 3 }, // 2: top-right
  { x: 1400, y: 800, rotation: Math.PI }, // 3: bottom-right
  { x: 500, y: 1300, rotation: (4 * Math.PI) / 3 }, // 4: bottom
  { x: -300, y: 800, rotation: (5 * Math.PI) / 3 }, // 5: bottom-left
];

function generateMainLines(pivotIndex, noiseSeed, pivot) {
  const { x: px, y: py, rotation } = pivot;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return baseAngles.map((angle, i) => {
    const normal = angle + Math.PI / 2;
    const baseOffset = spacing * (i - 2);
    const offsetX = Math.cos(normal) * baseOffset;
    const offsetY = Math.sin(normal) * baseOffset;

    const noiseFactor = [1, 4].includes(pivotIndex) ? 0.005 : 0.006;
    const noiseScale = [1, 4].includes(pivotIndex) ? 50 : 75;

    const points = [];

    for (let j = 0; j <= pointCount; j += 1) {
      const d = (j / pointCount) * lineLength;
      const baseX = offsetX + Math.cos(angle) * d;
      const baseY = offsetY + Math.sin(angle) * d;

      const noise = noise2D(baseX * noiseFactor + noiseSeed, baseY * noiseFactor + noiseSeed);
      const offset = noise * noiseScale;

      const nx = baseX - Math.sin(angle) * offset;
      const ny = baseY + Math.cos(angle) * offset;

      const tx = nx * cos - ny * sin + px;
      const ty = nx * sin + ny * cos + py;

      points.push(`${tx},${ty}`);
    }
    return points;
  });
}

function renderTransitions(svg, lines) {
  for (let i = 0; i < lines.length - 1; i += 1) {
    for (let z = 1; z <= transitionCount; z += 1) {
      const alpha = z / (transitionCount + 1);

      const points = lines[i].map((p1, idx) => {
        const [x1, y1] = p1.split(',').map(Number);
        const [x2, y2] = lines[i + 1][idx].split(',').map(Number);
        const x = x1 + (x2 - x1) * alpha;
        const y = y1 + (y2 - y1) * alpha;
        return `${x},${y}`;
      });

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${points.join(' L')}`);
      path.setAttribute('stroke', 'rgba(0,0,0,0.1)');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-width', '1');
      svg.appendChild(path);
    }
  }
}

function renderSvg(docId) {
  const svg = svgRef.value;
  if (!svg) return;
  svg.innerHTML = '';

  const seed = docId ? lxStringUtils.generateIntegerInRange(String(docId), 1500) : 2025; // 2025 = randomly selected number as seed if no docId
  const noiseSeed = seed;

  svg.setAttribute('viewBox', '0 0 1000 630');

  const pivotIndex = seed % pivots.length;
  const { x, y, rotation } = pivots[pivotIndex];
  const pivot = { x, y, rotation };

  const mainLines = generateMainLines(pivotIndex, noiseSeed, pivot);

  mainLines.forEach((points) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M${points.join(' L')}`);
    path.setAttribute('stroke', 'rgba(0,0,0,0.1)');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '1');
    svg.appendChild(path);
  });
  renderTransitions(svg, mainLines);
}

watch(
  [svgRef, () => props.value?.docId],
  ([svg, docId]) => {
    if (!svg) return;
    renderSvg(docId);
  },
  { immediate: true }
);
</script>
<template>
  <div class="custom-card" ref="cardRef" :class="{ collapsed }" :style="docColor">
    <LxCard v-model="isFlipped" :kind="kind" :interactive="interactive" :id="id ?? value?.docId">
      <div class="custom-card-face custom-card-front" :style="[docBackgroundColor, docScale]">
        <div class="svg-wrapper">
          <svg ref="svgRef" class="card-background-svg" xmlns="http://www.w3.org/2000/svg"></svg>
        </div>
        <div class="custom-card-name-wrapper">
          <p class="custom-card-name">{{ docName }}</p>
        </div>
        <div class="custom-card-description-wrapper">
          <p class="custom-card-description">{{ docDescription }}</p>
          <p class="custom-card-description">{{ docDescription2 }}</p>
          <p class="custom-card-description">{{ docDescription3 }}</p>
        </div>
        <div class="custom-card-icon-wrapper">
          <LxIcon
            :id="`${id ?? value?.docId}-doc-type-icon`"
            :value="docIcon.icon"
            :icon-set="docIcon.iconSet"
          />
        </div>
      </div>
      <template #reverse>
        <div class="custom-card-face custom-card-back" :style="[docBackgroundColor, docScale]">
          <div class="custom-card-back-top">
            <div class="custom-card-back-left">
              <template v-for="detail in docDetails" v-bind:key="detail?.identifier">
                <div class="custom-card-row">
                  <p class="custom-card-row-label">{{ detail?.label }}</p>
                  <!--TODO: clean up-->
                  <p class="custom-card-row-content">
                    {{
                      detail?.value !== undefined && detail?.value !== null && detail?.value !== ''
                        ? detail.value
                        : '—'
                    }}
                  </p>
                </div>
              </template>
            </div>
            <div v-if="docImage" class="custom-card-back-right">
              <img :src="`data:image/png;base64,${docImage}`" :alt="t.t('pages.document.image')" />
            </div>
          </div>
          <div class="custom-card-back-bottom">
            <div class="custom-card-bottom-logo-wrapper">
              <LxLogoDisplay
                :id="`${id ?? value?.docId}-issuer-logo`"
                :value="docLogo"
                kind="square"
                size="s"
                theme="light"
              />
            </div>
            <div class="custom-card-bottom-row-wrapper">
              <p v-if="value?.issuingAuthority" class="custom-card-bottom-row">
                {{ value?.issuingAuthority }}
              </p>
              <p class="custom-card-bottom-row">{{ docDates }}</p>
              <p class="custom-card-bottom-row">{{ value?.docType }}</p>
            </div>
          </div>
        </div>
      </template>
    </LxCard>
  </div>
</template>
