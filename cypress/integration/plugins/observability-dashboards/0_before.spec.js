/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { testIndexDataSet, BASE_PATH } from '../../../utils/constants';

describe('Before', () => {
  before(() => {
    cy.deleteAllIndices();

    localStorage.setItem('home:welcome:show', 'true');

    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`);

    // Click on "Sample data" tab
    cy.contains('Sample data').click({ force: true });
    // Load sample flights data
    cy.get(`button[data-test-subj="addSampleDataSetflights"]`).click({
      force: true,
    });
    // Load sample logs data
    cy.get(`button[data-test-subj="addSampleDataSetlogs"]`).click({
      force: true,
    });

    // Verify that sample data is add by checking toast notification
    cy.contains('Sample flight data installed', { timeout: 60000 });
    cy.contains('Sample web logs installed', { timeout: 60000 });

    const dumpDataSet = (mapping_url, data_url, index) => {
      cy.request({
        method: 'POST',
        failOnStatusCode: false,
        url: 'api/console/proxy',
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        qs: {
          path: `${index}`,
          method: 'PUT',
        },
      });

      cy.request(mapping_url).then((response) => {
        cy.request({
          method: 'POST',
          form: false,
          url: 'api/console/proxy',
          headers: {
            'content-type': 'application/json;charset=UTF-8',
            'osd-xsrf': true,
          },
          qs: {
            path: `${index}/_mapping`,
            method: 'POST',
          },
          body: response.body,
        });
      });

      cy.request(data_url).then((response) => {
        cy.request({
          method: 'POST',
          form: false,
          url: 'api/console/proxy',
          headers: {
            'content-type': 'application/json;charset=UTF-8',
            'osd-xsrf': true,
          },
          qs: {
            path: `${index}/_bulk`,
            method: 'POST',
          },
          body: response.body,
        });
      });
    };

    testIndexDataSet.forEach(({ mapping_url, data_url, index }) =>
      dumpDataSet(mapping_url, data_url, index)
    );
  });

  it('setup completed', () => {});
});
