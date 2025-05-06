/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../utils/commands';

const miscUtils = new MiscUtils(cy);

describe('Add flights dataset saved object', function () {
  before(function () {
    // visit base url
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    CURRENT_TENANT.newTenant = 'global';
    cy.deleteAllIndices();
    miscUtils.addSampleData();
    cy.wait(10000);

    // Enable the new home UI if possible
    cy.visit(`${BASE_PATH}/app/settings`);
    cy.get(
      '[data-test-subj="advancedSetting-editField-home:useNewHomePage"]'
    ).then(($switch) => {
      if ($switch.prop('disabled')) {
        cy.log('Switch is disabled and cannot be changed.');
        this.skip(); // Skip all tests in this suite
      } else if ($switch.attr('aria-checked') === 'false') {
        cy.wrap($switch).click();
        cy.get('[data-test-subj="advancedSetting-saveButton"]').click();
        cy.get('button.euiButton--primary.euiButton--small', {
          timeout: 15000,
        }).click();
      } else {
        cy.log('The switch is already on.');
      }
    });
  });

  after(() => {
    miscUtils.removeSampleData();
    // Disable the new home UI if possible
    cy.visit(`${BASE_PATH}/app/settings`);
    cy.get(
      '[data-test-subj="advancedSetting-editField-home:useNewHomePage"]'
    ).then(($switch) => {
      if ($switch.prop('disabled')) {
        cy.log('Switch is disabled and cannot be changed.');
      } else if ($switch.attr('aria-checked') === 'true') {
        cy.wrap($switch).click();
        cy.get('[data-test-subj="advancedSetting-saveButton"]').click();
        cy.get('button.euiButton--primary.euiButton--small', {
          timeout: 15000,
        }).click();
      } else {
        cy.log('The switch is already off.');
      }
    });
  });

  it('Verify component in maps listing page', () => {
    cy.visit(`${BASE_PATH}/app/maps-dashboards`);

    // Verify the presence of the headerRightControl component
    cy.get('[data-test-subj="headerRightControl"]').should('exist');

    // Verify the presence of the maps createButton within the headerRightControl
    cy.get('[data-test-subj="headerRightControl"]')
      .find('[data-test-subj="createButton"]')
      .should('exist');
  });

  it('Verify component in maps visualization page', () => {
    cy.visit(`${BASE_PATH}/app/maps-dashboards/create`);

    // Verify the presence of the top-nav component
    cy.get('[data-test-subj="top-nav"]').should('exist');

    // Verify the presence of the mapSaveButton inside the top-nav component
    cy.get('[data-test-subj="top-nav"]')
      .find('[data-test-subj="mapSaveButton"]')
      .should('exist');
  });
});
