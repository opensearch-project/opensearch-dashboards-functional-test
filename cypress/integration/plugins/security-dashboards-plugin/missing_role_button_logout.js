/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

if(Cypress.env('SECURITY_ENABLED')){
    it('Tests if no role button redirects to logout screen', () => {
        // 1. visit missing roles page
        cy.visit('/app/customerror/missing-role');

        // 2. click the missing role button
        cy.contains('button', 'Back to OpenSearch Dashboards Home').should('be.visible').click();

        // 3. clicking buttong should logout
        cy.intercept({
            method: 'POST',
            url: '/auth/logout',
        });

        // 4. check we have logged out and therefore are back at login page
        cy.getElementByTestId('submit').should('contain.text', 'Log in');
    });
}