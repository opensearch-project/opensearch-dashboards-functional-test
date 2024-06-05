/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';

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
      it('display feedback button and able to interact', () => {
        // input question
        cy.wait(1000);
        cy.get(`input[placeholder="Ask question"]`)
          .click()
          .type('What are the indices in my cluster?{enter}');

        // should have a LLM Response
        cy.contains('The indices in the cluster');

        // should have a thumb up and a thumb down feedback button
        cy.get(`[aria-label="feedback thumbs up"]`).should('be.length', 1);
        cy.get(`[aria-label="feedback thumbs down"]`).should('be.length', 1);
        // click thumb up button to feedback
        cy.get(`[aria-label="feedback thumbs up"]`).click();
        // only thumb up button displays and thumb down button is hidden
        cy.get(`[aria-label="feedback thumbs down"]`).should('be.length', 0);
        cy.get(`[aria-label="feedback thumbs up"]`).should('be.length', 1);
        // The type of clicked button should be primary.
        cy.get(`[aria-label="feedback thumbs up"]`).should(
          'have.class',
          'euiButtonIcon--primary'
        );
      });
    });
  });
}
