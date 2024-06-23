/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  describe('Create datasources', () => {
    before(() => {
      // Clean up before creating new data sources for testing
      cy.deleteAllDataSources();
      cy.createDataSourceNoAuthWithTitle('ds_1');
      cy.wait(6000);
    });

    after(() => {
      // Clean up after all test are run
      cy.deleteAllDataSources();
      // remove the default data source
      cy.setAdvancedSetting({
        defaultDataSource: '',
      });
    });

    describe('Check datasource contains version decouple related information', () => {
      it('check installed plugins and data source version information is showed', () => {
        cy.request({
          method: 'GET',
          url: '/api/saved_objects/_find?type=data-source',
        }).then((response) => {
          const savedObjects = response.body.saved_objects;
          expect(
            savedObjects,
            'Data sources should exist'
          ).to.have.length.greaterThan(0);

          const dataSource = savedObjects[0];
          const { attributes } = dataSource;
          expect(attributes).to.have.property('dataSourceVersion');
          expect(attributes).to.have.property('installedPlugins');
        });
      });
    });
  });
}
