/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const {
  OPENSEARCH_DASHBOARDS_URL,
  OPENSEARCH_DASHBOARDS,
} = require('./constants');
const { NODE_API } = require('./constants');
const { BACKEND_BASE_PATH } = require('../../base_constants');

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('cleanUpTests', () => {
  cy.deleteAllCustomRules();
  cy.deleteAllDetectors();
  cy.sa_deleteAllIndices();
});

Cypress.Commands.add('getTableFirstRow', (selector) => {
  if (!selector) return cy.get('tbody > tr').first();
  return cy.get('tbody > tr:first').find(selector);
});

Cypress.Commands.add(
  'waitForPageLoad',
  (pathname, { timeout = 60000, contains = null }) => {
    const fullUrl = `${OPENSEARCH_DASHBOARDS_URL}/${pathname}`;
    Cypress.log({
      message: `Wait for url: ${fullUrl} to be loaded.`,
    });
    cy.url({ timeout: timeout }).then(() => {
      contains && cy.contains(contains).should('be.visible');
    });
  }
);

Cypress.Commands.add('createDetector', (detectorJSON) => {
  cy.request(
    'POST',
    `${BACKEND_BASE_PATH}${NODE_API.DETECTORS_BASE}`,
    detectorJSON
  );
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
      url: `${BACKEND_BASE_PATH}${NODE_API.MAPPINGS_BASE}`,
      body: body,
    });
  }
);

Cypress.Commands.add('updateDetector', (detectorId, detectorJSON) => {
  cy.request(
    'PUT',
    `${BACKEND_BASE_PATH}${NODE_API.DETECTORS_BASE}/${detectorId}`,
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
    url: `${BACKEND_BASE_PATH}${NODE_API.DETECTORS_BASE}/_search`,
    failOnStatusCode: false,
    body,
  }).then((response) => {
    if (response.status === 200) {
      for (let hit of response.body.hits.hits) {
        cy.request(
          'DELETE',
          `${BACKEND_BASE_PATH}${NODE_API.DETECTORS_BASE}/${hit._id}`
        );
      }
    }
  });
});

Cypress.Commands.add('deleteAllDetectors', () => {
  cy.request({
    method: 'DELETE',
    url: `${BACKEND_BASE_PATH}/.opensearch-sap-detectors-config`,
    failOnStatusCode: false,
  }).as('deleteAllDetectors');
  cy.get('@deleteAllDetectors').should((response) => {
    expect(response.status).to.be.oneOf([200, 404]);
  });
});

Cypress.Commands.add('getElementByText', (locator, text) => {
  Cypress.log({ message: `Get element by text: ${text}` });
  return locator
    ? cy.get(locator).filter(`:contains("${text}")`).should('be.visible')
    : cy.contains(text).should('be.visible');
});

Cypress.Commands.add('getButtonByText', (text) => {
  Cypress.log({ message: `Get button by text: ${text}` });
  return cy.getElementByText('.euiButton', text);
});

Cypress.Commands.add('getInputByPlaceholder', (placeholder) => {
  Cypress.log({ message: `Get input element by placeholder: ${placeholder}` });
  return cy.get(`input[placeholder="${placeholder}"]`);
});

Cypress.Commands.add('getComboboxByPlaceholder', (placeholder) => {
  Cypress.log({
    message: `Get combobox element by placeholder: ${placeholder}`,
  });
  return cy
    .getElementByText('.euiComboBoxPlaceholder', placeholder)
    .siblings('.euiComboBox__input')
    .find('input');
});

Cypress.Commands.add('getFieldByLabel', (label, type = 'input') => {
  Cypress.log({ message: `Get field by label: ${label}` });
  return cy
    .getElementByText('.euiFormRow__labelWrapper', label)
    .siblings()
    .find(type);
});

Cypress.Commands.add('getTextareaByLabel', (label) => {
  Cypress.log({ message: `Get textarea by label: ${label}` });
  return cy.getFieldByLabel(label, 'textarea');
});

Cypress.Commands.add('getElementByTestSubject', (subject) => {
  Cypress.log({ message: `Get element by test subject: ${subject}` });
  return cy.get(`[data-test-subj="${subject}"]`);
});

Cypress.Commands.add('getRadioButtonById', (id) => {
  Cypress.log({ message: `Get radio button by id: ${id}` });
  return cy.get(`input[id="${id}"]`);
});

Cypress.Commands.add(
  'selectComboboxItem',
  {
    prevSubject: true,
  },
  (subject, items) => {
    if (typeof items === 'string') {
      items = [items];
    }
    Cypress.log({ message: `Select combobox items: ${items.join(' | ')}` });
    items.map((item) => cy.wrap(subject).type(item).type('{enter}'));
  }
);

Cypress.Commands.add(
  'clearCombobox',
  {
    prevSubject: true,
  },
  (subject) => {
    Cypress.log({ message: `Clear combobox` });
    return cy.wrap(subject).type('{selectall}{backspace}');
    // .parents('.euiFormRow__fieldWrapper')
    // .find('[data-test-subj="comboBoxClearButton"]')
    // .click({ force: true });
  }
);

Cypress.Commands.add(
  'containsValue',
  {
    prevSubject: true,
  },
  (subject, value) =>
    cy.wrap(subject).parents('.euiFormRow__fieldWrapper').contains(value, {
      matchCase: false,
    })
);

Cypress.Commands.add(
  'clearValue',
  {
    prevSubject: true,
  },
  (subject) => cy.wrap(subject).type('{selectall}').type('{backspace}')
);

Cypress.Commands.add(
  'containsError',
  {
    prevSubject: true,
  },
  (subject, errorText) =>
    cy
      .wrap(subject)
      .parents('.euiFormRow__fieldWrapper')
      .find('.euiFormErrorText')
      .contains(errorText)
);

Cypress.Commands.add(
  'containsHelperText',
  {
    prevSubject: true,
  },
  (subject, helperText) =>
    cy
      .wrap(subject)
      .parents('.euiFormRow__fieldWrapper')
      .find('.euiFormHelpText')
      .contains(helperText)
);

Cypress.Commands.add(
  'shouldNotHaveError',
  {
    prevSubject: true,
  },
  (subject) =>
    cy
      .wrap(subject)
      .parents('.euiFormRow__fieldWrapper')
      .find('.euiFormErrorText')
      .should('not.exist')
);

Cypress.Commands.add('validateDetailsItem', (label, value) => {
  Cypress.log({
    message: `Validate details item by label: ${label} and value: ${value}`,
  });
  return cy
    .getElementByText('.euiFlexItem label', label)
    .parent()
    .siblings()
    .contains(value);
});

Cypress.Commands.add('urlShouldContain', (path) => {
  Cypress.log({ message: `Url should contain path: ${path}` });
  return cy.url().should('contain', `#/${path}`);
});

Cypress.Commands.add(
  'pressEnterKey',
  {
    prevSubject: true,
  },
  (subject) => {
    Cypress.log({
      message: 'Enter key pressed',
    });
    Cypress.automation('remote:debugger:protocol', {
      command: 'Input.dispatchKeyEvent',
      params: {
        type: 'char',
        unmodifiedText: '\r',
        text: '\r',
      },
    });

    return subject;
  }
);

Cypress.Commands.add(
  'validateTable',
  {
    prevSubject: true,
  },
  (subject, data) => {
    Cypress.log({
      message: 'Validate table elements',
    });
    return cy
      .wrap(subject)
      .should('be.visible')
      .find('tbody')
      .find('tr')
      .then(($tr) => {
        const length = data.length;
        length && cy.get($tr).should('have.length', length);

        cy.get($tr).within(($tr) => {
          data.map((rowData) => {
            rowData.forEach((tdData) => {
              if (typeof tdData === 'string') {
                tdData && cy.get($tr).find('td').contains(`${tdData}`);
              } else {
                // if rule is an object then use path
                tdData && cy.get($tr).find('td').contains(`${tdData.path}`);
              }
            });
          });
        });
      });
  }
);

Cypress.Commands.add('sa_createIndex', (index, settings = {}) => {
  cy.request('PUT', `${BACKEND_BASE_PATH}/${index}`, settings).should(
    'have.property',
    'status',
    200
  );
});

Cypress.Commands.add('ingestDocument', (indexId, documentJSON) => {
  cy.request('POST', `${BACKEND_BASE_PATH}/${indexId}/_doc`, documentJSON);
});

Cypress.Commands.add(
  'insertDocumentToIndex',
  (indexName, documentId, documentBody) => {
    cy.request({
      method: 'POST',
      url: `${BACKEND_BASE_PATH}/${indexName}/_doc/${documentId}`,
      body: documentBody,
    });
  }
);

Cypress.Commands.add('sa_deleteAllIndices', () => {
  cy.request({
    method: 'DELETE',
    url: `${BACKEND_BASE_PATH}/index*,sample*,opensearch_dashboards*,test*,cypress*`,
    failOnStatusCode: false,
  }).as('deleteAllIndices');
  cy.get('@deleteAllIndices').should((response) => {
    // Both statuses are a pass, 200 means deleted successfully and 404 there was no index to delete
    expect(response.status).to.be.oneOf([200, 404]);
  });
});

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
    `${BACKEND_BASE_PATH}${NODE_API.RULES_BASE}/${ruleId}`,
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
    url: `${BACKEND_BASE_PATH}${NODE_API.RULES_BASE}/_search?pre_packaged=false`,
    failOnStatusCode: false,
    body,
  }).then((response) => {
    if (response.status === 200) {
      for (let hit of response.body.hits.hits) {
        if (hit._source.title === ruleName)
          cy.request(
            'DELETE',
            `${BACKEND_BASE_PATH}${NODE_API.RULES_BASE}/${hit._id}?forced=true`
          );
      }
    }
  });
});

Cypress.Commands.add('deleteAllCustomRules', () => {
  const url = `${BACKEND_BASE_PATH}/.opensearch-sap-custom-rules-config`;
  cy.request({
    method: 'DELETE',
    url: url,
    failOnStatusCode: false,
    body: { query: { match_all: {} } },
  }).as('deleteAllCustomRules');
  cy.get('@deleteAllCustomRules').should((response) => {
    expect(response.status).to.be.oneOf([200, 404]);
  });
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
