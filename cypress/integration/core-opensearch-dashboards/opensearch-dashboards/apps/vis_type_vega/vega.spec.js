/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import vegaSpec from './test_utils/test_vega_spec.json';
import {
  VEGA_INDEX_ID,
  VEGA_PATH_INDEX_DATA,
  VEGA_INDEX_START_TIME,
  VEGA_INDEX_END_TIME,
  VEGA_CREATE_URL,
  VEGA_VIS_APP_PATH,
  VEGA_INDEX_PATTERN,
} from '../../../../../utils/constants';
import { CURRENT_TENANT } from '../../../../../utils/commands';
import { updateVegaSpec } from './test_utils/utils';

if (!Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('Vega Visualization (MDS disabled)', () => {
    before(() => {
      CURRENT_TENANT.newTenant = 'global';
      cy.fleshTenantSettings();
      cy.deleteIndex(VEGA_INDEX_ID);
      cy.bulkUploadDocs(VEGA_PATH_INDEX_DATA);

      // Dashboards requires an index pattern to continue to the Create Visualization stage
      cy.deleteIndexPattern(VEGA_INDEX_PATTERN);
      cy.createIndexPattern(VEGA_INDEX_PATTERN, {
        title: VEGA_INDEX_ID,
        timeFieldName: 'timestamp',
      });

      // Visit the page
      cy.log('create a new vega visualization: ', VEGA_CREATE_URL);
      cy.visit(VEGA_CREATE_URL);
      cy.url().should('contain', VEGA_VIS_APP_PATH);

      cy.setTopNavDate(VEGA_INDEX_START_TIME, VEGA_INDEX_END_TIME);

      // Wait for page to load
      cy.waitForLoader();
    });

    it('should throw an error when data_source_name is used', () => {
      const updatedVegaSpec = updateVegaSpec({
        dataSourceName: 'non-existent datasource',
        indexName: VEGA_INDEX_ID,
        isDataFieldAnArray: false,
        spec: vegaSpec,
      });

      cy.vegaSetVegaSpec(updatedVegaSpec);
      cy.vegaUpdateVisualization();

      // Visualization shouldn't exist; banner should exist
      cy.get('canvas.marks').should('not.exist');
      cy.get('ul.vgaVis__messages').should('exist');
    });

    it('should query from local cluster when data_source_name is not present', () => {
      const updatedVegaSpec = updateVegaSpec({
        indexName: VEGA_INDEX_ID,
        isDataFieldAnArray: false,
        spec: vegaSpec,
      });

      cy.vegaSetVegaSpec(updatedVegaSpec);
      cy.vegaUpdateVisualization();

      // Visualization should be drawn; correct visualizations do not have warning messages
      cy.get('canvas.marks').should('exist');
      cy.get('ul.vgaVis__messages').should('not.exist');
    });

    after(() => {
      cy.deleteIndex(VEGA_INDEX_ID);
      cy.deleteIndexPattern(VEGA_INDEX_PATTERN);
    });
  });
}
