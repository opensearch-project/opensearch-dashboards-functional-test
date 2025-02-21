/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';

export const TIMEOUT = 10000;

export function visitReportingLandingPage() {
  cy.visit(`${BASE_PATH}/app/reports-dashboards#/`, {
    waitForGetTenant: false,
  });
  cy.location('pathname', { timeout: TIMEOUT }).should(
    'include',
    '/reports-dashboards'
  );
}

export const WAIT_TIME = 15000;
