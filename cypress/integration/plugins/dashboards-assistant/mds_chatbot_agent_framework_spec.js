/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';

if (
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  describe('Assistant basic spec', () => {
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

    after(() => {
      cy.deleteAllDataSources();
    });

    describe('Interact with Agent framework', () => {
      it('toggle Chatbot and enable to interact', () => {
        // The header may render multiple times, wait for UI to be stable
        cy.wait(5000);

        // enable to toggle and show Chatbot
        cy.get(`img[aria-label="toggle chat flyout icon"]`).click();

        // click suggestions to generate response
        cy.contains('What are the indices in my cluster?').click();

        // should have a LLM Response
        cy.contains(
          'The indices in the cluster are the default OpenSearch and Kibana indices'
        );

        // should have a suggestion section
        cy.get(`[aria-label="chat suggestions"]`).should('be.length', 1);
        cy.contains('suggestion1');

        // Click regenerate button
        cy.get(`button[title="regenerate message"]`).click();

        // The previous message and the regenerate button should be gone
        cy.get(`button[title="regenerate message"]`).should('be.length', 0);

        // suggestions should be gone
        cy.get(`[aria-label="chat suggestions"]`).should('be.length', 0);

        // The regenrate message should be there
        cy.contains(
          'The indices in the cluster are the default OpenSearch and Kibana indices'
        );

        // should have a suggestion section
        cy.get(`[aria-label="chat suggestions"]`).should('be.length', 1);
        cy.contains('suggestion2');
      });
    });
  });
}
