/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
