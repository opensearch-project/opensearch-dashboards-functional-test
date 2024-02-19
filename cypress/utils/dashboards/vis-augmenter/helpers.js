/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty } from 'lodash';
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { devToolsRequest, apiRequest } from '../../helpers';
/**
 * Cleans up the index & all associated saved objects (index pattern, visualizations,
 * dashboards, etc.) created during the test run
 */
export const deleteVisAugmenterData = (
  indexName,
  indexPatternName,
  visualizationNames,
  dashboardName
) => {
  devToolsRequest(indexName, 'DELETE').then(() => {
    apiRequest(
      `api/saved_objects/index-pattern/${indexPatternName}`,
      'DELETE'
    ).then(() => {
      apiRequest(
        `
api/opensearch-dashboards/management/saved_objects/_find?perPage=5000&page=1&fields=id&type=config&type=url&type=index-pattern&type=query&type=dashboard&type=visualization&type=visualization-visbuilder&type=augment-vis&type=search&sortField=type`,
        'GET'
      ).then((response) => {
        if (!response.body.saved_objects) return;
        response.body.saved_objects.forEach((obj) => {
          if (
            obj.type !== 'config' &&
            [
              indexName,
              indexPatternName,
              ...visualizationNames,
              dashboardName,
            ].indexOf(obj.meta.title) !== -1
          ) {
            apiRequest(
              `api/saved_objects/${obj.type}/${obj.id}?force=true`,
              'DELETE'
            );
          }
        });
      });
    });
  });
};

/**
 * Fetch the fixtures to create and configure an index, index pattern,
 * and ingesting sample data to the index
 */
export const ingestVisAugmenterData = (
  indexName,
  indexPatternName,
  indexSettingsFilepath,
  indexPatternFieldsFilepath,
  sampleDataFilepath
) => {
  cy.fixture(indexSettingsFilepath).then((indexSettings) =>
    devToolsRequest(indexName, 'PUT', indexSettings)
  );

  cy.fixture(indexPatternFieldsFilepath).then((fields) => {
    apiRequest(
      `api/saved_objects/index-pattern/${indexPatternName}`,
      'POST',
      JSON.stringify({
        attributes: {
          fields: fields,
          title: indexPatternName,
          timeFieldName: '@timestamp',
        },
      })
    );
  });

  cy.fixture(sampleDataFilepath).then((indexData) => {
    indexData.forEach((item, idx) => {
      let date = new Date();
      item['@timestamp'] = date.setMinutes(date.getMinutes() - 1);
      devToolsRequest(`${indexName}/_doc/${idx}`, 'POST', JSON.stringify(item));
    });
  });
};

/**
 * Creating a new visualization from a dashboard, and finishing at the
 * vis edit page
 */
const bootstrapCreateFromDashboard = (visType, indexPatternName) => {
  cy.getElementByTestId('dashboardAddNewPanelButton')
    .should('be.visible')
    .click();

  cy.getElementByTestId(`visType-${visType}`).click();

  // vega charts don't have a secondary modal to configure the
  // index pattern / saved search. Skip those steps here
  if (visType !== 'vega') {
    cy.getElementByTestId('savedObjectFinderSearchInput').type(
      `${indexPatternName}{enter}`
    );
    cy.get(`[title="${indexPatternName}"]`).click();
  }
};

const setXAxisDateHistogram = () => {
  cy.get('.euiTitle')
    .contains('Buckets')
    .parent()
    .find('[data-test-subj="visEditorAdd_buckets"]')
    .click();

  cy.getElementByTestId('visEditorAdd_buckets_X-axis').click({ force: true });

  cy.get('.euiTitle')
    .contains('Buckets')
    .parent()
    .within(() => {
      cy.wait(1000);
      cy.getElementByTestId('comboBoxInput')
        .find('input')
        .type('Date Histogram{enter}', { force: true });
    });
};

/**
 * From the vis edit view, return to the dashboard
 */
const saveVisualizationAndReturn = (visualizationName) => {
  cy.getElementByTestId('visualizeEditorRenderButton').click({
    force: true,
  });
  cy.getElementByTestId('visualizeSaveButton').click({
    force: true,
  });
  cy.getElementByTestId('savedObjectTitle').type(visualizationName);
  cy.getElementByTestId('confirmSaveSavedObjectButton').click({
    force: true,
  });
};

/**
 * Creates a list of specified metrics under the y-axis section
 * in the vis editor page
 */
const setYAxis = (metrics) => {
  metrics.forEach((metric, index) => {
    // There is always a default count metric populated. So, for the first
    // added metric, we need to overwrite it. For additional metrics, we
    // can just click the "Add" button
    if (index === 0) {
      cy.getElementByTestId('metricsAggGroup')
        .find('.euiAccordion__button')
        .click({ force: true });
    } else {
      cy.getElementByTestId('visEditorAdd_metrics').click();
      cy.getElementByTestId('visEditorAdd_metrics_Y-axis').click();
    }
    addMetric(metric, index);
  });
};

/**
 * Adds a metric to the specified index in the vis editor page
 */
const addMetric = (metric, index) => {
  cy.getElementByTestId('metricsAggGroup')
    .find(`[data-test-subj="visEditorAggAccordion${index + 1}"]`)
    .within(() => {
      cy.wait(1000);
      cy.getElementByTestId('comboBoxSearchInput').type(
        `${metric.aggregation}{downarrow}{enter}`,
        {
          force: true,
        }
      );
      cy.contains(`${metric.aggregation}`).click({ force: true });
    });

  // non-count aggregations will have an additional field value to set
  if (metric.aggregation !== 'Count' && metric.aggregation !== 'count') {
    cy.getElementByTestId('metricsAggGroup')
      .find(`[data-test-subj="visEditorAggAccordion${index + 1}"]`)
      .find('[data-test-subj="visDefaultEditorField"]')
      .within(() => {
        cy.wait(1000);
        cy.getElementByTestId('comboBoxSearchInput').type(
          `${metric.field}{downarrow}{enter}`,
          {
            force: true,
          }
        );
      });
  }

  // re-collapse the accordion
  cy.getElementByTestId(`visEditorAggAccordion${index + 1}`)
    .find('.euiAccordion__button')
    .first()
    .click({ force: true });
};

/**
 * Creates an individual visualization, assuming runner is
 * starting from dashboard edit view.
 */
export const createVisualizationFromDashboard = (
  visType,
  indexPatternName,
  visualizationName,
  metrics
) => {
  bootstrapCreateFromDashboard(visType, indexPatternName);

  // Vega visualizations don't configure axes the same way,
  // so ignore those here. Note we still want to support the vega type,
  // but don't support any custom specs, as the default spec may be
  // sufficient for now
  if (visType !== 'vega') {
    if (!isEmpty(metrics)) {
      setYAxis(metrics);
    }
    setXAxisDateHistogram();
  }
  saveVisualizationAndReturn(visualizationName);
};

/**
 * Ingests the specified sample data, creates and saves a specified
 * list of visualizations, and saves them all to a new dashboard
 */
export const bootstrapDashboard = (
  indexSettingsFilepath,
  indexPatternFieldsFilepath,
  sampleDataFilepath,
  indexName,
  indexPatternName,
  dashboardName,
  visualizationSpecs
) => {
  const miscUtils = new MiscUtils(cy);
  deleteVisAugmenterData(
    indexName,
    indexPatternName,
    visualizationSpecs.map((visualizationSpec) => visualizationSpec.name),
    dashboardName
  );
  ingestVisAugmenterData(
    indexName,
    indexPatternName,
    indexSettingsFilepath,
    indexPatternFieldsFilepath,
    sampleDataFilepath
  );

  miscUtils.visitPage('app/dashboards#/create');
  cy.wait(60000);

  // Create several different visualizations
  visualizationSpecs.forEach((visualizationSpec) => {
    createVisualizationFromDashboard(
      visualizationSpec.type,
      visualizationSpec.indexPattern,
      visualizationSpec.name,
      visualizationSpec.metrics
    );
  });

  cy.getElementByTestId('dashboardSaveMenuItem').click({
    force: true,
  });

  cy.getElementByTestId('savedObjectTitle').type(dashboardName);

  cy.getElementByTestId('confirmSaveSavedObjectButton').click({
    force: true,
  });

  // wait for dashbaord to be saved
  cy.wait(5000);

  // make newly created dashboards searchable
  devToolsRequest('.kibana*/_refresh', 'POST');
};

export const filterByObjectType = (type) => {
  cy.get('.euiFilterButton').click();
  cy.get('.euiFilterSelect__items')
    .find('button')
    .contains(type)
    .click({ force: true });
  cy.wait(3000);
};
