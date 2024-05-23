/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRENT_TENANT } from '../../../utils/commands';

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('data source menu mock test', () => {
    before(() => {
      CURRENT_TENANT.newTenant = 'global';
      cy.deleteAllDataSources();
    });

    describe('create test data source and pass it to data source view', () => {
      let dataSourceId;
      let dataSourceTitle;
      before(() => {
        // create the default data source
        cy.createDataSourceNoAuthWithTitle('default-ds');
        // create data source
        cy.createDataSourceNoAuth().then((result) => {
          dataSourceId = result[0];
          dataSourceTitle = result[1];
        });
      });

      after(() => {
        if (dataSourceId) {
          cy.deleteDataSource(dataSourceId);
        }
      });
      it('Should display AggregatedView', () => {
        cy.visit('app/multiple-data-source-example/list_active');
        cy.viewDataSourceAggregatedView();
      });
      it('Should display DataSourceSelectable', () => {
        cy.visit('app/multiple-data-source-example/single_selectable');
        cy.selectFromDataSourceSelectable(dataSourceTitle, dataSourceId);
      });
    });
  });
}
