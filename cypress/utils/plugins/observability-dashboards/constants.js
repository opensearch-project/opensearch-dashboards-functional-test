/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../base_constants';

export const delayTime = 1500;

// trace analytics
export const TRACE_ID = '8832ed6abbb2a83516461960c89af49d';
export const SPAN_ID = 'a673bc074b438374';
export const SERVICE_NAME = 'frontend-client';
export const SERVICE_SPAN_ID = '7df5609a6d104736';

export const testIndexDataSet = [
  {
    mapping_url:
      'https://raw.githubusercontent.com/opensearch-project/observability/main/dashboards-observability/.cypress/utils/otel-v1-apm-service-map-mappings.json',
    data_url:
      'https://raw.githubusercontent.com/opensearch-project/observability/main/dashboards-observability/.cypress/utils/otel-v1-apm-service-map.json',
    index: 'otel-v1-apm-service-map',
  },
  {
    mapping_url:
      'https://raw.githubusercontent.com/opensearch-project/observability/main/dashboards-observability/.cypress/utils/otel-v1-apm-span-000001-mappings.json',
    data_url:
      'https://raw.githubusercontent.com/opensearch-project/observability/main/dashboards-observability/.cypress/utils/otel-v1-apm-span-000001.json',
    index: 'otel-v1-apm-span-000001',
  },
  {
    mapping_url:
      'https://raw.githubusercontent.com/opensearch-project/observability/main/dashboards-observability/.cypress/utils/otel-v1-apm-span-000001-mappings.json',
    data_url:
      'https://raw.githubusercontent.com/opensearch-project/observability/main/dashboards-observability/.cypress/utils/otel-v1-apm-span-000002.json',
    index: 'otel-v1-apm-span-000002',
  },
];

export const supressResizeObserverIssue = () => {
  // exception is thrown on loading EuiDataGrid in cypress only, ignore for now
  cy.on('uncaught:exception', (err) => {
    if (err.message.includes('ResizeObserver loop')) return false;
  });
};

export const setTimeFilter = (setEndTime = false, refresh = true) => {
  const startTime = 'Mar 25, 2021 @ 10:00:00.000';
  const endTime = 'Mar 25, 2021 @ 11:00:00.000';
  cy.get('button.euiButtonEmpty[aria-label="Date quick select"]').click();
  cy.get('.euiQuickSelect__applyButton').click();
  cy.get('.euiSuperDatePicker__prettyFormatLink').click();
  cy.get(
    'button.euiDatePopoverButton--start[data-test-subj="superDatePickerstartDatePopoverButton"]'
  ).click();
  cy.get('.euiTab__content').contains('Absolute').click();
  cy.get('input[data-test-subj="superDatePickerAbsoluteDateInput"]')
    .focus()
    .type('{selectall}' + startTime, { force: true });
  if (setEndTime) {
    cy.wait(delayTime);
    cy.get(
      'button.euiDatePopoverButton--end[data-test-subj="superDatePickerendDatePopoverButton"]'
    ).click();
    cy.wait(delayTime);
    cy.get('.euiTab__content').contains('Absolute').click();
    cy.get('input[data-test-subj="superDatePickerAbsoluteDateInput"]')
      .focus()
      .type('{selectall}' + endTime, { force: true });
  }
  if (refresh) cy.get('.euiButton__text').contains('Refresh').click();
  cy.wait(delayTime);
};

// notebooks
export const TEST_NOTEBOOK = 'Test Notebook';
export const SAMPLE_URL =
  'https://github.com/opensearch-project/sql/tree/main/sql-jdbc';
export const MARKDOWN_TEXT = `%md
# Heading 1

#### List and links

* 1
* 2
* [SQL JDBC](${SAMPLE_URL})

---
#### Code block
* Explain SQL
\`\`\`
POST _plugins/_sql/_explain
{
  "query": "SELECT * FROM my-index LIMIT 50"
}
\`\`\`

#### Table
| a1 | b1 | c1 | d1 |
|----|----|----|----|
| a2 | b2 | c2 | d2 |
| a3 | b3 | c3 | d3 |
`;

export const SQL_QUERY_TEXT = `%sql
select * from opensearch_dashboards_sample_data_flights limit 20
`;

export const PPL_QUERY_TEXT = `%ppl
source=opensearch_dashboards_sample_data_flights
`;

// event analytics
export const YEAR_TO_DATE_DOM_ID =
  '[data-test-subj="superDatePickerCommonlyUsed_Year_to date"]';

export const TEST_QUERIES = [
  {
    query: 'source = opensearch_dashboards_sample_data_flights',
    dateRangeDOM: YEAR_TO_DATE_DOM_ID,
  },
  {
    query:
      'source = opensearch_dashboards_sample_data_flights | stats avg(FlightDelayMin) by Carrier',
    dateRangeDOM: YEAR_TO_DATE_DOM_ID,
  },
  {
    query: 'source = opensearch_dashboards_sample_data_logs',
  },
  {
    query:
      'source = opensearch_dashboards_sample_data_logs | stats count() by host',
    dateRangeDOM: YEAR_TO_DATE_DOM_ID,
  },
  {
    query:
      'source = opensearch_dashboards_sample_data_logs | stats count(), avg(bytes) by host, tags',
    dateRangeDOM: YEAR_TO_DATE_DOM_ID,
  },
];

export const TESTING_PANEL = 'Mock Testing Panels';
export const SAVE_QUERY1 = 'Mock Flight Events Overview';
export const SAVE_QUERY2 = 'Mock Flight count by destination';
export const SAVE_QUERY3 = 'Mock Flight count by destination save to panel';
export const SAVE_QUERY4 = 'Mock Flight peek';

export const querySearch = (query, rangeSelected) => {
  cy.get('[data-test-subj="searchAutocompleteTextArea"]').type(query);
  cy.get('[data-test-subj="superDatePickerToggleQuickMenuButton"]').click();
  cy.wait(delayTime);
  cy.get(rangeSelected).click();
  cy.get('[data-test-subj="superDatePickerApplyTimeButton"]')
    .contains('Refresh')
    .click();
};

export const landOnEventHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/event_analytics`);
  cy.wait(delayTime);
};

export const landOnEventExplorer = () => {
  cy.visit(
    `${BASE_PATH}/app/observability-dashboards#/event_analytics/explorer`
  );
  cy.wait(delayTime);
};

export const landOnEventVisualizations = () => {
  cy.visit(
    `${BASE_PATH}/app/observability-dashboards#/event_analytics/explorer`
  );
  cy.get('button[id="main-content-vis"]').contains('Visualizations').click();
  supressResizeObserverIssue();
  cy.wait(delayTime);
};

export const landOnPanels = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/operational_panels`);
  cy.wait(delayTime);
};

/**
 * Panel Constants
 */

export const PANEL_DELAY = 100;

export const TEST_PANEL = 'Test Panel';
export const SAMPLE_PANEL = '[Logs] Web traffic Panel';

export const SAMPLE_VISUALIZATIONS_NAMES = [
  '[Logs] Average ram usage by operating systems',
  '[Logs] Average ram usage per day by apple os',
  '[Logs] Average ram usage per day by windows os',
  '[Logs] Daily count for error response codes',
  '[Logs] Count requests from US to CN, IN and JP',
  '[Logs] Max and average bytes by host',
  '[Logs] Count total requests by tags',
  '[Logs] Daily average bytes',
];

export const PPL_VISUALIZATIONS = [
  'source = opensearch_dashboards_sample_data_flights | stats count() by Dest',
  'source = opensearch_dashboards_sample_data_flights | stats avg(FlightDelayMin) by Carrier',
  'source = opensearch_dashboards_sample_data_flights | stats max( DistanceKilometers ) by DestCityName',
];

export const PPL_VISUALIZATIONS_NAMES = [
  'Flight count by destination',
  'Average flight delayTime minutes',
  'Max distance by destination city',
];

export const NEW_VISUALIZATION_NAME = 'Flight count by destination airport';

export const PPL_FILTER =
  "where Carrier = 'OpenSearch-Air' | where Dest = 'Munich Airport'";

/**
 * App constants
 */

export const TYPING_DELAY = 3000;

export const moveToHomePage = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/application_analytics/`);
  cy.contains('Applications', { timeout: 60000 }).should('exist');
  cy.wait(delayTime * 3);
};

export const moveToCreatePage = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/application_analytics/`);
  cy.wait(delayTime * 2);
  cy.get('.euiButton__text').contains('Create application').click();
  supressResizeObserverIssue();
  cy.wait(delayTime);
  cy.get('.euiTitle').contains('Create application').should('exist');
};

export const moveToApplication = (name) => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/application_analytics/`);
  supressResizeObserverIssue();
  cy.wait(delayTime * 7);
  cy.contains(name, { timeout: 120000 }).click();
  cy.wait(delayTime * 2);
  cy.get('.euiTitle--large', { timeout: 60000 })
    .contains(name, { timeout: 60000 })
    .should('exist');
  changeTimeTo24('years');
};

export const moveToEditPage = () => {
  moveToApplication(nameOne);
  cy.get('.euiTab').contains('Configuration').click();
  cy.get('.euiButton').contains('Edit').click();
  supressResizeObserverIssue();
  cy.wait(delayTime);
  cy.get('.euiTitle').contains('Edit application');
};

export const changeTimeTo24 = (timeUnit) => {
  cy.get('[data-test-subj="superDatePickerToggleQuickMenuButton"]')
    .trigger('mouseover')
    .click();
  cy.wait(delayTime);
  cy.get('[aria-label="Time unit"]').select(timeUnit);
  cy.get('.euiButton').contains('Apply').click();
  cy.wait(delayTime);
  cy.get('.euiButton').contains('Refresh').click();
};

export const expectMessageOnHover = (message) => {
  cy.get('.euiToolTipAnchor').contains('Create').click({ force: true });
  cy.get('.euiToolTipPopover').contains(message).should('exist');
};

export const moveToPanelHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/operational_panels/`);
  cy.wait(delayTime * 3);
};

export const deleteAllSavedApplications = () => {
  moveToHomePage();
  cy.get('[data-test-subj="checkboxSelectAll"]').click();
  cy.get('.euiPopover').contains('Actions').click();
  cy.get('.euiContextMenuItem').contains('Delete').click();
  cy.get('.euiButton__text').contains('Delete').click();
};

export const uniqueId = Date.now();
export const baseQuery = 'source = opensearch_dashboards_sample_data_flights';
export const nameOne = `Cypress-${uniqueId}`;
export const nameTwo = `Pine-${uniqueId}`;
export const description = 'This is my application for cypress testing.';
export const service_one = 'order';
export const service_two = 'payment';
export const trace_one = 'HTTP POST';
export const trace_two = 'HTTP GET';
export const trace_three = 'client_pay_order';
export const query_one =
  'where DestCityName = "Venice" | stats count() by span( timestamp , 6h )';
export const query_two =
  'where OriginCityName = "Seoul" | stats count() by span( timestamp , 6h )';
export const visOneName = 'Flights to Venice';
export const visTwoName = 'Flights from Seoul';
export const composition =
  'order, payment, HTTP POST, HTTP GET, client_pay_order';
export const newName = 'Monterey Cypress';
