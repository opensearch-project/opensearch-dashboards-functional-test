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
    cy.get('[data-test-subj="layerControlPanel"]').should(
      'contain',
      'Flights On Time'
    );
  });
});
