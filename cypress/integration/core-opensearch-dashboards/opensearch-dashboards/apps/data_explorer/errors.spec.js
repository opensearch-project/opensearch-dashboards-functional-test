/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  TestFixtureHandler,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import {
  DE_DEFAULT_END_TIME,
  DE_DEFAULT_START_TIME,
} from '../../../../../utils/constants';

const miscUtils = new MiscUtils(cy);
const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

describe('errors', () => {
  before(() => {
    // import invalid_scripted_field
    testFixtureHandler.importJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/invalid_scripted_field/mappings.json.txt'
    );

    testFixtureHandler.importJSONDoc(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/invalid_scripted_field/data.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: '18ea0c30-2d77-11e8-93f2-6f8a391f33ef',
    });

    miscUtils.visitPage('app/data-explorer/discover#/');
    cy.waitForLoader();

    cy.setTopNavDate(DE_DEFAULT_START_TIME, DE_DEFAULT_END_TIME);
  });

  // after(() => {
  //   testFixtureHandler.clearJSONMapping(
  //     'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/invalid_scripted_field/mappings.json.txt'
  //   );
  // });

  describe('invalid scripted field error', function () {
    it('is rendered', function () {
      cy.getElementByTestId('painlessStackTrace').should('be.visible');
    });
  });
});
