/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const _ = require('lodash');

const { FEATURE_SYSTEM_INDICES, NODE_API } = require('./constants');
const { BASE_PATH, BACKEND_BASE_PATH } = require('../../base_constants');

Cypress.Commands.add(
  'ospSearch',
  {
    prevSubject: true,
  },
  (subject, text) => {
    return cy.get(subject).clear().ospType(text);
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
    return cy.get(subject).wait(10).focus().realType(text).realPress('Enter');
  }
);

Cypress.Commands.add('createRule', (ruleJSON) => {
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}${NODE_API.RULES_BASE}?category=${ruleJSON.category}`,
    body: JSON.stringify(ruleJSON),
    headers: {
      'osd-xsrf': false,
    },
  });
});

Cypress.Commands.add('updateRule', (ruleId, ruleJSON) => {
  cy.request('PUT', `${BASE_PATH}/${NODE_API.RULES_BASE}/${ruleId}`, ruleJSON);
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
    url: `${BASE_PATH}${NODE_API.RULES_BASE}/_search?pre_packaged=false`,
    failOnStatusCode: false,
    body,
  }).then((response) => {
    if (response.status === 200) {
      for (let hit of response.body.hits.hits) {
        if (hit._source.title === ruleName)
          cy.request(
            'DELETE',
            `${BASE_PATH}${NODE_API.RULES_BASE}/${hit._id}?forced=true`
          );
      }
    }
  });
});

Cypress.Commands.add('deleteAllCustomRules', () => {
  const url = `${BACKEND_BASE_PATH}/${FEATURE_SYSTEM_INDICES.CUSTOM_RULES_INDEX}`;
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
    cy.wrap(subject)
      .focus()
      .click({ force: true })
      .then(() => {
        items.map((item) =>
          cy.get('.euiComboBoxOptionsList__rowWrap').within(() => {
            cy.get('button').contains(item).should('be.visible');
            cy.get('button').contains(item).click();
          })
        );
      });
  }
);

Cypress.Commands.add(
  'clearCombobox',
  {
    prevSubject: true,
  },
  (subject) => {
    Cypress.log({ message: `Clear combobox` });
    return cy
      .wrap(subject)
      .parents('.euiComboBox__inputWrap')
      .find('.euiBadge')
      .then(($badge) => {
        let numberOfBadges = $badge.length;
        Cypress.log({
          message: `Number of combo badges to clear: ${numberOfBadges}`,
        });

        cy.wrap(subject)
          .parents('.euiComboBox__inputWrap')
          .find('input')
          .focus()
          .pressBackspaceKey(numberOfBadges);
      });
  }
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
  'pressBackspaceKey',
  {
    prevSubject: true,
  },
  (subject, numberOfPresses = 1) => {
    Cypress.log({
      message: 'Backspace key pressed',
    });
    _.times(numberOfPresses, () => {
      Cypress.automation('remote:debugger:protocol', {
        command: 'Input.dispatchKeyEvent',
        params: {
          type: 'rawKeyDown',
          keyCode: 8,
          code: 'Backspace',
          key: 'Backspace',
          windowsVirtualKeyCode: 8,
        },
      });
      cy.wait(10);
      Cypress.automation('remote:debugger:protocol', {
        command: 'Input.dispatchKeyEvent',
        params: {
          type: 'rawKeyUp',
          keyCode: 8,
          code: 'Backspace',
          key: 'Backspace',
          windowsVirtualKeyCode: 8,
        },
      });
    });
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
    `${BACKEND_BASE_PATH}/${NODE_API.DETECTORS_BASE}/${detectorId}`,
    detectorJSON
  );
});

Cypress.Commands.add('deleteSAPDetector', (detectorName) => {
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
  });
});

Cypress.Commands.add('cleanUpTests', () => {
  cy.deleteAllCustomRules();
  cy.deleteAllDetectors();
  cy.deleteAllIndices();
});

Cypress.Commands.add('getTableFirstRow', (selector) => {
  if (!selector) return cy.get('tbody > tr').first();
  return cy.get('tbody > tr:first').find(selector);
});
