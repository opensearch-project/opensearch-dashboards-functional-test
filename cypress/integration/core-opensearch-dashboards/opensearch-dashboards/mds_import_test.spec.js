/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../utils/commands';
import 'cypress-file-upload';

const miscUtils = new MiscUtils(cy);

if (Cypress.env('DATASOURCE_MANAGEMENT_ENABLED')) {
  let dataSourceTitle;

  describe('import saved object test', () => {
    before(() => {
      // Go to the saved object page
      cy.deleteAllDataSources();
      cy.wait(1000);

      cy.deleteAllSavedObjects();
      miscUtils.visitPage('app/management/opensearch-dashboards/objects');

      CURRENT_TENANT.newTenant = 'global';
      cy.wait(1000);

      // create data source
      cy.createDataSourceNoAuth().then((result) => {
        dataSourceTitle = result[1];
      });
      cy.reload(true);
      cy.wait(1000);
    });

    after(() => {
      cy.deleteAllSavedObjects();
    });

    it('can import saved objects from ndjson file and create new copies', () => {
      cy.uploadSavedObjectsToDataSource(
        'createNewCopiesEnabled',
        '',
        dataSourceTitle
      );
    });
    it('can import saved objects from ndjson file and automatically override conflict', () => {
      cy.uploadSavedObjectsToDataSource(
        'createNewCopiesDisabled',
        'overwriteEnabled',
        dataSourceTitle
      );
    });

    it('can import saved objects from ndjson file and request action when conflict exit', () => {
      cy.uploadSavedObjectsToDataSource(
        'createNewCopiesDisabled',
        'overwriteDisabled',
        dataSourceTitle
      );
    });
  });
}
