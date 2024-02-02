/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { CURRENT_TENANT } from '../../../utils/commands';

describe('Default OpenSearch base map layer', () => {
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
      .contains(/(Add|View) data/)
      .click();
    cy.wait(60000);
  });

  it('check if default OpenSearch map layer can be open', () => {
    cy.visit(`${BASE_PATH}/app/maps-dashboards`);
    cy.contains('Create map').click();
    cy.get('[data-test-subj="layerControlPanel"]').should(
      'contain',
      'Default map'
    );
    cy.get('canvas.maplibregl-canvas').trigger('mousemove', {
      x: 100,
      y: 100,
      force: true,
    });
    cy.get('canvas.maplibregl-canvas').trigger('mousemove', {
      x: 200,
      y: 200,
      force: true,
    });
    for (let i = 0; i < 21; i++) {
      cy.wait(1000)
        .get('canvas.maplibregl-canvas')
        .trigger('dblclick', { force: true });
    }
    cy.get('[data-test-subj="mapStatusBar"]').should('contain', 'zoom: 22');
  });

  after(() => {
    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory`);
    cy.get('button[data-test-subj="removeSampleDataSetflights"]')
      .should('be.visible')
      .click();
  });
});
