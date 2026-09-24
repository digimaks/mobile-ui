// SPDX-License-Identifier: EUPL-1.2

import { lxStringUtils } from '@dativa-lv/lx-ui';

export function getDocType(type) {
  switch (type) {
    case 'eu.europa.ec.eudi.pid.1':
    case 'urn:eudi:pid:1':
    case 'PID':
      return 'pid';
    case 'mDL':
      return 'mdl';
    case 'Diploma':
      return 'diploma';
    case 'eu.digimaks.esign':
    case 'eSign':
      return 'esign';
    case 'eu.digimaks.eseal':
    case 'eSeal':
      return 'eseal';
    default:
      return 'other';
  }
}

export function getDocTypeIcon(type, issuer) {
  const normalizedIssuer = issuer?.toLowerCase?.() || '';

  if (type === 'pid') {
    if (normalizedIssuer === 'sia dativa') {
      return { icon: 'person', iconSet: 'phosphor' };
    }
    return { icon: 'passport', iconSet: 'brand' };
  }

  return { icon: 'none', iconSet: 'phosphor' };
}

export function getDataType(detailIdentifier) {
  // TODO: add all the other identifiers here
  switch (detailIdentifier) {
    case 'citizenship_country_code':
    case 'awarding_body_country_code':
    case 'issuing_country_code':
    case 'issuing_country':
    case 'birth_country':
    case 'nationality':
    case 'awardingBody_countryCode':
    case 'citizenshipCountryCode':
      return 'country';
    case 'issuance_date':
    case 'issue_date':
    case 'expiry_date':
    case 'valid_from':
    case 'birth_date':
    case 'issuanceDate':
    case 'validFrom':
    case 'issued':
    case 'expiresOn':
    case 'issuedOn':
      return 'date';
    // driving_privileges is a string with array like elements split by ','
    case 'driving_privileges':
      return 'array';
    case 'age_over_18':
      return 'boolean';
    case 'portrait':
      return 'exception';
    default:
      return null;
  }
}

export function getIssuerLogo(issuer) {
  switch (issuer?.toLowerCase()) {
    case 'pmlp':
      return 'pmlp';
    case 'test qeaa issuer':
    case 'csdd':
      return 'csdd';
    case 'rīgas tehniskā universitāte':
    case 'rtu':
      return 'rtu';
    case 'lvrtc':
      return 'lvrtc';
    default:
      return null;
  }
}

export function fixBase64Image(base64) {
  // Replace URL-safe characters with standard Base64 characters
  let b64 = base64.trim().replace(/_/g, '/').replace(/-/g, '+');

  // Add padding if missing
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }

  return b64;
}

const cardColors = [
  '#a12830',
  '#BF2600',
  '#C9372C',
  '#DE350B',
  '#bb5750',
  '#6A00FF',
  '#C25100',
  '#976700',
  '#7F5F01',
  '#4C6B1F',
  '#006644',
  '#0d7c66',
  '#004030',
  '#00712d',
  '#06923E',
  '#1da853',
  '#059212',
  '#00809d',
  '#0065FF',
  '#346ef1',
  '#0747A6',
  '#09326C',
  '#414875',
  '#3B5FA4',
  '#5f70bd',
  '#626F86',
  '#6E5DC6',
  '#C44D27',
  '#332F7F',
  '#AE4787',
  '#CF0F47',
  '#4F1C51',
];

export function getCardColor(providedColor, seed, hashFunction = 'cyrb32') {
  if (providedColor) {
    return providedColor;
  }
  if (seed) {
    const index = lxStringUtils.generateIntegerInRange(seed, cardColors.length, 0, hashFunction);
    return cardColors[index];
  }
  return '';
}

const DOCUMENT_DETAIL_CONFIG = {
  'eu.europa.ec.eudi.pid.1': ['given_name', 'family_name', 'personal_administrative_number'],
  'urn:eudi:pid:1': ['given_name', 'family_name', 'personal_administrative_number'],
  'eu.digimaks.eseal': ['cn'],
  'eu.digimaks.esign': ['cn'],
};

export function getCardDetails(meta) {
  const documentType = meta?.docType || '';
  const requiredDisplayDetails = DOCUMENT_DETAIL_CONFIG[documentType];

  if (!requiredDisplayDetails) {
    return [];
  }

  const cardDisplayDetails = requiredDisplayDetails
    .map((fieldName) => meta?.documentDetails?.find((detail) => detail.identifier === fieldName))
    .filter((detail) => detail !== undefined);

  return cardDisplayDetails;
}

export function getCardImage(meta) {
  const imageDetail = meta?.documentDetails?.find((detail) => detail.type === 'image');

  const image = imageDetail?.image?.trim();
  return image && image !== '' ? fixBase64Image(image) : null;
}

const DOCUMENT_LOGO_CONFIG = {
  'eu.digimaks.eseal': 'lvrtc',
  'eu.digimaks.esign': 'lvrtc',
};

export function getCardLogo(meta) {
  const type = meta?.docType?.toLowerCase();
  const issuer = meta?.issuingAuthority?.toLowerCase();
  if (DOCUMENT_LOGO_CONFIG[type]) {
    return DOCUMENT_LOGO_CONFIG[type];
  }
  return DOCUMENT_LOGO_CONFIG[issuer] || null;
}

export function remToPx(remValue) {
  return remValue * 18;
}
