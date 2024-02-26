/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { STACK_MANAGEMENT_PATH } from '../../../utils/dashboards/constants';

import { switchTenantTo } from './switch_tenant';
import 'cypress-real-events/support';

Cypress.automation('remote:debugger:protocol', {
  command: 'Browser.grantPermissions',
  params: {
    permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
    origin: window.location.origin,
  },
});

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Multi Tenancy Tests for Shared Links: ', () => {
    it('Tests to ensure that copy link includes security tenant as url param', () => {
      cy.visit(STACK_MANAGEMENT_PATH);
      cy.waitForLoader();
      switchTenantTo('private');
      cy.getElementByTestId('toggleNavButton').click();
      cy.get('span[title="Discover"]').click();
      cy.getElementByTestId('shareTopNavButton').click();
      cy.getElementByTestId('copyShareUrlButton')
        .realClick()
        .then(() => {
          cy.window()
            .its('navigator.clipboard')
            .then((clip) => clip.readText())
            .should('contain', 'security_tenant=');
        });
    });
    it('Tests to ensure that copy link includes security tenant as url param in short url', () => {
      cy.visit(STACK_MANAGEMENT_PATH);
      cy.waitForLoader();
      switchTenantTo('private');
      cy.getElementByTestId('toggleNavButton').click();
      cy.get('span[title="Discover"]').click();
      cy.getElementByTestId('shareTopNavButton').click();
      cy.getElementByTestId('createShortUrl').click();
      cy.getElementByTestId('copyShareUrlButton')
        .realClick()
        .then(() => {
          cy.window()
            .its('navigator.clipboard')
            .then((clip) => clip.readText())
            .should('contain', 'security_tenant=');
        });
    });
  });
}
