/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';
import { setStorageItem } from '../../../utils/plugins/dashboards-assistant/helpers';
import { testHistoryItemOperations } from '../../../utils/plugins/dashboards-assistant/shared/conversation_history';

if (
  Cypress.env('DASHBOARDS_ASSISTANT_ENABLED') &&
  Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')
) {
  describe('Assistant conversation history spec', () => {
    let restoreShowHome;
    let restoreNewThemeModal;
    let dataSourceId;

    before(() => {
      cy.deleteAllDataSources();
      // create data source
      cy.createDataSourceNoAuth().then((result) => {
        dataSourceId = result[0];
        // set default data source
        cy.setDefaultDataSource(dataSourceId);
      });
      // Set welcome screen tracking to false
      restoreShowHome = setStorageItem(
        localStorage,
        'home:welcome:show',
        'false'
      );
      // Hide new theme modal
      restoreNewThemeModal = setStorageItem(
        localStorage,
        'home:newThemeModal:show',
        'false'
      );
      // Visit OSD
      cy.visit(`${BASE_PATH}/app/home`);
      // Common text to wait for to confirm page loaded, give up to 60 seconds for initial load
      cy.get(`input[placeholder="Ask question"]`, { timeout: 60000 }).should(
        'be.length',
        1
      );

      // Open assistant flyout
      // The flyout button will be detached and can't be clicked, add 10s delayed fix it.
      cy.wait(10000);
      cy.get('img[aria-label="toggle chat flyout icon"]').click();
    });
    after(() => {
      cy.deleteAllDataSources();
      if (restoreShowHome) {
        restoreShowHome();
      }
      if (restoreNewThemeModal) {
        restoreNewThemeModal();
      }
      // Close assistant flyout
      cy.get('img[aria-label="toggle chat flyout icon"]').click();
    });

    beforeEach(() => {
      cy.get('.llm-chat-flyout', { timeout: 60000 }).should('be.visible');
    });

    describe('history item operations', () => {
      testHistoryItemOperations(dataSourceId);
    });
  });
}
