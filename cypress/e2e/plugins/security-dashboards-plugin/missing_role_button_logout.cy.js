/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
if (Cypress.env('SECURITY_ENABLED')) {
  it('Tests if no role button redirects to logout screen', () => {
    cy.visit('/app/customerror/missing-role');

    cy.contains('button', 'Logout').should('be.visible').click();

    cy.intercept({
      method: 'POST',
      url: '/auth/logout',
    });

    cy.getElementByTestId('submit').should('contain.text', 'Log in');
  });
}
