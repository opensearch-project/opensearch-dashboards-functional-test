/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';

if (!Cypress.env('SECURITY_ENABLED')) {
  describe('Default OpenSearch base map layer', () => {
    before(() => {
      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory`, {
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
      cy.visit(`${BASE_PATH}/app/maps-dashboards`);
      cy.contains('Create map').click();
      cy.get('[data-test-subj="layerControlPanel"]').should(
        'contain',
        'Default map'
      );

      for (let i = 0; i < 5; i++) {
        cy.wait(500)
        cy.get('.maplibregl-ctrl-zoom-in').click();
      }
      cy.get('[data-test-subj="mapStatusBar"]').should('contain', 'zoom: 6');
    });

    after(() => {
      cy.visit(`${BASE_PATH}/app/home#/tutorial_directory`);
      cy.get('button[data-test-subj="removeSampleDataSetflights"]')
        .should('be.visible')
        .click();
    });
  });
}
