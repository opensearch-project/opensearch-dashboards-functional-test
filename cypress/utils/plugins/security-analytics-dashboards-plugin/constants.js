/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import sample_detector from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/detector/create_usb_detector_data.json';

export const TWENTY_SECONDS_TIMEOUT = { timeout: 20000 };

export const DETECTOR_TRIGGER_TIMEOUT = 65000;

export const FEATURE_SYSTEM_INDICES = {
  DETECTORS_INDEX: '.opensearch-detectors-config',
  DETECTOR_QUERIES_INDEX: '.opensearch-sap-windows-detectors-queries',
  PRE_PACKAGED_RULES_INDEX: '.opensearch-pre-packaged-rules-config',
  CUSTOM_RULES_INDEX: '.opensearch-custom-rules-config',
  WINDOWS_ALERTS_INDEX: '.opensearch-sap-windows-alerts*',
  WINDOWS_FINDINGS_INDEX: '.opensearch-sap-windows-findings*',
};

export const PLUGIN_NAME = 'opensearch_security_analytics_dashboards';

export const BASE_API_PATH = '/_plugins/_security_analytics';

export const NODE_API = {
  DETECTORS_BASE: `${BASE_API_PATH}/detectors`,
  CORRELATION_BASE: `${BASE_API_PATH}/correlation/rules`,
  SEARCH_DETECTORS: `${BASE_API_PATH}/detectors/_search`,
  INDICES_BASE: `${BASE_API_PATH}/indices`,
  FINDINGS_BASE: `${BASE_API_PATH}/findings`,
  GET_FINDINGS: `${BASE_API_PATH}/findings/_search`,
  DOCUMENT_IDS_QUERY: `${BASE_API_PATH}/document_ids_query`,
  TIME_RANGE_QUERY: `${BASE_API_PATH}/time_range_query`,
  MAPPINGS_BASE: `${BASE_API_PATH}/mappings`,
  MAPPINGS_VIEW: `${BASE_API_PATH}/mappings/view`,
  GET_ALERTS: `${BASE_API_PATH}/alerts`,
  RULES_BASE: `${BASE_API_PATH}/rules`,
  CHANNELS: `${BASE_API_PATH}/_notifications/channels`,
  PLUGINS: `${BASE_API_PATH}/_notifications/plugins`,
  ACKNOWLEDGE_ALERTS: `${BASE_API_PATH}/detectors/{detector_id}/_acknowledge/alerts`,
  UPDATE_ALIASES: `${BASE_API_PATH}/update_aliases`,
  CORRELATIONS: `${BASE_API_PATH}/correlations`,
  LOGTYPE_BASE: `${BASE_API_PATH}/logtype`,
  INDEX_TEMPLATE_BASE: '/_index_template',
};

export const { baseUrl: OPENSEARCH_DASHBOARDS } = Cypress.config();
export const OPENSEARCH_DASHBOARDS_URL = `${OPENSEARCH_DASHBOARDS}/app/${PLUGIN_NAME}#`;

export const createDetector = (
  detectorName,
  indexName,
  indexSettings,
  indexMappings,
  ruleSettings,
  indexDoc,
  indexDocsCount = 1
) => {
  Cypress.log({
    message: `Create new detector ${detectorName}`,
  });
  const detectorConfigAlertCondition = `${detectorName} alert condition`;
  const detectorConfig = {
    ...sample_detector,
    name: detectorName,
    inputs: [
      {
        detector_input: {
          ...sample_detector.inputs[0].detector_input,
          description: `Description for ${detectorName}`,
          indices: [indexName],
        },
      },
    ],
    triggers: [
      {
        ...sample_detector.triggers[0],
        name: detectorConfigAlertCondition,
      },
    ],
  };

  cy.cleanUpTests()
    // Create test index
    .then(() => cy.createIndex(indexName, indexSettings))

    // Create field mappings
    .then(() =>
      cy.createAliasMappings(
        indexName,
        detectorConfig.detector_type,
        indexMappings,
        true
      )
    )
    // Create rule
    .then(() => {
      cy.createRule(ruleSettings)
        .then((response) => {
          detectorConfig.inputs[0].detector_input.custom_rules[0].id =
            response.body.response._id;
          detectorConfig.triggers[0].ids.push(response.body.response._id);
        })
        // create the detector
        .then(() => cy.createDetector(detectorConfig));
    })
    .then(() => {
      // Go to the detectors table page
      cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/detectors`);

      // Filter table to only show the test detector
      cy.get(`input[type="search"]`).type(`${detectorConfig.name}{enter}`);

      // Confirm detector was created
      cy.get('tbody > tr').should(($tr) => {
        expect($tr, 'detector name').to.contain(detectorConfig.name);
      });
    });

  // Wait for the first run to execute before ingesting data
  cy.wait(65000);
  // Ingest documents to the test index
  for (let i = 0; i < indexDocsCount; i++) {
    cy.insertDocumentToIndex(indexName, '', indexDoc);
  }

  return detectorConfig;
};
