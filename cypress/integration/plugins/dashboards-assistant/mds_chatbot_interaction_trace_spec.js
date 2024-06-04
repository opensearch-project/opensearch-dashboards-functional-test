/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  testTracePage,
  beforeAction,
} from '../../../utils/plugins/dashboards-assistant/shared/chatbot_interaction_trace';

if (
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  describe('Interaction trace spec', () => {
    before(() => {
      cy.deleteAllDataSources();
      // create data source
      cy.createDataSourceNoAuth().then((result) => {
        const dataSourceId = result[0];
        // set default data source
        cy.setDefaultDataSource(dataSourceId);
      });
      // Set welcome screen tracking to false
      localStorage.setItem('home:welcome:show', 'false');
      // Set new theme modal to false
      localStorage.setItem('home:newThemeModal:show', 'false');

      beforeAction();
    });

    // clean up localStorage items
    after(() => {
      cy.deleteAllDataSources();
      localStorage.removeItem('home:welcome:show');
      localStorage.removeItem('home:newThemeModal:show');
    });

    describe('Trace page', () => {
      testTracePage();
    });
  });
}
