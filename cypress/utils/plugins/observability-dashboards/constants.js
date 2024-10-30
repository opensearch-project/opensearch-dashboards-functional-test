/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../base_constants';

export const OBSERVABILITY_INDEX_NAME = '.opensearch-observability';
export const delayTime = 1500;

//Datasources API Constants
export const DATASOURCES_API_PREFIX = '/app/datasources';
export const DATASOURCES_PATH = {
  DATASOURCES_CREATION_BASE: `${DATASOURCES_API_PREFIX}#/new`,
  DATASOURCES_CONFIG_BASE: `${DATASOURCES_API_PREFIX}#/configure`,
};

// trace analytics
export const TRACE_ID = '8832ed6abbb2a83516461960c89af49d';
export const SPAN_ID = 'a673bc074b438374';
export const SERVICE_NAME = 'frontend-client';
export const SERVICE_SPAN_ID = '7df5609a6d104736';

export const testIndexDataSet = [
  {
    mapping_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/otel-v1-apm-service-map-mappings.json',
    data_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/otel-v1-apm-service-map.json',
    index: 'otel-v1-apm-service-map',
  },
  {
    mapping_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/otel-v1-apm-span-000001-mappings.json',
    data_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/otel-v1-apm-span-000001.json',
    index: 'otel-v1-apm-span-000001',
  },
  {
    mapping_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/otel-v1-apm-span-000001-mappings.json',
    data_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/otel-v1-apm-span-000002.json',
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
  const startTime = 'Mar 24, 2021 @ 00:00:00.000';
  const endTime = 'Mar 26, 2021 @ 00:00:00.000';
  cy.get('button.euiButtonEmpty[aria-label="Date quick select"]', {
    timeout: TIMEOUT_DELAY,
  }).click();
  cy.get('.euiQuickSelect__applyButton').click();
  cy.get('[data-test-subj="superDatePickerShowDatesButton"]').click();
  cy.get('.euiTab__content').contains('Absolute').click();
  cy.get('input[data-test-subj="superDatePickerAbsoluteDateInput"]', {
    timeout: TIMEOUT_DELAY,
  }).focus();
  cy.get('input[data-test-subj="superDatePickerAbsoluteDateInput"]', {
    timeout: TIMEOUT_DELAY,
  }).type('{selectall}' + startTime, { force: true });
  if (setEndTime) {
    cy.wait(delayTime);
    cy.get(
      'button.euiDatePopoverButton--end[data-test-subj="superDatePickerendDatePopoverButton"]'
    ).click();
    cy.wait(delayTime);
    cy.get('.euiTab__content').contains('Absolute').click();
    cy.get('input[data-test-subj="superDatePickerAbsoluteDateInput"]', {
      timeout: TIMEOUT_DELAY,
    }).focus();
    cy.get('input[data-test-subj="superDatePickerAbsoluteDateInput"]', {
      timeout: TIMEOUT_DELAY,
    }).type('{selectall}' + endTime, { force: true });
  }
  if (refresh){
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
  }
  cy.wait(delayTime);
};

// notebooks
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

export const SAMPLE_SQL_QUERY = `%sql
select 1
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
  cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
    timeout: TIMEOUT_DELAY,
  }).type(query);
  cy.get('[data-test-subj="superDatePickerToggleQuickMenuButton"]', {
    timeout: TIMEOUT_DELAY,
  }).click();
  cy.wait(delayTime);
  cy.get(rangeSelected).click();
  cy.get('[data-test-subj="superDatePickerApplyTimeButton"]', {
    timeout: TIMEOUT_DELAY,
  })
    .click();
};

export const landOnEventHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-logs#`);
  cy.wait(delayTime);
};

export const landOnEventExplorer = () => {
  cy.visit(`${BASE_PATH}/app/observability-logs#/explorer`);
  cy.wait(delayTime);
};

export const landOnEventVisualizations = () => {
  cy.visit(`${BASE_PATH}/app/observability-logs#/explorer`);
  cy.get('button[id="main-content-vis"]', { timeout: TIMEOUT_DELAY })
    .contains('Visualizations')
    .click();
  supressResizeObserverIssue();
  cy.wait(delayTime);
};

export const landOnPanels = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#`);
  cy.wait(delayTime);
};

/**
 * Panel Constants
 */

export const TEST_PANEL = 'Test Panel';
export const TEST_PANEL_COPY = 'Test Panel (copy)';
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

export const TYPING_DELAY = 1500;
export const TIMEOUT_DELAY = Cypress.env('SECURITY_ENABLED') ? 60000 : 30000;
export const PANELS_TIMEOUT = 120000;

export const moveToHomePage = () => {
  cy.visit(`${BASE_PATH}/app/observability-applications#`);
  cy.wait(delayTime * 3);
  cy.get('[data-test-subj="applicationHomePageTitle"]', {
    timeout: TIMEOUT_DELAY,
  }).should('exist');
};

export const moveToCreatePage = () => {
  cy.visit(`${BASE_PATH}/app/observability-applications#`, {
    waitForGetTenant: true,
  });
  cy.wait(delayTime * 2);
  cy.get('.euiButton[href="#/create"]', {
    timeout: TIMEOUT_DELAY,
  })
    .eq(0)
    .click();
  supressResizeObserverIssue();
  cy.wait(delayTime * 2);
  cy.get('[data-test-subj="createPageTitle"]', {
    timeout: TIMEOUT_DELAY,
  }).should('contain', 'Create application');
};

export const moveToApplication = (name) => {
  cy.visit(`${BASE_PATH}/app/observability-applications#`, {
    waitForGetTenant: true,
  });
  supressResizeObserverIssue();
  cy.wait(delayTime * 2);
  cy.get(`[data-test-subj="${name}ApplicationLink"]`, {
    timeout: TIMEOUT_DELAY,
  }).click();
  cy.get('[data-test-subj="applicationTitle"]', {
    timeout: TIMEOUT_DELAY,
  }).should('contain', name);
  changeTimeTo24('years');
};

export const moveToEditPage = () => {
  moveToApplication(nameOne);
  cy.get('[data-test-subj="app-analytics-configTab"]', {
    timeout: TIMEOUT_DELAY,
  }).click();
  cy.get('[data-test-subj="editApplicationButton"]', {
    timeout: TIMEOUT_DELAY,
  }).click();
  supressResizeObserverIssue();
  cy.wait(delayTime);
  cy.get('[data-test-subj="createPageTitle"]', {
    timeout: TIMEOUT_DELAY,
  }).should('contain', 'Edit application');
};

export const changeTimeTo24 = (timeUnit) => {
  cy.get('[data-test-subj="superDatePickerToggleQuickMenuButton"]', {
    timeout: TIMEOUT_DELAY,
  }).trigger('mouseover');
  cy.get('[data-test-subj="superDatePickerToggleQuickMenuButton"]', {
    timeout: TIMEOUT_DELAY,
  }).click();
  cy.wait(delayTime);
  cy.get('[aria-label="Time unit"]', { timeout: TIMEOUT_DELAY }).select(
    timeUnit
  );
  cy.get('.euiButton').contains('Apply').click();
  cy.wait(delayTime);
  cy.get('[data-test-subj="superDatePickerApplyTimeButton"]').click();
};

export const expectMessageOnHover = (button, message) => {
  cy.get(`[data-test-subj="${button}"]`).click({ force: true });
  cy.get('.euiToolTipPopover').contains(message).should('exist');
};

export const moveToPanelHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#`);
  cy.wait(delayTime * 3);
};

export const deleteAllSavedApplications = () => {
  moveToHomePage();
  cy.get('[data-test-subj="checkboxSelectAll"]', {
    timeout: TIMEOUT_DELAY,
  }).click();
  cy.get('.euiPopover').contains('Actions').click();
  cy.get('.euiContextMenuItem').contains('Delete').click();
  cy.get('.euiButton__text').contains('Delete').click();
};

export const clearText = (testSubjectName) => {
  cy.get(`[data-test-subj="${testSubjectName}"]`, {
    timeout: TIMEOUT_DELAY,
  }).clear({ force: true });
};

export const uniqueId = Date.now();
export const baseQuery = 'source = opensearch_dashboards_sample_data_flights';
export const nameOne = `Cypress-${uniqueId}`;
export const description = 'This is my application for cypress testing.';
export const trace_one = 'HTTP POST';
export const trace_two = 'HTTP GET';
export const trace_three = 'client_pay_order';
export const query_one =
  'where DestCityName = "Venice" | stats count() by span( timestamp , 6h )';
export const query_two =
  'where OriginCityName = "Seoul" | stats count() by span( timestamp , 6h )';
export const visOneName = 'Flights to Venice';
export const visTwoName = 'Flights from Seoul';
export const newName = `Monterey Cypress-${uniqueId}`;
