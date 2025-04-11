/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRENT_TENANT } from '../../../utils/commands';
import { switchTenantTo } from './switch_tenant';
import indexPatternGlobalTenantHeaderSetUp from '../../../fixtures/plugins/security-dashboards-plugin/indexpatterns/indexPatternGlobalTenantHeader.json';
import indexPatternPrivateTenantHeaderSetUp from '../../../fixtures/plugins/security-dashboards-plugin/indexpatterns/indexPatternPrivateTenantHeader.json';

if (Cypress.env('SECURITY_ENABLED')) {
  describe('Multi Tenancy Tests: ', () => {
    before(() => {
      cy.server();

      cy.createIndexPattern(
        'index-pattern1',
        {
          title: 's*',
          timeFieldName: 'timestamp',
        },
        indexPatternGlobalTenantHeaderSetUp
      );

      cy.createIndexPattern(
        'index-pattern2',
        {
          title: 'se*',
          timeFieldName: 'timestamp',
        },
        indexPatternPrivateTenantHeaderSetUp
      );
    });

    it('Tests that when the short URL is copied and pasted, it will route correctly with the right tenant', function () {
      const randomNumber = Cypress._.random(0, 1e6);
      const dashboardName = 'Cypress dashboard - ' + randomNumber;
      // We are programmatically creating a dashboard so that the test
      // always have the same view. An empty list would show the empty prompt.
      // Also, this saves us some typing, clicking and waiting in the test.
      cy.createDashboard(
        {
          title: dashboardName,
        },
        {
          security_tenant: 'private',
        }
      );

      // When creating the shortUrl, we don't want to have the security_tenant
      // parameter in the url - otherwise it will be stored in the shortUrl
      // itself, which would make this test obsolete.
      // But it is also hard to get the tests running reliably when opening
      // Dashboards without the parameter (tenant selector popup etc.).
      // Hence, we do some navigation to "lose" the query parameter.
      CURRENT_TENANT.newTenant = 'private';
      cy.visit('/app/home', {
        waitForGetTenant: true,
        onBeforeLoad(window) {
          // set up session storage as we would expect to emulate browser
          window.sessionStorage.setItem(
            'opendistro::security::tenant::show_popup',
            false
          );

          window.localStorage.setItem(
            'opendistro::security::tenant::saved',
            '__user__'
          );
        },
      });
      // Navigate to the Dashboards app
      cy.getElementByTestId('toggleNavButton').should('be.visible').click();
      // After clicking the navigation, the security_tenant parameter should be gone
      cy.get('[href$="/app/dashboards#/list"]').should('be.visible').click();

      // The test subj seems to replace spaces with a dash, so we convert the dashboard name here too.
      // Go to the dashboard we have created
      const selectorDashboardName = dashboardName.split(' ').join('-');
      cy.getElementByTestId(
        'dashboardListingTitleLink-' + selectorDashboardName
      )
        .should('be.visible')
        .click();

      cy.getElementByTestId('savedObjectTitle').type(dashboardName);

      cy.intercept({
        method: 'POST',
        url: '/api/saved_objects/_bulk_get',
      }).as('waitForReloadingDashboard');
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();
      cy.wait('@waitForReloadingDashboard');
      cy.wait(2000);

      // 2. Open top share navigation to access copy short url
      cy.getElementByTestId('shareTopNavButton').click();
      cy.getElementByTestId('sharePanel-Permalinks').click();

      // 3. Create the short url, wait for response
      cy.intercept('POST', '/api/shorten_url').as('getShortUrl');
      // If the url already contains the tenant parameter, it will be stored in the short url. That will work in the app
      // but would render this test useless. We're testing that resolved short urls without the tenant parameter work as well.
      cy.url().should('not.contain', 'security_tenant');
      cy.getElementByTestId('createShortUrl').click();
      cy.wait('@getShortUrl');

      //4. Switch tenant & visit shortURL link to ensure tenant from short URL is retained
      cy.getElementByTestId('copyShareUrlButton')
        .invoke('attr', 'data-share-url')
        .should('contain', '/goto/')
        .then((shortUrl) => {
          cy.log('Short url is ' + shortUrl);
          // Navigate away to avoid the non existing dashboard in the next tenant.
          switchTenantTo('global');

          // Since we can't reliably read the clipboard data, we have to append the tenant parameter manually
          cy.visit(shortUrl + '?security_tenant=private', {
            excludeTenant: true, // We are passing the tenant as a query parameter. Mainly because of readability.
            onBeforeLoad(window) {
              // Here we are simulating the new tab scenario which isn't supported by Cypress
              window.sessionStorage.clear();
            },
          });

          cy.url({ timeout: 10000 }).should('contain', 'security_tenant=');
          cy.getElementByTestId('breadcrumb last').should(
            'contain.text',
            dashboardName
          );
        });
    });
    after(() => {
      cy.deleteIndexPattern('index-pattern1', {
        headers: {
          securitytenant: ['global'],
          'osd-xsrf': true,
        },
      });
      cy.deleteIndexPattern('index-pattern2', {
        headers: {
          securitytenant: ['private'],
          'osd-xsrf': true,
        },
      });
    });
  });
}
