/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
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
import { DS_BASIC_AUTH_LABEL } from '../../../../../utils/dashboards/datasource-management-dashboards-plugin/constants';

describe('Vega Visualization', () => {
  const updateVegaSpec = ({
    dataSourceName,
    indexName,
    isDataFieldAnArray,
    spec,
  }) => {
    const newSpec = _.cloneDeep(spec);
    if (isDataFieldAnArray) {
      if (dataSourceName) {
        newSpec.data[0].url.data_source_name = dataSourceName;
      }
      newSpec.data[0].url.index = indexName;
    } else {
      if (dataSourceName) {
        newSpec.data.url.data_source_name = dataSourceName;
      }
      newSpec.data.url.index = indexName;
    }

    return newSpec;
  };

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

  if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
    before(() => {
      cy.deleteDataSourceIndexBasicAuth(VEGA_INDEX_ID);
      cy.deleteDataSourceIndexBasicAuth(VEGA_INDEX_ID);

      cy.createDataSourceBasicAuth();
      cy.bulkUploadDocsToDataSourceBasicAuth(VEGA_PATH_INDEX_DATA);
    });

    describe('When MDS is enabled', () => {
      [
        {
          dataSourceName: DS_BASIC_AUTH_LABEL,
          canvasExists: 'exist',
          vegaVisMessagesExists: 'not.exist',
        },
        {
          dataSourceName: 'non-existent datasource',
          canvasExists: 'not.exist',
          vegaVisMessagesExists: 'exist',
        },
      ].forEach(({ dataSourceName, canvasExists, vegaVisMessagesExists }) => {
        it(`should query data from ${dataSourceName} and resulting visualization should ${canvasExists}`, () => {
          const updatedVegaSpec = updateVegaSpec({
            dataSourceName,
            indexName: VEGA_INDEX_ID,
            isDataFieldAnArray: false,
            spec: vegaSpec,
          });

          cy.vegaSetVegaSpec(updatedVegaSpec);
          cy.vegaUpdateVisualization();

          cy.get('canvas.marks').should(canvasExists);
          cy.get('ul.vgaVis__messages').should(vegaVisMessagesExists);
        });
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
    });
  } else {
    describe('When MDS is disabled', () => {
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
    });
  }

  after(() => {
    cy.deleteIndex(VEGA_INDEX_ID);
    cy.deleteIndexPattern(VEGA_INDEX_PATTERN);

    if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
      cy.deleteDataSourceIndexBasicAuth(VEGA_INDEX_ID);
      cy.deleteAllDataSources();
    }
  });
});
