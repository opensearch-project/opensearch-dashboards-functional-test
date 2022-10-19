/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH, toTestId } from '../../../../../utils/constants';

if (Cypress.env('VISBUILDER_ENABLED')) {
  describe('Visualization Builder Experimental settings', () => {
    const TEST_VISUALIZATION_NAME = `VB: Basic Metric Chart`;
    const DASHBOARD_ID = '7869d5d0-4ec1-11ed-840c-8d2a846d32d2';

    before(() => {
      cy.importSavedObjects(
        'dashboard/opensearch_dashboards/visBuilder/vb_dashboard.ndjson'
      );
    });

    it('Sould show experimental banner', () => {
      cy.setAdvancedSetting({ 'visualize:enableLabs': true });
      cy.visit(`${BASE_PATH}/app/wizard`);

      // Check experimental banner
      cy.getElementByTestId('experimentalVisInfo').should('exist');
    });

    it('Sould show experimental icons', () => {
      cy.setAdvancedSetting({ 'visualize:enableLabs': true });

      // Check experimental icon in visualize list
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.get('input[type="search"]').type(`${TEST_VISUALIZATION_NAME}{enter}`);
      cy.getElementByTestId('itemsInMemTable')
        .find('.visListingTable__experimentalIcon')
        .should('exist');

      // Check Create visualization modal
      cy.getElementByTestId('newItemButton').click();
      cy.getElementByTestId(['visType-wizard'])
        .find('.euiKeyPadMenuItem__betaBadge')
        .should('exist');
    });

    it('Sould handle experimental setting turned on', () => {
      cy.setAdvancedSetting({ 'visualize:enableLabs': true });

      // Check visualize listing
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.get('input[type="search"]').type(`${TEST_VISUALIZATION_NAME}{enter}`);
      cy.getElementByTestId(
        `visListingTitleLink-${toTestId(TEST_VISUALIZATION_NAME)}`
      ).should('exist');

      // Check Create visualization modal
      cy.getElementByTestId('newItemButton').click();
      cy.getElementByTestId(['visType-wizard']).should('exist');

      // Check Dashboard
      cy.visit(`${BASE_PATH}/app/dashboards#/view/${DASHBOARD_ID}`);
      cy.getElementByTestId('wizardLoader').should('exist');
    });

    it('Sould handle experimental setting turned off', () => {
      cy.setAdvancedSetting({ 'visualize:enableLabs': false });

      // Check visualize listing
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.get('input[type="search"]').type(`${TEST_VISUALIZATION_NAME}{enter}`);
      cy.getElementByTestId(
        `visListingTitleLink-${toTestId(TEST_VISUALIZATION_NAME)}`
      ).should('not.exist');

      // Check Create visualization modal
      cy.getElementByTestId('newItemButton').click();
      cy.getElementByTestId(['visType-wizard']).should('not.exist');

      // Check Dashboard
      cy.visit(`${BASE_PATH}/app/dashboards#/view/${DASHBOARD_ID}`);
      cy.getElementByTestId('disabledVisBuilderVis').should('exist');
    });

    after(() => {
      // Reset the value
      cy.setAdvancedSetting({ 'visualize:enableLabs': null });
    });
  });
}
