/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../../utils/constants';
import { setStorageItem } from '../../../utils/plugins/dashboards-assistant/helpers';

const QUESTION = 'What are the indices in my cluster?';
const FINAL_ANSWER =
  'The indices in your cluster are the names listed in the response obtained from using a tool to get information about the OpenSearch indices.';

if (Cypress.env('DASHBOARDS_ASSISTANT_ENABLED')) {
  describe('Assistant conversation save to notebook spec', () => {
    let restoreShowHome;
    let restoreNewThemeModal;
    let restoreTenantSwitchModal;

    beforeEach(() => {
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
      restoreTenantSwitchModal = setStorageItem(
        sessionStorage,
        'opendistro::security::tenant::show_popup',
        'false'
      );
      // Visit OSD
      cy.visit(`${BASE_PATH}/app/home`);

      cy.get(`button[aria-label="toggle chat flyout icon"]`, {
        timeout: 60000,
      }).should('be.length', 1);

      // enable to toggle and show Chatbot
      cy.get(`button[aria-label="toggle chat flyout icon"]`).click();

      // click suggestions to generate response
      cy.contains('What are the indices in my cluster?').click();
      cy.wait(10000);

      // should have a LLM Response
      cy.contains(FINAL_ANSWER);
    });

    afterEach(() => {
      if (restoreShowHome) {
        restoreShowHome();
      }
      if (restoreNewThemeModal) {
        restoreNewThemeModal();
      }
      if (restoreTenantSwitchModal) {
        restoreTenantSwitchModal();
      }
    });

    it('show succeed toast after saved notebook', () => {
      cy.get('button[aria-label="toggle chat context menu"]').click();
      cy.contains('Save to notebook').click();
      cy.get('input[aria-label="Notebook name input"]').type('test notebook');
      cy.get('button[data-test-subj="confirmSaveToNotebookButton"]').click();

      cy.get('div[aria-label="Notification message list"]')
        .contains('This conversation was saved as')
        .should('be.visible');
    });

    it('show conversation details in the created notebook page', () => {
      cy.get('button[aria-label="toggle chat context menu"]').click();
      cy.contains('Save to notebook').click();
      cy.get('input[aria-label="Notebook name input"]').type('test notebook');
      cy.get('button[data-test-subj="confirmSaveToNotebookButton"]').click();

      // Click created notebook link in current tab
      cy.get('div[aria-label="Notification message list"]')
        .contains('test notebook')
        .invoke('removeAttr', 'target')
        .as('testNotebookLink');

      cy.wait(1000);
      cy.get('@testNotebookLink').click();

      cy.location('pathname').should('contains', 'app/observability-notebooks');

      cy.waitForLoader();
      cy.contains(QUESTION).should('be.visible');
      cy.contains(FINAL_ANSWER).should('be.visible');
    });
  });
}
