/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { BASE_PATH } from '../../../utils/base_constants';

const moveToAvailableNginxIntegration = () => {
  cy.visit(`${BASE_PATH}/app/integrations#/available/nginx`);
};

const moveToAddedIntegrations = () => {
  cy.visit(`${BASE_PATH}/app/integrations#/installed`);
};

const createSamples = () => {
  moveToAvailableNginxIntegration();
  cy.get('[data-test-subj="try-it-button"]').click();
  cy.get('.euiToastHeader__title').should('contain', 'successfully');
};

const integrationsTeardown = () => {
  // Delete all integration instances
  cy.request({
    method: 'GET',
    form: false,
    url: `api/integrations/store`,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
    },
  }).then((response) => {
    for (const instance of response.body.data.hits) {
      cy.request({
        method: 'DELETE',
        url: `/api/integrations/store/${instance.id}`,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
      });
    }
  });
  // Also clean up indices
  cy.request({
    method: 'POST',
    form: false,
    url: 'api/console/proxy',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
    },
    qs: {
      path: `ss4o_logs-nginx-*`, // All tests work with ss4o nginx data
      method: 'DELETE',
    },
    body: '{}',
  });
};

describe('Add nginx integration instance flow', () => {
  beforeEach(() => {
    createSamples();
  });

  afterEach(() => {
    integrationsTeardown();
  });

  it('Navigates to nginx page and triggers the adds the instance flow', () => {
    const testInstanceName = 'test_integration_cypress';
    moveToAvailableNginxIntegration();
    cy.get('[data-test-subj="add-integration-button"]').click();
    cy.get('[data-test-subj="new-instance-name"]').should(
      'have.value',
      'nginx Integration'
    );
    cy.get('[data-test-subj="create-instance-button"]').should('be.disabled');
    // Modifies the name of the integration
    cy.get('[data-test-subj="new-instance-name"]').clear();
    cy.get('[data-test-subj="new-instance-name"]').type(testInstanceName);
    // Validates the created sample index
    cy.get('[data-test-subj="data-source-name"]').type(
      'ss4o_logs-nginx-sample-sample{enter}'
    );
    cy.get('[data-test-subj="create-instance-button"]').click();
    cy.get('[data-test-subj="eventHomePageTitle"]').should(
      'contain',
      testInstanceName
    );
  });

  it('Navigates to installed integrations page and verifies that installed integration exists', () => {
    const sampleName = 'nginx-sample';
    moveToAddedIntegrations();
    cy.contains(sampleName).should('exist');
    cy.get('input[type="search"]').eq(0).focus();
    cy.get('input[type="search"]').eq(0).type(`${sampleName}{enter}`);
    cy.get('.euiTableRow').should('have.length', 1); //Filters correctly to the test integration instance
    cy.get(`[data-test-subj="${sampleName}IntegrationLink"]`).click();
    cy.get('[data-test-subj="eventHomePageTitle"]').should(
      'contain',
      sampleName
    );
  });
});
