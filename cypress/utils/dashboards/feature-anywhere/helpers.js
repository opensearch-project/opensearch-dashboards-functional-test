/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const parseAriaLabel = (label) => {
  const labels = label.split(';');
  const labelEntries = labels.map((lab) =>
    lab
      .trim()
      .split(':')
      .map((l) => l.trim())
  );
  return Object.fromEntries(labelEntries);
};

export const getNodeData = (node) => node['__data__'];

export const apiRequest = (
  url,
  method = 'POST',
  body = undefined,
  qs = undefined
) =>
  cy.request({
    method: method,
    failOnStatusCode: false,
    url: url,
    headers: {
      'content-type': 'application/json',
      'osd-xsrf': true,
    },
    body: body,
    qs: qs,
  });

export const devToolsRequest = (
  url,
  method = 'POST',
  body = undefined,
  qs = undefined
) =>
  cy.request({
    method: 'POST',
    form: false,
    failOnStatusCode: false,
    url: encodeURI(`api/console/proxy?path=${url}&method=${method}`),
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
    },
    body: body,
    qs: qs,
  });

export const cleanTests = (
  indexName,
  indexPatternName,
  visualizationName,
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
        response.body.saved_objects.forEach((obj) => {
          if (
            obj.type !== 'config' &&
            [
              indexName,
              indexPatternName,
              visualizationName,
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

export const prepareTests = (indexName, indexPatternName) => {
  cy.fixture(
    'dashboard/opensearch_dashboards/feature-anywhere/index-settings-sample.txt'
  ).then((indexSettings) => devToolsRequest(indexName, 'PUT', indexSettings));

  cy.fixture(
    'dashboard/opensearch_dashboards/feature-anywhere/index-pattern-fields.txt'
  ).then((fields) => {
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

  cy.fixture(
    'dashboard/opensearch_dashboards/feature-anywhere/feature-anywhere-sample.json'
  ).then((indexData) => {
    indexData.forEach((item, idx) => {
      let date = new Date();
      item['@timestamp'] = date.setMinutes(date.getMinutes() - 1);
      devToolsRequest(`${indexName}/_doc/${idx}`, 'POST', JSON.stringify(item));
    });
  });
};
