/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DETECTOR_TRIGGER_TIMEOUT,
  OPENSEARCH_DASHBOARDS_URL,
} from '../../../utils/plugins/security-analytics-dashboards-plugin/constants';
import sample_index_settings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_index_settings.json';
import sample_dns_settings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/index/create_dns_settings.json';
import windows_usb_rule_data from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/rule/create_windows_usb_rule.json';
import dns_rule_data from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/rule/create_dns_rule.json';
import usb_detector_data from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/detector/create_usb_detector_data.json';
import usb_detector_data_mappings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/detector/create_usb_detector_mappings_data.json';
import dns_detector_data_mappings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/detector/create_dns_detector_mappings_data.json';
import dns_detector_data from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/detector/create_dns_detector_data.json';
import add_windows_index_data from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/index/add_windows_index_data.json';
import add_dns_index_data from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/index/add_dns_index_data.json';
import { setupIntercept } from '../../../utils/plugins/security-analytics-dashboards-plugin/helpers';

describe('Integration tests', () => {
  const indexName = 'cypress-index-windows';
  const dnsName = 'cypress-index-dns';

  before(() => {
    cy.cleanUpTests();

    // Create custom rules
    cy.createRule(windows_usb_rule_data).then((response) => {
      usb_detector_data.inputs[0].detector_input.custom_rules[0].id =
        response.body.response._id;
      usb_detector_data.triggers[0].ids.push(response.body.response._id);
    });
    cy.createRule(dns_rule_data).then((response) => {
      dns_detector_data.inputs[0].detector_input.custom_rules[0].id =
        response.body.response._id;
      dns_detector_data.triggers[0].ids.push(response.body.response._id);
    });

    // Create test index
    cy.createIndex(indexName, null, sample_index_settings);
    cy.createIndex(dnsName, null, sample_dns_settings);

    // Create detectors
    cy.createAliasMappings(
      indexName,
      usb_detector_data.detector_type,
      usb_detector_data_mappings,
      true
    ).then(() => cy.createDetector(usb_detector_data));

    cy.createAliasMappings(
      dnsName,
      dns_detector_data.detector_type,
      dns_detector_data_mappings,
      true
    ).then(() => cy.createDetector(dns_detector_data));

    // Ingest docs
    cy.insertDocumentToIndex(indexName, '101', add_windows_index_data);
    cy.insertDocumentToIndex(dnsName, '101', add_dns_index_data);

    // Wait for detector interval to pass
    cy.wait(DETECTOR_TRIGGER_TIMEOUT);
  });

  beforeEach(() => {
    // Visit Detectors page
    cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/detectors`);

    // Wait for page to load
    cy.contains('Threat detectors');
  });

  it('...can navigate to findings page', () => {
    setupIntercept(
      cy,
      '/_plugins/_security_analytics/findings/_search',
      'getFindings',
      'GET'
    );

    // Cypress USB Detector
    cy.contains('Cypress USB Detector')
      .click()
      .then(() => {
        cy.contains('View Findings')
          .click()
          .then(() => {
            cy.hash()
              .should('match', /findings\/.+$/)
              .then((hash) => {
                const detectorId = hash.replace('#/findings/', '');
                if (!detectorId) {
                  throw new Error(
                    'Navigating to findings page should contain detector ID'
                  );
                } else {
                  cy.wait('@getFindings').then((interception) => {
                    const url = new URL(interception.request.url);
                    // The request query param detectorId should match the hash param from the url
                    expect(url.searchParams.get('detectorId')).to.eq(
                      detectorId
                    );
                  });

                  // There should be only one call to the API
                  cy.get('@getFindings.all').should('have.length', 1);
                }
              });
          });
      });
  });
  it('...can navigate to alerts page', () => {
    setupIntercept(
      cy,
      '/_plugins/_security_analytics/alerts',
      'getAlerts',
      'GET'
    );

    // Cypress USB Detector
    cy.contains('Cypress USB Detector')
      .click()
      .then(() => {
        cy.contains('View Alerts')
          .click()
          .then(() => {
            cy.hash()
              .should('match', /alerts\/.+$/)
              .then((hash) => {
                const detectorId = hash.replace('#/alerts/', '');
                if (!detectorId) {
                  throw new Error(
                    'Navigating to alerts page should contain detector ID'
                  );
                } else {
                  cy.wait('@getAlerts').then((interception) => {
                    const url = new URL(interception.request.url);
                    // The request query param detectorId should match the hash param from the url
                    expect(url.searchParams.get('detector_id')).to.eq(
                      detectorId
                    );
                  });

                  // There should be only one call to the API
                  cy.get('@getAlerts.all').should('have.length', 1);
                }
              });
          });
      });
  });

  after(() => cy.cleanUpTests());
});
