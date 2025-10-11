/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { logTypeLabels } from './constants';
import { startCase } from 'lodash';

export function getLogTypeLabel(name) {
  return !name ? '-' : logTypeLabels[name.toLowerCase()] || startCase(name);
}

export const detectionRuleNameError = 'Rule name can be max 256 characters.';

export const detectionRuleDescriptionError = `Description has max limit of 65,535 characters.`;

export const MAX_RULE_DESCRIPTION_LENGTH = 65535;

export function setupIntercept(cy, url, interceptName, method = 'POST') {
  const urlRegex = new RegExp(`.*${url}.*`);
  cy.intercept(method, urlRegex).as(interceptName);
}
