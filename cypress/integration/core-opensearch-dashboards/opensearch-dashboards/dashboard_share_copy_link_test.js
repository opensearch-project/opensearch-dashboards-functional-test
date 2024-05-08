/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { STACK_MANAGEMENT_PATH } from '../../../utils/dashboards/constants';

const isChromeBrowser = () => {
  const userAgent = window.navigator.userAgent;

  // Check if the user agent contains either 'Chrome' or 'Chromium'
  const isChrome = userAgent.includes('Chrome');
  const isChromium = userAgent.includes('Chromium');

  return isChrome || isChromium;
};

if (Cypress.env('SECURITY_ENABLED')) {
  if (isChromeBrowser()) {
    cy.wrap(
      Cypress.automation('remote:debugger:protocol', {
        command: 'Browser.grantPermissions',
        params: {
          permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
          origin: window.location.origin,
        },
      })
    );
  }
  describe('Copy Link functionality working', () => {
    it('Tests the link copys and can be routed to in Safari', () => {
      cy.visit(STACK_MANAGEMENT_PATH);
      cy.waitForLoader();
      cy.getElementByTestId('toggleNavButton').click();
      cy.get('span[title="Discover"]').click();
      cy.getElementByTestId('shareTopNavButton').click();
      cy.getElementByTestId('copyShareUrlButton').click();

      // Capture the copied content
      cy.window().then((win) => {
        // Access the clipboard contents
        cy.document().then(() => {
          cy.wait(1000); // Wait for clipboard data to be available
          cy.log('Trying to read clipboard data...');

          // Read the clipboard text
          cy.wrap(win.navigator.clipboard.readText()).then((clipboardData) => {
            cy.log('url copied:', clipboardData);

            // Assert that the clipboard has data
            expect(clipboardData).to.have.length.greaterThan(0);

            cy.visit(clipboardData);
            cy.waitForLoader();

            // Now on copied URL page
          });
        });
      });
    });
  });
}
