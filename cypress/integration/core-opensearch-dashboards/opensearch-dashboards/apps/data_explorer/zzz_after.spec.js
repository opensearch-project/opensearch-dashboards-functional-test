/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { CURRENT_TENANT } from '../../../../../utils/commands';

describe('After', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    //cy.deleteAllIndices();
    cy.clearJSONMapping(
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt'
    );
    cy.deleteSavedObjectByType('index-pattern');
  });

  it('clean up complete', () => {});
});
