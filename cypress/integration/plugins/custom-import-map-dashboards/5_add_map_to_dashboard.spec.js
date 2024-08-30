/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { CURRENT_TENANT } from '../../../utils/commands';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('Add map to dashboard', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.deleteAllIndices();
    miscUtils.addSampleData();
    cy.wait(15000);
  });

  after(() => {
    miscUtils.removeSampleData();
  });

  it('Add new map to dashboard', () => {
    const testMapName = 'saved-map-' + Date.now().toString();
    cy.visit(`${BASE_PATH}/app/dashboards#/create`);
    cy.wait(5000)
      .get('button[data-test-subj="addVisualizationButton"]')
      .click();
    cy.wait(5000)
      .get('button[data-test-subj="visType-customImportMap"]')
      .click();
    cy.wait(5000).get('button[data-test-subj="mapSaveButton"]').click();
    cy.wait(5000).get('[data-test-subj="savedObjectTitle"]').type(testMapName);
    cy.wait(5000)
      .get('[data-test-subj="confirmSaveSavedObjectButton"]')
      .click();
    cy.wait(5000).get('.embPanel__titleText').should('contain', testMapName);
  });
});
