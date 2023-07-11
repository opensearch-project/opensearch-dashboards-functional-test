/*

* Copyright OpenSearch Contributors

* SPDX-License-Identifier: Apache-2.0

*/

import { CURRENT_TENANT } from '../../../utils/commands';
import { switchTenantTo } from './switch_tenant';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Multi Tenancy Tests: ', () => {
    it('Tests that when the short URL is copied and pasted, it will route correctly with the right tenant', function () {
      cy.visit('/app/dashboards#create', {
        excludeTenant: true,
        onBeforeLoad(win) {
          // set up session storage as we would expect to emulate browser
          win.sessionStorage.setItem(
            'opendistro::security::tenant::show_popup',
            false
          );
          win.localStorage.setItem(
            'opendistro::security::tenant::saved',
            '__user__'
          );
        },
      });

      // 1. Create a dashboard (to be able to share it later)
      cy.getElementByTestId('dashboardSaveMenuItem').click();

      const randomNumber = Cypress._.random(0, 1e6);
      const dashboardName = 'Cypress dashboard - ' + randomNumber;
      cy.getElementByTestId('savedObjectTitle').type(dashboardName);

      cy.intercept({
        method: 'POST',
        url: '/api/saved_objects/_bulk_get',
      }).as('waitForReloadingDashboard');
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();
      cy.wait('@waitForReloadingDashboard');
      cy.wait(2000);

      // 2. Open top share navigation to access copy short url
      cy.get('[data-test-subj="shareTopNavButton"]').click();
      cy.getElementByTestId('sharePanel-Permalinks').click();

      // 3. Create the short url, wait for response
      cy.intercept('POST', '/api/shorten_url').as('getShortUrl');
      // If the url already contains the tenant parameter, it will be stored in the short url. That will work in the app
      // but would render this test useless. We're testing that resolved short urls without the tenant parameter work as well.
      cy.url().should('not.contain', 'security_tenant');
      cy.getElementByTestId('createShortUrl').click();
      cy.wait('@getShortUrl');

      //4. Switch tenant & visit shortURL link to ensure tenant from short URL is retained
      cy.get('[data-test-subj="copyShareUrlButton"]')
        .invoke('attr', 'data-share-url')
        .should('contain', '/goto/')
        .then((shortUrl) => {
          cy.log('Short url is ' + shortUrl);
          // Navigate away to avoid the non existing dashboard in the next tenant.
          // For some reason, using cy.visit() will break things - Cypress can't find the account-popover unless I wait for N seconds.
          cy.waitForLoader();
          switchTenantTo('global');
          // The tests override the cy.visit method, so we need to set the tenant so that the custom command can pick it up.
          CURRENT_TENANT.newTenant = 'private';
          cy.visit(shortUrl, {
            //waitForGetTenant: true
            onBeforeLoad(win) {
              // Here we are simulating the new tab scenario which isn't supported by Cypress
              win.sessionStorage.clear();
            },
          });
          cy.url({ timeout: 10000 }).should(
            'contain',
            'security_tenant=__user__'
          );
          cy.getElementByTestId('breadcrumb last').should(
            'contain.text',
            dashboardName
          );
        });
    });
  });
}
