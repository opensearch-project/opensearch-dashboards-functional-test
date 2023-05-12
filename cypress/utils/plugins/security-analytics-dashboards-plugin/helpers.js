/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

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
