/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';
import { CURRENT_TENANT } from '../../../utils/commands';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import 'cypress-file-upload';

const miscUtils = new MiscUtils(cy);

describe('Verify successful custom geojson file upload', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.deleteAllIndices();
    miscUtils.addSampleData();
    cy.wait(15000);

    // Load region map visualization with sample data opensearch_dashboards_sample_data_flights
    cy.visit(
      `${BASE_PATH}/app/visualize#/create?type=region_map&indexPattern=d3d7af60-4c81-11e8-b3d7-01146121b73d`,
      {
        retryOnStatusCodeFailure: true,
        timeout: 60000,
      }
    );
  });

  it('checks if the file uploaded successfully', () => {
    // Click on "Import Vector Map" tab, which is part of customImportMap plugin
    cy.contains('Import Vector Map').click({ force: true });

    cy.get('[data-testId="filePicker"]').attachFile(
      'plugins/custom-import-map-dashboards/sample_geo.json'
    );
    cy.get('[data-testId="customIndex"]').type('sample');
    cy.contains('Import file').click({ force: true });
    cy.contains(
      'Successfully added 2 features to sample-map. Refresh to visualize the uploaded map.',
      { timeout: 240000 }
    );
  });

  after(() => {
    miscUtils.removeSampleData();
  });
});
