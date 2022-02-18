/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BACKEND_BASE, IM_API, IM_CONFIG_INDEX } from '../../constants';

Cypress.Commands.add('deleteAllIndices', () => {
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}/index*,sample*,opensearch_dashboards*`
  );
  // TODO don't directly delete system index, use other way
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}/.opendistro-ism*?expand_wildcards=all`
  );
  // Clean all ISM policies
  cy.request('GET', `${BACKEND_BASE}${IM_API.POLICY_BASE}`).then((resp) => {
    const policyIds = resp.body.policies.map((item) => item._id).join(', ');
    if (policyIds.length) {
      cy.request('DELETE', `${BACKEND_BASE}${IM_API.POLICY_BASE}/${policyIds}`);
    }
  });
  // Clean all ISM jobs
  cy.request('GET', `${BACKEND_BASE}${IM_API.EXPLAIN_BASE}`).then((resp) => {
    console.log('Explain all');
    console.log(`${JSON.stringify(resp.body)}`);
    let ismJobIds = Object.keys(resp.body);
    ismJobIds = ismJobIds
      .filter((e) => e !== 'total_managed_indices')
      .join(', ');
    if (ismJobIds.length) {
      cy.request(
        'POST',
        `${BACKEND_BASE}${IM_API.REMOVE_POLICY_BASE}/${ismJobIds}`
      );
    }
  });
});

Cypress.Commands.add('createPolicy', (policyId, policyJSON) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${IM_API.POLICY_BASE}/${policyId}`,
    policyJSON
  );
});

Cypress.Commands.add('getIndexSettings', (index) => {
  cy.request('GET', `${Cypress.env('openSearchUrl')}/${index}/_settings`);
});

Cypress.Commands.add('updateIndexSettings', (index, settings) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}/${index}/_settings`,
    settings
  );
});

Cypress.Commands.add('updateManagedIndexConfigStartTime', (index) => {
  // TODO directly changing system index will not be supported, need to introduce new way
  // Creating closure over startTime so it's not calculated until actual update_by_query call
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(1000).then(() => {
    const FIVE_MINUTES_MILLIS = 5 * 60 * 1000; // Default ISM job interval
    const THREE_SECONDS_MILLIS = 3000; // Subtract 3 seconds to account for buffer of updating doc, descheduling, rescheduling
    const startTime =
      new Date().getTime() - (FIVE_MINUTES_MILLIS - THREE_SECONDS_MILLIS);
    const body = {
      query: { term: { 'managed_index.index': index } },
      script: {
        lang: 'painless',
        source: `ctx._source['managed_index']['schedule']['interval']['start_time'] = ${startTime}L`,
      },
    };
    cy.request(
      'POST',
      `${Cypress.env('openSearchUrl')}/${
        IM_CONFIG_INDEX.OPENDISTRO_ISM_CONFIG
      }/_update_by_query`,
      body
    );
  });
});

Cypress.Commands.add('createIndex', (index, policyID = null, settings = {}) => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}/${index}`, settings);
  if (policyID != null) {
    const body = { policy_id: policyID };
    cy.request(
      'POST',
      `${Cypress.env('openSearchUrl')}${IM_API.ADD_POLICY_BASE}/${index}`,
      body
    );
  }
});

Cypress.Commands.add('createRollup', (rollupId, rollupJSON) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${IM_API.ROLLUP_JOBS_BASE}/${rollupId}`,
    rollupJSON
  );
});

Cypress.Commands.add('createIndexTemplate', (name, template) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${IM_API.INDEX_TEMPLATE_BASE}/${name}`,
    template
  );
});

Cypress.Commands.add('createDataStream', (name) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${IM_API.DATA_STREAM_BASE}/${name}`
  );
});

Cypress.Commands.add('deleteDataStreams', (names) => {
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}${IM_API.DATA_STREAM_BASE}/${names}`
  );
});

Cypress.Commands.add('rollover', (target) => {
  cy.request('POST', `${Cypress.env('openSearchUrl')}/${target}/_rollover`);
});

Cypress.Commands.add('createTransform', (transformId, transformJSON) => {
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}${
      IM_API.TRANSFORM_JOBS_BASE
    }/${transformId}`,
    transformJSON
  );
});

Cypress.Commands.add('disableJitter', () => {
  // Sets the jitter to 0 in the ISM plugin cluster settings
  const jitterJson = {
    persistent: {
      plugins: {
        index_state_management: {
          jitter: '0.0',
        },
      },
    },
  };
  cy.request(
    'PUT',
    `${Cypress.env('openSearchUrl')}/_cluster/settings`,
    jitterJson
  );
});
