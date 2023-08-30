/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DETECTOR_TRIGGER_TIMEOUT,
  OPENSEARCH_DASHBOARDS_URL,
} from '../../../utils/plugins/security-analytics-dashboards-plugin/constants';
import sample_index_settings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_index_settings.json';
import sample_alias_mappings from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_alias_mappings.json';
import sample_detector from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_detector.json';
import sample_document from '../../../fixtures/plugins/security-analytics-dashboards-plugin/sample_document.json';

const testIndex = 'sample_alerts_spec_cypress_test_index';
const testDetectorName = 'alerts_spec_cypress_test_detector';
const testDetectorAlertCondition = `${testDetectorName} alert condition`;

// Creating a unique detector JSON for this test spec
const testDetector = {
  ...sample_detector,
  name: testDetectorName,
  inputs: [
    {
      detector_input: {
        ...sample_detector.inputs[0].detector_input,
        description: `Description for ${testDetectorName}`,
        indices: [testIndex],
      },
    },
  ],
  triggers: [
    {
      ...sample_detector.triggers[0],
      name: testDetectorAlertCondition,
    },
  ],
};

// The exact minutes/seconds for the start and last updated time will be difficult to predict,
// but all of the alert time fields should all contain the date in this format.

// Moment is not available in this repository, so refactored this variable to use Date.
// const date = moment(moment.now()).format('MM/DD/YY');
const now = new Date(Date.now());
const month =
  now.getMonth() + 1 < 10 ? `0${now.getMonth() + 1}` : `${now.getMonth() + 1}`;
const day = now.getDate() < 10 ? `0${now.getDate()}` : `${now.getDate()}`;
const year = `${now.getFullYear()}`.substr(2);
const date = `${month}/${day}/${year}`;

const docCount = 4;
describe('Alerts', () => {
  before(() => {
    // Delete any pre-existing test detectors
    cy.cleanUpTests()
      // Create test index
      .then(() => cy.createIndex(testIndex, null, sample_index_settings))

      // Create field mappings
      .then(() =>
        cy.createAliasMappings(
          testIndex,
          testDetector.detector_type,
          sample_alias_mappings,
          true
        )
      )

      // Create test detector
      .then(() => cy.createDetector(testDetector))

      .then(() => {
        // Go to the detectors table page
        cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/detectors`);

        // Check that correct page is showing
        cy.contains('Threat detectors');

        // Filter table to only show the test detector
        cy.get(`input[type="search"]`).type(`${testDetector.name}{enter}`);

        // Confirm detector was created
        cy.get('tbody > tr').should(($tr) => {
          expect($tr, 'detector name').to.contain(testDetector.name);
        });
      });

    // Ingest documents to the test index
    for (let i = 0; i < docCount; i++) {
      cy.insertDocumentToIndex(testIndex, '', sample_document);
    }

    // Wait for the detector to execute
    cy.wait(DETECTOR_TRIGGER_TIMEOUT);
  });

  beforeEach(() => {
    // Visit Alerts table page
    cy.visit(`${OPENSEARCH_DASHBOARDS_URL}/alerts`);
    cy.wait(15000);

    // Wait for page to load
    cy.contains('Security alerts');

    // Filter table to only show alerts for the test detector
    cy.get(`input[type="search"]`)
      .focus()
      .type(`${testDetector.name}`)
      .type('{enter}');

    // Adjust the date range picker to display alerts from today
    cy.get(
      '[class="euiButtonEmpty__text euiQuickSelectPopover__buttonText"]'
    ).click({ force: true });
    cy.get('[data-test-subj="superDatePickerCommonlyUsed_Today"]').click({
      force: true,
    });
  });

  it('are generated', () => {
    // Refresh the table
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]').click({
      force: true,
    });

    // Confirm there are alerts created
    cy.get('tbody > tr')
      .filter(`:contains(${testDetectorAlertCondition})`)
      .should('have.length', docCount);
  });

  it('contain expected values in table', () => {
    // Confirm there is a row containing the expected values
    cy.get('tbody > tr').should(($tr) => {
      expect($tr, 'start time').to.contain(date);
      expect($tr, 'trigger name').to.contain(testDetector.triggers[0].name);
      expect($tr, 'detector name').to.contain(testDetector.name);
      expect($tr, 'status').to.contain('Active');
      expect($tr, 'severity').to.contain('4 (Low)');
    });
  });

  it('contain expected values in alert details flyout', () => {
    cy.get('tbody > tr')
      .first()
      .within(() => {
        // Click the "View details" button for the first alert
        cy.get('[aria-label="View details"]').click({ force: true });
      });

    // Get the details flyout, and validate its content
    cy.get('[data-test-subj="alert-details-flyout"]').within(() => {
      // Confirm alert condition name
      cy.get(
        '[data-test-subj="text-details-group-content-alert-trigger-name"]'
      ).contains(testDetector.triggers[0].name);

      // Confirm alert status
      cy.get(
        '[data-test-subj="text-details-group-content-alert-status"]'
      ).contains('Active');

      // Confirm alert severity
      cy.get(
        '[data-test-subj="text-details-group-content-alert-severity"]'
      ).contains('4 (Low)');

      // Confirm alert start time is present
      cy.get(
        '[data-test-subj="text-details-group-content-start-time"]'
      ).contains(date);

      // Confirm alert last updated time is present
      cy.get(
        '[data-test-subj="text-details-group-content-last-updated-time"]'
      ).contains(date);

      // Confirm alert detector name
      cy.get('[data-test-subj="text-details-group-content-detector"]').contains(
        testDetector.name
      );

      // Wait for the findings table to finish loading
      cy.contains('Findings (1)');
      cy.contains('USB Device Plugged');

      // Confirm alert findings contain expected values
      cy.get('tbody > tr').should(($tr) => {
        expect($tr, `timestamp`).to.contain(date);
        expect($tr, `rule name`).to.contain('USB Device Plugged');
        expect($tr, `detector name`).to.contain(testDetector.name);
        expect($tr, `log type`).to.contain('Windows');
      });

      // Close the flyout
      cy.get('[data-test-subj="alert-details-flyout-close-button"]').click({
        force: true,
      });
    });

    // Confirm flyout has been closed
    cy.contains('[data-test-subj="alert-details-flyout"]').should('not.exist');
  });

  it('contain expected values in finding details flyout', () => {
    // Open first alert details flyout
    cy.get('tbody > tr')
      .first()
      .within(() => {
        // Click the "View details" button for the first alert
        cy.get('[aria-label="View details"]').click({ force: true });
      });

    cy.get('[data-test-subj="alert-details-flyout"]').within(() => {
      // Wait for findings table to finish loading
      cy.contains('USB Device Plugged');

      // Click the details button for the first finding
      cy.get('tbody > tr')
        .first()
        .within(() => {
          cy.get('[data-test-subj="finding-details-flyout-button"]').click({
            force: true,
          });
        });
    });

    // Confirm the details flyout contains the expected content
    cy.get('[data-test-subj="finding-details-flyout"]').within(() => {
      // Confirm finding ID is present
      cy.get('[data-test-subj="finding-details-flyout-finding-id"]')
        .invoke('text')
        .then((text) => expect(text).to.have.length.greaterThan(1));

      // Confirm finding timestamp
      cy.get('[data-test-subj="finding-details-flyout-timestamp"]').contains(
        date
      );

      // Confirm finding detector name
      cy.get(
        '[data-test-subj="finding-details-flyout-detector-link"]'
      ).contains(testDetector.name);

      // Confirm there's only 1 rule details accordion
      cy.get(
        '[data-test-subj="finding-details-flyout-rule-accordion-1"]'
      ).should('not.exist');

      // Check the rule details accordion for the expected values
      cy.get(
        '[data-test-subj="finding-details-flyout-rule-accordion-0"]'
      ).within(() => {
        // Confirm the accordion button contains the expected text
        cy.get(
          '[data-test-subj="finding-details-flyout-rule-accordion-button"]'
        ).contains('USB Device Plugged');
        cy.get(
          '[data-test-subj="finding-details-flyout-rule-accordion-button"]'
        ).contains('Severity: Low');

        // Confirm the rule name
        cy.get(
          '[data-test-subj="finding-details-flyout-USB Device Plugged-details"]'
        ).contains('USB Device Plugged');

        // Confirm the rule severity
        cy.get(
          '[data-test-subj="finding-details-flyout-rule-severity"]'
        ).contains('Low');

        // Confirm the rule category
        cy.get(
          '[data-test-subj="finding-details-flyout-rule-category"]'
        ).contains('Windows');

        // Confirm the rule description
        cy.get(
          '[data-test-subj="finding-details-flyout-rule-description"]'
        ).contains('Detects plugged USB devices');

        // Confirm the rule tags
        ['low', 'windows', 'attack.initial_access', 'attack.t1200'].forEach(
          (tag) => {
            cy.get(
              '[data-test-subj="finding-details-flyout-rule-tags"]'
            ).contains(tag);
          }
        );
      });

      // Confirm the rule document ID is present
      cy.get('[data-test-subj="finding-details-flyout-rule-document-id"]')
        .invoke('text')
        .then((text) => expect(text).to.not.equal('-'));

      // Confirm the rule index
      cy.get(
        '[data-test-subj="finding-details-flyout-rule-document-index"]'
      ).contains(testIndex);

      // Confirm the rule document matches
      // The EuiCodeEditor used for this component stores each line of the JSON in an array of elements;
      // so this test formats the expected document into an array of strings,
      // and matches each entry with the corresponding element line.
      const document = JSON.stringify(
        JSON.parse(
          '{"EventTime":"2020-02-04T14:59:39.343541+00:00","HostName":"EC2AMAZ-EPO7HKA","Keywords":"9223372036854775808","SeverityValue":2,"Severity":"INFO","EventID":2003,"SourceName":"Microsoft-Windows-Sysmon","ProviderGuid":"{5770385F-C22A-43E0-BF4C-06F5698FFBD9}","Version":5,"TaskValue":22,"OpcodeValue":0,"RecordNumber":9532,"ExecutionProcessID":1996,"ExecutionThreadID":2616,"Channel":"Microsoft-Windows-Sysmon/Operational","Domain":"NT AUTHORITY","AccountName":"SYSTEM","UserID":"S-1-5-18","AccountType":"User","Message":"Dns query:\\r\\nRuleName: \\r\\nUtcTime: 2020-02-04 14:59:38.349\\r\\nProcessGuid: {b3c285a4-3cda-5dc0-0000-001077270b00}\\r\\nProcessId: 1904\\r\\nQueryName: EC2AMAZ-EPO7HKA\\r\\nQueryStatus: 0\\r\\nQueryResults: 172.31.46.38;\\r\\nImage: C:\\\\Program Files\\\\nxlog\\\\nxlog.exe","Category":"Dns query (rule: DnsQuery)","Opcode":"Info","UtcTime":"2020-02-04 14:59:38.349","ProcessGuid":"{b3c285a4-3cda-5dc0-0000-001077270b00}","ProcessId":"1904","QueryName":"EC2AMAZ-EPO7HKA","QueryStatus":"0","QueryResults":"172.31.46.38;","Image":"C:\\\\Program Files\\\\nxlog\\\\regsvr32.exe","EventReceivedTime":"2020-02-04T14:59:40.780905+00:00","SourceModuleName":"in","SourceModuleType":"im_msvistalog","CommandLine":"eachtest","Initiated":"true","Provider_Name":"Microsoft-Windows-Kernel-General","TargetObject":"\\\\SOFTWARE\\\\Microsoft\\\\Office\\\\Outlook\\\\Security","EventType":"SetValue"}'
        ),
        null,
        2
      );
      const documentLines = document.split('\n');
      cy.get('[data-test-subj="finding-details-flyout-rule-document"]')
        .get('[class="euiCodeBlock__line"]')
        .each((lineElement, lineIndex) => {
          let line = lineElement.text();
          let expectedLine = documentLines[lineIndex];

          // The document ID field is generated when the document is added to the index,
          // so this test just checks that the line starts with the ID key.
          if (expectedLine.trimStart().startsWith('"id": "')) {
            expectedLine = '"id": "';
            expect(line, `document JSON line ${lineIndex}`).to.contain(
              expectedLine
            );
          } else {
            line = line.replaceAll('\n', '');
            expect(line, `document JSON line ${lineIndex}`).to.equal(
              expectedLine
            );
          }
        });

      // Press the "back" button
      cy.get('[data-test-subj="finding-details-flyout-back-button"]').click({
        force: true,
      });
    });

    // Confirm finding details flyout closed
    cy.get('[data-test-subj="finding-details-flyout"]').should('not.exist');

    // Confirm the expected alert details flyout rendered
    cy.get('[data-test-subj="alert-details-flyout"]').within(() => {
      cy.get(
        '[data-test-subj="text-details-group-content-alert-trigger-name"]'
      ).contains(testDetector.triggers[0].name);
    });
  });

  it('can be bulk acknowledged', () => {
    // Confirm the "Acknowledge" button is disabled when no alerts are selected
    cy.get('[data-test-subj="acknowledge-button"]').should('be.disabled');

    // Confirm there is alert which is currently "Active"
    cy.get('tbody > tr').should(($tr) => {
      expect($tr, `status`).to.contain('Active');
    });

    // Click the checkboxes for the first and last alerts.
    cy.get('tbody > tr')
      .first()
      .within(() => {
        cy.get('[class="euiCheckbox__input"]').click({ force: true });
      });

    // Press the "Acknowledge" button
    cy.get('[data-test-subj="acknowledge-button"]').click({ force: true });

    // Wait for acknowledge API to finish executing
    cy.contains('Acknowledged');

    // Filter the table to show only "Acknowledged" alerts
    cy.get('[data-text="Status"]').click({ force: true });
    cy.get('[class="euiFilterSelect__items"]').within(() => {
      cy.contains('Acknowledged').click({ force: true });
    });
    cy.get('[data-text="Status"]').click({ force: true });

    // Confirm there is an "Acknowledged" alert
    cy.get('tbody > tr').should(($tr) => {
      expect($tr, `alert name`).to.contain(testDetectorAlertCondition);
      expect($tr, `status`).to.contain('Acknowledged');
    });

    // Filter the table to show only "Active" alerts
    cy.get('[data-text="Status"]').click({ force: true });
    cy.get('[class="euiFilterSelect__items"]').within(() => {
      cy.contains('Acknowledged').click({ force: true });
    });
    cy.get('[data-text="Status"]').click({ force: true });

    // Confirm there are now 2 "Acknowledged" alerts
    cy.get('tbody > tr')
      .filter(`:contains(${testDetectorAlertCondition})`)
      .should('contain', 'Active')
      .should('contain', 'Acknowledged');
  });

  it('can be acknowledged via row button', () => {
    // Filter the table to show only "Active" alerts
    cy.get('[data-text="Status"]').click({ force: true });
    cy.get('[class="euiFilterSelect__items"]').within(() => {
      cy.contains('Active').click({ force: true });
    });
    cy.get('[data-text="Status"]').click({ force: true });

    cy.get('tbody > tr')
      .filter(`:contains(${testDetectorAlertCondition})`)
      .should('have.length', 3);

    cy.get('tbody > tr')
      // Click the "Acknowledge" icon button in the first row
      .first()
      .within(() => {
        cy.get('[aria-label="Acknowledge"]').click({ force: true });
      });

    cy.get('tbody > tr')
      .filter(`:contains(${testDetectorAlertCondition})`)
      .should('have.length', 2);

    // Filter the table to show only "Acknowledged" alerts
    cy.get('[data-text="Status"]').click({ force: true });
    cy.get('[class="euiFilterSelect__items"]').within(() => {
      cy.contains('Active').click({ force: true });
      cy.contains('Acknowledged').click({ force: true });
    });
    cy.get('[data-text="Status"]').click({ force: true });

    // Confirm there are now 3 "Acknowledged" alerts
    cy.get('tbody > tr')
      .filter(`:contains(${testDetectorAlertCondition})`)
      .should('have.length', 2);
  });

  it('can be acknowledged via flyout button', () => {
    // Filter the table to show only "Active" alerts
    cy.get('[data-text="Status"]').click({ force: true });
    cy.get('[class="euiFilterSelect__items"]').within(() => {
      cy.contains('Active').click({ force: true });
    });
    cy.get('[data-text="Status"]').click({ force: true });

    cy.get('tbody > tr')
      .first()
      .within(() => {
        // Click the "View details" button for the first alert
        cy.get('[aria-label="View details"]').click({ force: true });
      });

    cy.get('[data-test-subj="alert-details-flyout"]').within(() => {
      // Confirm the alert is currently "Active"
      cy.get(
        '[data-test-subj="text-details-group-content-alert-status"]'
      ).contains('Active');

      // Click the "Acknowledge" button on the flyout
      cy.get(
        '[data-test-subj="alert-details-flyout-acknowledge-button"]'
      ).click({ force: true });

      // Confirm the alert is now "Acknowledged"
      cy.get(
        '[data-test-subj="text-details-group-content-alert-status"]'
      ).contains('Active');

      // Confirm the "Acknowledge" button is disabled
      cy.get(
        '[data-test-subj="alert-details-flyout-acknowledge-button"]'
      ).should('be.disabled');
    });
  });

  it('detector name hyperlink on finding details flyout redirects to the detector details page', () => {
    // Open first alert details flyout
    cy.get('tbody > tr')
      .first()
      .within(() => {
        // Click the "View details" button for the first alert
        cy.get('[aria-label="View details"]').click({ force: true });
      });

    cy.get('[data-test-subj="alert-details-flyout"]').within(() => {
      // Wait for findings table to finish loading
      cy.contains('USB Device Plugged');

      // Click the details button for the first finding
      cy.get('tbody > tr')
        .first()
        .within(() => {
          cy.get('[data-test-subj="finding-details-flyout-button"]').click({
            force: true,
          });
        });
    });

    cy.get('[data-test-subj="finding-details-flyout"]').within(() => {
      // Click the detector name hyperlink
      cy.get('[data-test-subj="finding-details-flyout-detector-link"]')
        // Removing the "target" attribute so the link won't open a new tab. Cypress wouldn't test the new tab.
        .invoke('removeAttr', 'target')
        .click({ force: true });
    });

    // Confirm the detector details page is for the expected detector
    cy.get('[data-test-subj="detector-details-detector-name"]').contains(
      testDetector.name
    );
  });

  after(() => cy.cleanUpTests());
});
