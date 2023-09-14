/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { BASE_PATH } from '../../../utils/constants';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
describe('Verify the presence of import custom map tab in region map plugin', () => {
  before(() => {
    cy.deleteAllIndices();
    miscUtils.addSampleData();

    // Load region map visualization with sample data opensearch_dashboards_sample_data_flights
    cy.visit(
      `${BASE_PATH}/app/visualize#/create?type=region_map&indexPattern=d3d7af60-4c81-11e8-b3d7-01146121b73d`,
      {
        retryOnStatusCodeFailure: true,
        timeout: 60000,
      }
    );
  });

  it('checks import custom map tab is present', () => {
    // Click on "Import Vector Map" tab, which is part of customImportMap plugin
    cy.contains('Import Vector Map').click({ force: true });
  });

  after(() => {
    miscUtils.removeSampleData();
  });
});
