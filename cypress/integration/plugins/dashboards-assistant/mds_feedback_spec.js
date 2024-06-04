/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';
import { testCoversationFeedback } from '../../../utils/plugins/dashboards-assistant/shared/feedback';

if (
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  describe('Assistant feedback spec', () => {
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
    });

    beforeEach(() => {
      // Visit ISM OSD
      cy.visit(`${BASE_PATH}/app/home`);

      // Common text to wait for to confirm page loaded, give up to 60 seconds for initial load
      cy.get(`input[placeholder="Ask question"]`, { timeout: 60000 }).should(
        'be.length',
        1
      );
    });

    // clean up localStorage items
    after(() => {
      cy.deleteAllDataSources();
      localStorage.removeItem('home:welcome:show');
      localStorage.removeItem('home:newThemeModal:show');
    });

    describe('conversation feedback', () => {
      testCoversationFeedback();
    });
  });
}
