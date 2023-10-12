/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { TestFixtureHandler } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

describe('After', () => {
  before(() => {
    //cy.deleteAllIndices();
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt'
    );
    cy.deleteSavedObjectByType('index-pattern');
  });

  it('clean up complete', () => {});
});
