/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../base_constants';

export const delayTime = 1500;
export const COMMAND_TIMEOUT_LONG = 10000;

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

export const jaegerTestDataSet = [
  {
    mapping_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/jaeger-service-2023-01-24-mappings.json',
    data_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/jaeger-service-2023-01-24.json',
    index: 'jaeger-service-2023-01-24',
  },
  {
    mapping_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/jaeger-span-2023-01-24-mappings.json',
    data_url:
      'https://raw.githubusercontent.com/opensearch-project/dashboards-observability/main/.cypress/utils/jaeger-span-2023-01-24.json',
    index: 'jaeger-span-2023-01-24',
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
  cy.get('button.euiButtonEmpty[aria-label="Date quick select"]', {
    timeout: TIMEOUT_DELAY,
  }).click();
  cy.get('.euiQuickSelect__applyButton').click();
  cy.get('.euiSuperDatePicker__prettyFormatLink').click();
  cy.get(
    'button.euiDatePopoverButton--start[data-test-subj="superDatePickerstartDatePopoverButton"]'
  ).click();
  cy.get('.euiTab__content').contains('Absolute').click();
  cy.get('input[data-test-subj="superDatePickerAbsoluteDateInput"]', {
    timeout: TIMEOUT_DELAY,
  })
    .focus()
    .type('{selectall}' + startTime, { force: true });
  if (setEndTime) {
    cy.wait(delayTime);
    cy.get(
      'button.euiDatePopoverButton--end[data-test-subj="superDatePickerendDatePopoverButton"]'
    ).click();
    cy.wait(delayTime);
    cy.get('.euiTab__content').contains('Absolute').click();
    cy.get('input[data-test-subj="superDatePickerAbsoluteDateInput"]', {
      timeout: TIMEOUT_DELAY,
    })
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
export const NOTEBOOK_TEXT =
  'Use Notebooks to interactively and collaboratively develop rich reports backed by live data. Common use cases for notebooks includes creating postmortem reports, designing run books, building live infrastructure reports, or even documentation.';
export const OPENSEARCH_URL =
  'https://opensearch.org/docs/latest/observability-plugin/notebooks/';
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

export const verify_traces_spans_data_grid_cols_exists = () => {
  cy.get('.euiDataGridHeaderCell__content').contains('Span ID').should('exist');
  cy.get('.euiDataGridHeaderCell__content')
    .contains('Trace ID')
    .should('exist');
  cy.get('.euiDataGridHeaderCell__content')
    .contains('Operation')
    .should('exist');
  cy.get('.euiDataGridHeaderCell__content')
    .contains('Duration')
    .should('exist');
  cy.get('.euiDataGridHeaderCell__content')
    .contains('Start time')
    .should('exist');
  cy.get('.euiDataGridHeaderCell__content')
    .contains('End time')
    .should('exist');
  cy.get('.euiDataGridHeaderCell__content').contains('Errors').should('exist');
};

export const count_table_row = (expected_row_count) => {
  cy.get('.euiDataGridHeader [role="columnheader"]').then(($el) => {
    let colmun_header_count = Cypress.$($el).length;
    let table_grid_cell_count = Cypress.$(
      '[data-test-subj="dataGridRowCell"]'
    ).length;
    const total_row_count = table_grid_cell_count / colmun_header_count;
    expect(total_row_count).to.equal(expected_row_count);
  });
};

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
    .contains('Refresh')
    .click();
};

export const clearQuerySearchBoxText = (testSubjectName) => {
  cy.get(`[data-test-subj="${testSubjectName}"]`, {
    timeout: COMMAND_TIMEOUT_LONG,
  }).clear({ force: true });
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
  cy.get('button[id="main-content-vis"]', { timeout: TIMEOUT_DELAY })
    .contains('Visualizations')
    .click();
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

export const TYPING_DELAY = 1500;
export const TIMEOUT_DELAY = Cypress.env('SECURITY_ENABLED') ? 60000 : 30000;

export const moveToHomePage = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/application_analytics/`);
  cy.wait(delayTime * 3);
  cy.get('[data-test-subj="applicationHomePageTitle"]', {
    timeout: TIMEOUT_DELAY,
  }).should('exist');
};

export const moveToCreatePage = () => {
  cy.visit(
    `${BASE_PATH}/app/observability-dashboards#/application_analytics/`,
    { waitForGetTenant: true }
  );
  cy.wait(delayTime * 2);
  cy.get('.euiButton[href="#/application_analytics/create"]', {
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
  cy.visit(
    `${BASE_PATH}/app/observability-dashboards#/application_analytics/`,
    { waitForGetTenant: true }
  );
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
  })
    .trigger('mouseover')
    .click();
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
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/operational_panels/`);
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
export const nameTwo = `Pine-${uniqueId}`;
export const nameThree = `Cedar-${uniqueId}`;
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
export const availability_default = 'stats count() by span( timestamp, 1h )';
export const visOneName = 'Flights to Venice';
export const visTwoName = 'Flights from Seoul';
export const composition =
  'order, payment, HTTP POST, HTTP GET, client_pay_order';
export const newName = `Monterey Cypress-${uniqueId}`;

export const HOST_TEXT_1 = 'artifacts.opensearch.org';
export const HOST_TEXT_2 = 'www.opensearch.org';
export const HOST_TEXT_3 = 'cdn.opensearch-opensearch-opensearch.org';
export const HOST_TEXT_4 = 'opensearch-opensearch-opensearch.org';
export const AGENT_TEXT_1 =
  'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322)';
export const AGENT_TEXT_2 =
  'Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.50 Safari/534.24';
export const AGENT_TEXT_3 =
  'Mozilla/5.0 (X11; Linux x86_64; rv:6.0a1) Gecko/20110421 Firefox/6.0a1';
export const BAR_LEG_TEXT_1 = `${AGENT_TEXT_1},count()`;
export const BAR_LEG_TEXT_2 = `${AGENT_TEXT_2},count()`;
export const BAR_LEG_TEXT_3 = `${AGENT_TEXT_3},count()`;
export const VIS_TYPE_PIE = 'Pie';
export const VIS_TYPE_VBAR = 'Vertical bar';
export const VIS_TYPE_HBAR = 'Horizontal bar';
export const VIS_TYPE_HEATMAP = 'Heatmap';
export const FIELD_HOST = 'host';
export const FIELD_AGENT = 'agent';
