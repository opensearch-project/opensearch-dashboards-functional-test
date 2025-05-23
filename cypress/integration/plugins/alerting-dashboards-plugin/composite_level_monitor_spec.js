/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ALERTING_API,
  ALERTING_PLUGIN_NAME,
  ALERTING_PLUGIN_TIMEOUT,
} from '../../../utils/plugins/alerting-dashboards-plugin/constants';
import sampleCompositeJson from '../../../fixtures/plugins/alerting-dashboards-plugin/sample_composite_level_monitor.json';
import * as _ from 'lodash';
import { BASE_PATH } from '../../../utils/base_constants';
import { setupIntercept } from '../../../utils/plugins/security-analytics-dashboards-plugin/helpers';

const sample_index_1 = 'sample_index_1';
const sample_index_2 = 'sample_index_2';
const SAMPLE_VISUAL_EDITOR_MONITOR =
  'sample_visual_editor_composite_level_monitor';

const clearAll = () => {
  cy.deleteIndexByName(sample_index_1);
  cy.deleteIndexByName(sample_index_2);

  cy.deleteAllAlerts();
  cy.deleteAllMonitors();
};

describe('CompositeLevelMonitor', () => {
  before(() => {
    clearAll();

    // Create indices
    cy.createIndexByName(
      sample_index_1,
      sampleCompositeJson.sample_composite_index
    );
    cy.createIndexByName(
      sample_index_2,
      sampleCompositeJson.sample_composite_index
    );

    // Create associated monitors
    cy.createMonitor(sampleCompositeJson.sample_composite_associated_monitor_1);
    cy.createMonitor(sampleCompositeJson.sample_composite_associated_monitor_2);
    cy.createMonitor(sampleCompositeJson.sample_composite_associated_monitor_3);
  });

  beforeEach(() => {
    // Set welcome screen tracking to false
    localStorage.setItem('home:welcome:show', 'false');
  });

  describe('can be created', () => {
    beforeEach(() => {
      // Visit Alerting OpenSearch Dashboards
      cy.visit(`${BASE_PATH}/app/${ALERTING_PLUGIN_NAME}#/monitors`);

      // Confirm sample delegate monitors are present
      cy.contains(
        sampleCompositeJson.sample_composite_associated_monitor_1.name,
        { timeout: ALERTING_PLUGIN_TIMEOUT }
      );
      cy.contains(
        sampleCompositeJson.sample_composite_associated_monitor_2.name,
        { timeout: ALERTING_PLUGIN_TIMEOUT }
      );
      cy.contains(
        sampleCompositeJson.sample_composite_associated_monitor_3.name,
        { timeout: ALERTING_PLUGIN_TIMEOUT }
      );

      // Common text to wait for to confirm page loaded, give up to 20 seconds for initial load
      cy.contains('Create monitor', { timeout: ALERTING_PLUGIN_TIMEOUT });

      // Go to create monitor page
      cy.contains('Create monitor').click({ force: true });

      // Select the Composite-Level Monitor type
      cy.get('[data-test-subj="compositeLevelMonitorRadioCard"]').click({
        force: true,
      });
    });

    it('by visual editor', () => {
      // Select visual editor for method of definition
      cy.get('[data-test-subj="visualEditorRadioCard"]').click({ force: true });

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_VISUAL_EDITOR_MONITOR, {
        force: true,
      });

      // Select associated monitors
      cy.get('[id="associatedMonitorsList_0"]').type(
        'monitorOne{downArrow}{enter}',
        { delay: 200 }
      );

      cy.get('[id="associatedMonitorsList_1"]').type(
        'monitorTwo{downArrow}{enter}',
        { delay: 200 }
      );

      cy.get('button').contains('Add trigger').click({ force: true });

      // Type trigger name
      cy.get('[data-test-subj="composite-trigger-name"]')
        .type('{selectall}', { force: true })
        .type('{backspace}', { force: true })
        .type('Composite trigger', { force: true });

      setupIntercept(cy, 'api/alerting/workflows', 'createMonitorRequest');
      cy.get('button').contains('Create').click({ force: true });

      // Wait for monitor to be created
      cy.wait('@createMonitorRequest').then(() => {
        // Verify the monitor name on details page
        cy.contains(SAMPLE_VISUAL_EDITOR_MONITOR);

        // Go back to the Monitors list
        cy.get('a').contains('Monitors').click({ force: true });

        cy.contains(SAMPLE_VISUAL_EDITOR_MONITOR);
      });
    });
  });

  describe('can be edited', () => {
    beforeEach(() => {
      const body = {
        size: 200,
        query: {
          match_all: {},
        },
      };
      cy.request({
        method: 'GET',
        url: `${Cypress.env('openSearchUrl')}${
          ALERTING_API.MONITOR_BASE
        }/_search`,
        failOnStatusCode: false, // In case there is no alerting config index in cluster, where the status code is 404
        body,
      }).then((response) => {
        if (response.status === 200) {
          const monitors = response.body.hits.hits;
          const createdMonitor = _.find(
            monitors,
            (monitor) => monitor._source.name === SAMPLE_VISUAL_EDITOR_MONITOR
          );
          if (createdMonitor) {
            cy.visit(
              `${BASE_PATH}/app/${ALERTING_PLUGIN_NAME}#/monitors/${createdMonitor._id}?action=update-monitor&type=workflow`
            );

            // Adding 5 second wait to help reduce flakiness
            cy.wait(5000);
          } else {
            cy.log(
              'Failed to get created monitor ',
              SAMPLE_VISUAL_EDITOR_MONITOR
            );
            throw new Error(
              `Failed to get created monitor ${SAMPLE_VISUAL_EDITOR_MONITOR}`
            );
          }
        } else {
          cy.log('Failed to get all monitors.', response);
        }
      });
    });

    it('by visual editor', () => {
      // Verify edit page
      cy.contains('Edit').click({ force: true });
      cy.contains('Edit monitor', { timeout: ALERTING_PLUGIN_TIMEOUT });
      cy.get('input[name="name"]').type('_edited');

      cy.get('label').contains('Visual editor').click({ force: true });

      cy.contains('Add another monitor').click({ force: true });

      cy.get('[id="associatedMonitorsList_2"]').type(
        'monitorThree{downArrow}{enter}',
        { delay: 200 }
      );

      cy.get('button').contains('Composite trigger').click({ force: true });

      cy.get('[data-test-subj="condition-add-options-btn_0"]').click({
        force: true,
      });
      cy.get('[data-test-subj="select-expression_0_2"]').click({ force: true });
      cy.wait(1000);
      cy.get('[data-test-subj="monitors-combobox-0-2"]')
        .type('monitorThree', { delay: 50 })
        .type('{enter}');

      setupIntercept(
        cy,
        'api/alerting/workflows',
        'updateMonitorRequest',
        'PUT'
      );
      cy.get('button').contains('Save').click({ force: true });

      // Wait for monitor to be created
      cy.wait('@updateMonitorRequest').then(() => {
        cy.wait(5000);
        cy.contains(`${SAMPLE_VISUAL_EDITOR_MONITOR}_edited`, {
          timeout: ALERTING_PLUGIN_TIMEOUT,
        });
      });
    });
  });

  after(() => clearAll());
});
