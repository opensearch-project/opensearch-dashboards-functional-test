/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../utils/commands';

const miscUtils = new MiscUtils(cy);

describe('Add map to dashboard', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.deleteAllIndices();
    miscUtils.addSampleData();
    cy.wait(15000);
  });

  it('Add new map to dashboard', () => {
    const testMapName = 'saved-map-' + Date.now().toString();
    cy.visit(`${BASE_PATH}/app/dashboards`);
    cy.get('[data-test-subj="newItemButton"]').click();
    cy.get('button[data-test-subj="dashboardAddNewPanelButton"]').click();
    cy.get('button[data-test-subj="visType-customImportMap"]').click();
    cy.wait(5000).get('button[data-test-subj="mapSaveButton"]').click();
    cy.wait(5000).get('[data-test-subj="savedObjectTitle"]').type(testMapName);
    cy.wait(5000)
      .get('[data-test-subj="confirmSaveSavedObjectButton"]')
      .click();
    cy.get('.embPanel__titleText').should('contain', testMapName);
  });

  after(() => {
    miscUtils.removeSampleData();
  });
});
