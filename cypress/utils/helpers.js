/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './plugins/anomaly-detection-dashboards-plugin/helpers';
export * from './dashboards/vis-augmenter/helpers';

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
