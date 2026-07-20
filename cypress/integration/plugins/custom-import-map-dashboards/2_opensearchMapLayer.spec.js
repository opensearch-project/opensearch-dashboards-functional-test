/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { CURRENT_TENANT } from '../../../utils/commands';

describe('Default OpenSearch base map layer', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
      retryOnStatusCodeFailure: true,
      timeout: 60000,
    });
    cy.get('div[data-test-subj="sampleDataSetCardflights"]', {
      timeout: 60000,
    })
      .contains(/(Add|View) data/)
      .click();
    cy.get(
      'div[data-test-subj="sampleDataSetCardflights"] > span > span[title="INSTALLED"]',
      { timeout: 60000 }
    ).should('have.text', 'INSTALLED');
  });

  it('check if default OpenSearch map layer can be open', () => {
    cy.wait(10000);
    cy.visit(`${BASE_PATH}/app/maps-dashboards/create`);
    cy.wait(10000);
    cy.get('[data-test-subj="layerControlPanel"]').should(
      'contain',
      'Default map'
    );
    for (let i = 0; i < 5; i++) {
      cy.get('.maplibregl-ctrl-zoom-in').click();
      cy.wait(500);
    }
    cy.get('[data-test-subj="mapStatusBar"]').should('contain', 'zoom: 6');
  });

  after(() => {
    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory`);
    cy.wait(5000);
    cy.get('button[data-test-subj="removeSampleDataSetflights"]')
      .should('be.visible')
      .click();
  });
});
