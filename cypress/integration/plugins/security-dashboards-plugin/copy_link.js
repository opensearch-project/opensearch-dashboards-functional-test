/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { STACK_MANAGEMENT_PATH } from '../../../utils/dashboards/constants';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Copy Link functionality working ', () => {
    it('Tests the link copys and can be routed to in Safari ', () => {
      cy.visit(STACK_MANAGEMENT_PATH);
      cy.waitForLoader();
      cy.getElementByTestId('toggleNavButton').click();
      cy.get('span[title="Discover"]').click();
      cy.getElementByTestId('shareTopNavButton').click();
      cy.getElementByTestId('copyShareUrlButton').click();
    });
  });
}
