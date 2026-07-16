/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { CURRENT_TENANT } from '../../../utils/commands';

describe('Add flights dataset saved object', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
      retryOnStatusCodeFailure: true,
      timeout: 60000,
    });
    // Accept either "Add data" (flights not installed) or "View data"
    // (already installed from an earlier spec whose after-hook may not have
    // completed uninstall in time). Matches spec #2's own regex.
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

  after(() => {
    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory`);
    cy.wait(5000);
    cy.get('button[data-test-subj="removeSampleDataSetflights"]', {
      timeout: 120000,
    })
      .should('be.visible')
      .click();
  });

  it('check if maps saved object of flights dataset can be found and open', () => {
    cy.wait(10000);
    cy.visit(`${BASE_PATH}/app/maps-dashboards`);
    cy.wait(10000);
    cy.contains('[Flights] Flights Status on Maps Destination Location', {
      timeout: 120000,
    }).click();
    cy.get('[data-test-subj="layerControlPanel"]').should(
      'contain',
      'Flights On Time',
      { timeout: 120000 }
    );
  });
});
