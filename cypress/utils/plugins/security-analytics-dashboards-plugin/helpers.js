/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { logTypeLabels } from './constants';
import { startCase } from 'lodash';

export function getLogTypeLabel(name) {
  return !name ? '-' : logTypeLabels[name.toLowerCase()] || startCase(name);
}

export function setupIntercept(cy, url, interceptName, method = 'POST') {
  const urlRegex = new RegExp(`.*${url}.*`);
  cy.intercept(method, urlRegex).as(interceptName);
}
