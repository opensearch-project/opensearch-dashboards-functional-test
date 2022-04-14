/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { delay, NOTIFICATIONS_PLUGIN_NAME } from '../../../utils/plugins/notifications-dashboards/constants';

describe('Test dashboard', () => {
  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${NOTIFICATIONS_PLUGIN_NAME}#notifications`);
    cy.wait(delay * 3);
  });
  
  it('shows notifications flyout', async () => {
    cy.contains('[alerting]').click()
    cy.contains('Channels sent').should('exist');
    cy.contains('temp-Test slack channel').should('exist');
  })
})
