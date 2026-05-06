/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';

const miscUtils = new MiscUtils(cy);

describe('source filters', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/visualize_source-filters/mappings.json.txt'
    );

    cy.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/visualize_source-filters/data.json.txt'
    );

    // Go to the Discover page
    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForLoader();
  });

  after(() => {
    cy.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/visualize_source-filters/mappings.json.txt'
    );
  });

  it('should not get the field referer', function () {
    cy.getElementByTestId('fieldFilterSearchInput').type('referer');

    cy.getElementByTestId('fieldToggle-referer').should('not.exist');
  });
});
