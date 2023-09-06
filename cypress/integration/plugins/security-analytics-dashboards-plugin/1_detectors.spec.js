/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import sample_index_settings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_index_settings.json';
// import dns_rule_data from '../../../fixtures/plugins/security-analytics-dashboards-plugin/integration_tests/rule/create_dns_rule.json';
// import { BACKEND_BASE_PATH } from '../../../utils/base_constants';
// import {
//   NODE_API,
//   OPENSEARCH_DASHBOARDS_URL,
// } from '../../../utils/plugins/security-analytics-dashboards-plugin/constants';

// const testMappings = {
//   properties: {
//     'dns-question-name': {
//       type: 'alias',
//       path: 'DnsQuestionName',
//     },
//   },
// };

// const cypressDNSRule = dns_rule_data.title;

// const createDetector = (detectorName, dataSource, expectFailure) => {
//   // Locate Create detector button click to start
//   cy.get('.euiButton')
//     .filter(':contains("Create detector")')
//     .click({ force: true });

//   // Check to ensure process started
//   cy.contains('Define detector');

//   // Enter a name for the detector in the appropriate input
//   cy.get(`input[placeholder="Enter a name for the detector."]`)
//     .focus()
//     .realType(detectorName);

//   // Select our pre-seeded data source (check cypressIndexDns)
//   cy.get(`[data-test-subj="define-detector-select-data-source"]`)
//     .find('input')
//     .focus()
//     .realType(dataSource);

//   cy.intercept({
//     pathname: NODE_API.RULES_SEARCH,
//     query: {
//       prePackaged: 'true',
//     },
//   }).as('getSigmaRules');

//   // Select threat detector type (Windows logs)
//   cy.get(`input[id="dns"]`).click({ force: true });

//   cy.wait('@getSigmaRules').then(() => {
//     // Open Detection rules accordion
//     cy.get('[data-test-subj="detection-rules-btn"]').click({
//       force: true,
//       timeout: 5000,
//     });

//     cy.contains('table tr', 'DNS', {
//       timeout: 120000,
//     });
//   });

//   // Check that correct page now showing
//   cy.contains('Configure field mapping');

//   if (!expectFailure) {
//     // Select appropriate names to map fields to
//     for (let field_name in testMappings.properties) {
//       const mappedTo = testMappings.properties[field_name].path;

//       cy.contains('tr', field_name).within(() => {
//         cy.get(`[data-test-subj="detector-field-mappings-select"]`)
//           .click()
//           .type(mappedTo);
//       });
//     }
//   }

//   // Click Next button to continue
//   cy.get('button').contains('Next').click({ force: true });

//   // Check that correct page now showing
//   cy.contains('Set up alert triggers');

//   // Type name of new trigger
//   cy.get(`input[placeholder="Enter a name to describe the alert condition"]`)
//     .focus()
//     .realType('test_trigger');

//   // Type in (or select) tags for the alert condition
//   cy.get(`[data-test-subj="alert-tags-combo-box"]`)
//     .find('input')
//     .focus()
//     .realType('attack.defense_evasion')
//     .realPress('Enter');

//   // Select applicable severity levels
//   cy.get(`[data-test-subj="security-levels-combo-box"]`).click({ force: true });
//   cy.contains('1 (Highest)').click({ force: true });

//   // Continue to next page
//   cy.contains('Next').click({ force: true });

//   // Confirm page is reached
//   cy.contains('Review and create');

//   // Confirm field mappings registered
//   cy.contains('Field mapping');

//   if (!expectFailure) {
//     for (let field in testMappings.properties) {
//       const mappedTo = testMappings.properties[field].path;

//       cy.contains(field);
//       cy.contains(mappedTo);
//     }
//   }

//   // Confirm entries user has made
//   cy.contains('Detector details');
//   cy.contains(detectorName);
//   cy.contains('dns');
//   cy.contains('test_trigger');

//   // Create the detector
//   cy.get('button').contains('Create').click({ force: true });
//   cy.contains(detectorName);

//   cy.contains('Attempting to create the detector.');

//   // Confirm detector active
//   cy.contains(detectorName);
//   cy.contains('Active');

//   if (!expectFailure) {
//     cy.contains('Actions');
//   }

//   cy.contains('Detector configuration');
//   cy.contains('Field mappings');
//   cy.contains('Alert triggers');
//   cy.contains('Detector details');
//   cy.contains('Created at');
//   cy.contains('Last updated time');
// };

// describe('Detectors', () => {
//   const cypressIndexDns = 'cypress-index-dns';
//   const cypressIndexWindows = 'cypress-index-windows';
//   const detectorName = 'test detector';

//   before(() => {
//     cy.cleanUpTests();

//     cy.createIndex(cypressIndexWindows, null, sample_index_settings);

//     // Create test index
//     cy.createIndex(cypressIndexDns, null, sample_index_settings).then(() =>
//       cy
//         .request({
//           method: 'POST',
//           url: `${BACKEND_BASE_PATH}${NODE_API.RULES_BASE}/_search?pre_packaged=true`,
//           headers: {
//             'osd-xsrf': true,
//           },
//           body: {
//             from: 0,
//             size: 5000,
//             query: {
//               nested: {
//                 path: 'rule',
//                 query: {
//                   bool: { must: [{ match: { 'rule.category': 'dns' } }] },
//                 },
//               },
//             },
//           },
//         })
//         .should('have.property', 'status', 200)
//     );

//     cy.createRule(dns_rule_data);
//   });

//   beforeEach(() => {
//     cy.intercept(NODE_API.SEARCH_DETECTORS).as('detectorsSearch');
//     // Visit Detectors page
//     cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/detectors`);
//     cy.wait('@detectorsSearch').should('have.property', 'state', 'Complete');

//     // Check that correct page is showing
//     cy.contains('Threat detectors');
//   });

//   it('...should show mappings warning', () => {
//     // Locate Create detector button click to start
//     cy.get('.euiButton')
//       .filter(':contains("Create detector")')
//       .click({ force: true });

//     // Check to ensure process started
//     cy.contains('Define detector');

//     // Select our pre-seeded data source (check cypressIndexDns)
//     cy.get(`[data-test-subj="define-detector-select-data-source"]`)
//       .find('input')
//       .focus()
//       .realType(cypressIndexDns);

//     // Select threat detector type (Windows logs)
//     cy.get(`input[id="dns"]`).click({ force: true });

//     // Select our pre-seeded data source (check cypressIndexDns)
//     cy.get(`[data-test-subj="define-detector-select-data-source"]`)
//       .find('input')
//       .focus()
//       .realType(cypressIndexWindows)
//       .realPress('Enter');

//     cy.get('.euiCallOut')
//       .should('be.visible')
//       .contains(
//         'To avoid issues with field mappings, we recommend creating separate detectors for different log types.'
//       );
//   });

//   it('...can be created', () => {
//     createDetector(detectorName, cypressIndexDns, false);
//     cy.contains('Detector created successfully');
//   });

//   it('...can fail creation', () => {
//     createDetector(`${detectorName}_fail`, '.kibana_1', true);
//     cy.contains('Create detector failed.');
//   });

//   it('...basic details can be edited', () => {
//     // Click on detector name
//     cy.contains(detectorName).click({ force: true });
//     cy.contains('Detector details');
//     cy.contains(detectorName);

//     // Click "Edit" button in detector details
//     cy.get(`[data-test-subj="edit-detector-basic-details"]`).click({
//       force: true,
//     });

//     // Confirm arrival at "Edit detector details" page
//     cy.contains('Edit detector details');

//     // Change detector name
//     cy.get(`input[placeholder="Enter a name for the detector."]`)
//       .realClick()
//       .ospClear()
//       .realType('test detector edited');

//     // Change detector description
//     cy.get(`[data-test-subj="define-detector-detector-description"]`)
//       .focus()
//       .realType('Edited description');

//     // Change input source
//     cy.get('.euiBadge__iconButton > .euiIcon').click({ force: true });
//     cy.get(`[data-test-subj="define-detector-select-data-source"]`)
//       .realType(cypressIndexWindows)
//       .realPress('Enter');

//     // Change detector scheduling
//     cy.get(`[data-test-subj="detector-schedule-number-select"]`)
//       .ospClear()
//       .focus()
//       .realType('10');
//     cy.get(`[data-test-subj="detector-schedule-unit-select"]`).select('Hours');

//     // Save changes to detector details
//     cy.get(`[data-test-subj="save-basic-details-edits"]`).click({
//       force: true,
//     });

//     // Confirm taken to detector details page
//     cy.contains(detectorName);

//     // Verify edits are applied
//     cy.contains('test detector edited');
//     cy.contains('Every 10 hours');
//     cy.contains('Edited description');
//     cy.contains(cypressIndexWindows);
//   });

//   it('...rules can be edited', () => {
//     // Ensure start on main detectors page
//     cy.contains('Threat detectors');

//     // Click on detector name
//     cy.contains(detectorName).click({ force: true });
//     cy.contains('Detector details');
//     cy.contains(detectorName);

//     // Confirm number of rules before edit
//     cy.contains('Active rules (13)');

//     // Click "Edit" button in Detector rules panel
//     cy.get(`[data-test-subj="edit-detector-rules"]`).click({ force: true });

//     // Confirm arrival on "Edit detector rules" page
//     cy.contains('Edit detector rules');

//     // Search for specific rule
//     cy.get(`input[placeholder="Search..."]`).ospSearch(cypressDNSRule);

//     // Toggle single search result to unchecked
//     cy.contains('table tr', cypressDNSRule).within(() => {
//       // Of note, timeout can sometimes work instead of wait here, but is very unreliable from case to case.
//       cy.wait(1000);
//       cy.get('button').eq(1).click({ force: true });
//     });

//     // Save changes
//     cy.get(`[data-test-subj="save-detector-rules-edits"]`).click({
//       force: true,
//     });

//     // Confirm 1 rule has been removed from detector
//     cy.contains('Active rules (12)');

//     // Click "Edit" button in Detector rules panel
//     cy.get(`[data-test-subj="edit-detector-rules"]`).click({ force: true });

//     // Confirm arrival on "Edit detector rules" page
//     cy.contains('Edit detector rules');

//     // Search for specific rule
//     cy.get(`input[placeholder="Search..."]`).ospSearch(cypressDNSRule);

//     // Toggle single search result to checked
//     cy.contains('table tr', cypressDNSRule).within(() => {
//       cy.wait(2000);
//       cy.get('button').eq(1).click({ force: true });
//     });

//     // Save changes
//     cy.get(`[data-test-subj="save-detector-rules-edits"]`).click({
//       force: true,
//     });
//     cy.contains(detectorName);

//     // Confirm 1 rule has been added to detector
//     cy.contains('Active rules (13)');
//   });

//   it('...should update field mappings if data source is changed', () => {
//     // Click on detector name
//     cy.contains(detectorName).click({ force: true });
//     cy.contains('Detector details');
//     cy.contains(detectorName);

//     // Click "Edit" button in detector details
//     cy.get(`[data-test-subj="edit-detector-basic-details"]`).click({
//       force: true,
//     });

//     // Confirm arrival at "Edit detector details" page
//     cy.contains('Edit detector details');

//     cy.get('.reviewFieldMappings').should('not.exist');

//     // Change input source
//     cy.get('.euiBadge__iconButton > .euiIcon').click({ force: true });
//     cy.get(`[data-test-subj="define-detector-select-data-source"]`)
//       .type(cypressIndexWindows)
//       .realPress('Enter');
//   });

//   it('...should update field mappings if rule selection is changed', () => {
//     // Click on detector name
//     cy.contains(detectorName).click({ force: true });
//     cy.contains('Detector details');
//     cy.contains(detectorName);

//     // Click "Edit" button in detector details
//     cy.get(`[data-test-subj="edit-detector-rules"]`).click({ force: true });

//     // Confirm arrival at "Edit detector details" page
//     cy.contains('Edit detector rules');

//     cy.get('.reviewFieldMappings').should('not.exist');

//     cy.intercept(NODE_API.MAPPINGS_VIEW).as('getMappingsView');

//     cy.get('table th').within(() => {
//       cy.get('button').first().click({ force: true });
//     });

//     cy.get('.reviewFieldMappings').should('be.visible');
//   });

//   it('...can be deleted', () => {
//     // Click on detector to be removed
//     cy.contains('test detector edited').click({ force: true });

//     // Confirm page
//     cy.contains('Detector details');

//     // Click "Actions" button, the click "Delete"
//     cy.get('button').contains('Actions').click({ force: true });
//     cy.get('button').contains('Delete').click({ force: true });

//     // Confirm detector is deleted
//     cy.contains('There are no existing detectors');
//   });

//   after(() => cy.cleanUpTests());
// });
