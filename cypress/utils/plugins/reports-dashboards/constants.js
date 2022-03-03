/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';

export function visitReportingLandingPage() {
  cy.visit(`${BASE_PATH}/app/reports-dashboards#/`);
  cy.location('pathname', { timeout: 60000 }).should(
    'include',
    '/reports-dashboards'
  );
}

export const WAIT_TIME = 40000;
