/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { CURRENT_TENANT } from '../../../utils/commands';

describe('Add flights dataset saved object', () => {
  before(() => {
    if (Cypress.env('SECURITY_ENABLED')) {
      /**
       * Security plugin is using private tenant as default.
       * So here we'd need to set global tenant as default manually.
       */
      cy.changeDefaultTenant({
        multitenancy_enabled: true,
        private_tenant_enabled: true,
        default_tenant: 'Global',
      });
    }
    CURRENT_TENANT.newTenant = 'global';

    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
      retryOnStatusCodeFailure: true,
      timeout: 60000,
    });
    cy.get('div[data-test-subj="sampleDataSetCardflights"]', { timeout: 60000 })
      .contains(/Add data/)
      .click();
    cy.wait(60000);
  });

  after(() => {
    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory`);
    cy.get('button[data-test-subj="removeSampleDataSetflights"]')
      .should('be.visible')
      .click();
  });

  it('check if maps saved object of flights dataset can be found and open', () => {
    cy.visit(`${BASE_PATH}/app/maps-dashboards`);
    cy.contains(
      '[Flights] Flights Status on Maps Destination Location'
    ).click();
    cy.get('[data-test-subj="layerControlPanel"]').should(
      'contain',
      'Flights On Time'
    );
  });
});
