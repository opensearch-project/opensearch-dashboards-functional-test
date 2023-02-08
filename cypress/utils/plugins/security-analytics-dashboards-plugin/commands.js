/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const {
  NODE_API,
  OPENSEARCH_DASHBOARDS,
  OPENSEARCH_DASHBOARDS_URL,
} = require('./constants');

Cypress.Commands.add('cleanUpTests', () => {
  cy.deleteAllCustomRules();
  cy.deleteAllDetectors();
  cy.deleteAllIndices();
});

Cypress.Commands.add('getTableFirstRow', (selector) => {
  if (!selector) return cy.get('tbody > tr').first();
  return cy.get('tbody > tr:first').find(selector);
});

Cypress.Commands.add('triggerSearchField', (placeholder, text) => {
  cy.get(`input[type="search"]`)
    .first()
    .focus()
    .type(`{selectall}${text}{enter}`)
    .trigger('search');
});

Cypress.Commands.add(
  '' + 'waitForPageLoad',
  (url, { timeout = 10000, contains = null }) => {
    const fullUrl = `${OPENSEARCH_DASHBOARDS_URL}/${url}`;
    Cypress.log({
      message: `Wait for url: ${fullUrl} to be loaded.`,
    });
    cy.url({ timeout: timeout })
      .should('match', new RegExp(`(.*)#/${url}`))
      .then(() => {
        contains && cy.contains(contains);
      });
  }
);

Cypress.Commands.add('deleteAllDetectors', () => {
  cy.request({
    method: 'DELETE',
    url: `${OPENSEARCH_DASHBOARDS}/.opensearch-sap-detectors-config`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('createDetector', (detectorJSON) => {
  cy.request({
    method: 'POST',
    url: `${OPENSEARCH_DASHBOARDS}${NODE_API.DETECTORS_BASE}`,
    body: detectorJSON,
    headers: {
      'osd-xsrf': true,
    },
  });
});

Cypress.Commands.add('updateDetector', (detectorId, detectorJSON) => {
  cy.request(
    'PUT',
    `${OPENSEARCH_DASHBOARDS}/${NODE_API.DETECTORS_BASE}/${detectorId}`,
    detectorJSON
  );
});

Cypress.Commands.add('deleteDetector', (detectorName) => {
  const body = {
    from: 0,
    size: 5000,
    query: {
      nested: {
        path: 'detector',
        query: {
          bool: {
            must: [{ match: { 'detector.name': detectorName } }],
          },
        },
      },
    },
  };
  cy.request({
    method: 'POST',
    url: `${OPENSEARCH_DASHBOARDS}${NODE_API.DETECTORS_BASE}/_search`,
    failOnStatusCode: false,
    body,
  }).then((response) => {
    if (response.status === 200) {
      for (let hit of response.body.hits.hits) {
        cy.request(
          'DELETE',
          `${OPENSEARCH_DASHBOARDS}${NODE_API.DETECTORS_BASE}/${hit._id}`
        );
      }
    }
  });
});

Cypress.Commands.add(
  'createAliasMappings',
  (indexName, ruleTopic, aliasMappingsBody, partial = true) => {
    const body = {
      index_name: indexName,
      rule_topic: ruleTopic,
      partial: partial,
      alias_mappings: aliasMappingsBody,
    };
    cy.request({
      method: 'POST',
      url: `${OPENSEARCH_DASHBOARDS}${NODE_API.MAPPINGS_BASE}`,
      body: body,
      headers: {
        'osd-xsrf': true,
      },
    });
  }
);

Cypress.Commands.add('createRule', (ruleJSON) => {
  return cy.request({
    method: 'POST',
    url: `${OPENSEARCH_DASHBOARDS}${NODE_API.RULES_BASE}?category=${ruleJSON.category}`,
    body: JSON.stringify(ruleJSON),
    headers: {
      'osd-xsrf': true,
    },
  });
});

Cypress.Commands.add('updateRule', (ruleId, ruleJSON) => {
  cy.request(
    'PUT',
    `${OPENSEARCH_DASHBOARDS}/${NODE_API.RULES_BASE}/${ruleId}`,
    ruleJSON
  );
});

Cypress.Commands.add('deleteRule', (ruleName) => {
  const body = {
    from: 0,
    size: 5000,
    query: {
      nested: {
        path: 'rule',
        query: {
          bool: {
            must: [{ match: { 'rule.title': 'Cypress test rule' } }],
          },
        },
      },
    },
  };
  cy.request({
    method: 'POST',
    url: `${OPENSEARCH_DASHBOARDS}${NODE_API.RULES_BASE}/_search?pre_packaged=false`,
    failOnStatusCode: false,
    body,
    headers: {
      'osd-xsrf': true,
    },
  }).then((response) => {
    if (response.status === 200) {
      for (let hit of response.body.hits.hits) {
        if (hit._source.title === ruleName)
          cy.request(
            'DELETE',
            `${OPENSEARCH_DASHBOARDS}${NODE_API.RULES_BASE}/${hit._id}?forced=true`
          );
      }
    }
  });
});

Cypress.Commands.add('deleteAllCustomRules', () => {
  cy.request({
    method: 'DELETE',
    url: `${OPENSEARCH_DASHBOARDS}/.opensearch-sap-custom-rules-config`,
    failOnStatusCode: false,
    body: { query: { match_all: {} } },
  });
});

Cypress.Commands.add('updateDetector', (detectorId, detectorJSON) => {
  cy.request(
    'PUT',
    `${Cypress.env('opensearch')}/${NODE_API.DETECTORS_BASE}/${detectorId}`,
    detectorJSON
  );
});

Cypress.Commands.add('deleteAllDetectors', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('opensearch')}/.opensearch-sap-detectors-config`,
    failOnStatusCode: false,
  }).as('deleteAllDetectors');
});

Cypress.Commands.add(
  'ospSearch',
  {
    prevSubject: true,
  },
  (subject, text) => {
    return cy.get(subject).clear().ospType(text).realPress('Enter');
  }
);

Cypress.Commands.add(
  'ospClear',
  {
    prevSubject: true,
  },
  (subject) => {
    return cy
      .get(subject)
      .wait(100)
      .type('{selectall}{backspace}')
      .clear({ force: true })
      .invoke('val', '');
  }
);

Cypress.Commands.add(
  'ospType',
  {
    prevSubject: true,
  },
  (subject, text) => {
    return cy.get(subject).wait(10).focus().realType(text);
  }
);
