/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { TestFixtureHandler } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';

const testFixtureHandler = new TestFixtureHandler(
  cy,
  Cypress.env('openSearchUrl')
);

describe('After', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    testFixtureHandler.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt'
    );
    cy.deleteSavedObjectByType('index-pattern');
    cy.deleteAllIndices();
    cy.clearCache();
  });

  it('clean up complete', () => {});
});
