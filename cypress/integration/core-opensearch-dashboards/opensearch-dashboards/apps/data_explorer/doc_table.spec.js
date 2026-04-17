/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { CURRENT_TENANT } from '../../../../../utils/commands';

const miscUtils = new MiscUtils(cy);
const indexSet = [
  'logstash-2015.09.22',
  'logstash-2015.09.21',
  'logstash-2015.09.20',
];

describe('discover doc table', { testIsolation: false }, () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.fleshTenantSettings();

    cy.importJSONDocIfNeeded(
      indexSet,
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.mappings.json.txt',
      'cypress/fixtures/dashboard/opensearch_dashboards/data_explorer/logstash/logstash.json.txt'
    );

    cy.setAdvancedSetting({
      defaultIndex: 'logstash-*',
    });

    miscUtils.visitPage(
      `app/data-explorer/discover#/?_g=(filters:!(),time:(from:'2015-09-19T13:31:44.000Z',to:'2015-09-24T01:31:44.000Z'))`
    );
    cy.waitForLoader();
    // Wait for discover app to fully initialize
    cy.get(
      '[data-test-subj="queryInput"], [data-test-subj="osdQueryEditor__multiLine"], [data-test-subj="osdQueryEditor__singleLine"]',
      { timeout: 120000 }
    );
    // Handle the uninitialized "Start searching" state if searchOnPageLoad is off
    cy.get(
      '[data-test-subj="docTable"], [data-test-subj="discoverNoResults"], [data-test-subj="loadingSpinner"], [data-test-subj="discover-refreshDataButton"]',
      { timeout: 60000 }
    ).then(($el) => {
      if ($el.filter('[data-test-subj="discover-refreshDataButton"]').length) {
        cy.getElementByTestId('discover-refreshDataButton').click();
      }
    });
    cy.waitForSearch();
  });

  it('should show the doc table', () => {
    cy.getElementByTestId('docTable', { timeout: 60000 }).should('exist');
  });

  it('should add columns to the table', () => {
    cy.get('[data-test-subj="fieldFilterSearchInput"]', { timeout: 60000 })
      .clear()
      .type('phpmemory');

    cy.wait(2000);

    cy.get('[data-test-subj="fieldToggle-phpmemory"]', {
      timeout: 60000,
    }).click({ force: true });

    cy.get('[data-test-subj="docTableHeader-phpmemory"]', {
      timeout: 60000,
    }).should('exist');
  });

  it('should remove columns from the table', () => {
    cy.get('[data-test-subj="fieldToggle-phpmemory"]', {
      timeout: 60000,
    }).click({ force: true });

    cy.get('[data-test-subj="docTableHeader-phpmemory"]', {
      timeout: 60000,
    }).should('not.exist');
  });
});
