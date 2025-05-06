/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../utils/commands';

const miscUtils = new MiscUtils(cy);

describe('Add flights dataset saved object', () => {
  before(() => {
    // visit base url
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    CURRENT_TENANT.newTenant = 'global';
    cy.deleteAllIndices();
    miscUtils.addSampleData();
    cy.wait(10000);
  });

  after(() => {
    miscUtils.removeSampleData();
  });

  it('check if maps saved object of flights dataset can be found and open', () => {
    cy.visit(`${BASE_PATH}/app/maps-dashboards`);
    cy.contains(
      '[Flights] Flights Status on Maps Destination Location'
    ).click();
    cy.wait(1000);
    cy.get('[data-test-subj="layerControlPanel"]').should(
      'contain',
      'Flights On Time'
    );
  });
});
