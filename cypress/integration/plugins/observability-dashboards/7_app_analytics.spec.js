/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  delayTime,
  moveToHomePage,
  moveToCreatePage,
  moveToApplication,
  moveToEditPage,
  changeTimeTo24,
  expectMessageOnHover,
  baseQuery,
  nameOne,
  description,
  trace_one,
  trace_two,
  trace_three,
  query_one,
  visOneName,
  newName,
  TYPING_DELAY,
  TIMEOUT_DELAY,
  supressResizeObserverIssue,
} from '../../../utils/constants';

describe('Creating application', () => {
  beforeEach(() => {
    moveToCreatePage();
  });

  it('Creates an application and redirects to application', () => {
    expectMessageOnHover('createButton', 'Name is required.');
    cy.get('[data-test-subj="nameFormRow"]', { timeout: TIMEOUT_DELAY }).type(
      nameOne
    );
    expectMessageOnHover(
      'createButton',
      'Provide at least one log source, service, entity or trace group.'
    );
    cy.get('[data-test-subj="descriptionFormRow"]', {
      timeout: TIMEOUT_DELAY,
    }).type(description);
    cy.get('[data-test-subj="servicesEntitiesAccordion"]', {
      timeout: TIMEOUT_DELAY,
    })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="servicesEntitiesComboBox"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.focused().type('{downArrow}');
    cy.focused().type('{enter}');
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', '1');
    cy.get('[data-test-subj="logSourceAccordion"]', { timeout: TIMEOUT_DELAY })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="createButton"]').should('not.be.disabled');
    cy.get('[data-test-subj="createAndSetButton"]').should('be.disabled');
    expectMessageOnHover(
      'createAndSetButton',
      'Log source is required to set availability.'
    );
    cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
      timeout: TIMEOUT_DELAY,
    }).type(baseQuery, { delay: TYPING_DELAY });
    cy.get('[data-test-subj="traceGroupsAccordion"]', {
      timeout: TIMEOUT_DELAY,
    })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="traceGroupsComboBox"]', { timeout: TIMEOUT_DELAY })
      .scrollIntoView()
      .type('http');
    cy.get('.euiFilterSelectItem').contains(trace_one).trigger('click');
    cy.get('.euiFilterSelectItem').contains(trace_two).trigger('click');
    cy.get('[data-test-subj="traceGroupsCountBadge"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', '2');
    cy.get('[data-test-subj="createButton"]', {
      timeout: TIMEOUT_DELAY,
    }).should('not.be.disabled');
    cy.intercept('POST', '/api/observability/application/').as(
      'addApplication'
    );
    cy.intercept('POST', 'panels').as('addPanels');
    cy.intercept('PUT', '/api/observability/application/').as('putApplication');
    cy.intercept('POST', 'query').as('postQuery');
    cy.get('[data-test-subj="createButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait('@addApplication');
    cy.wait('@addPanels');
    cy.wait('@putApplication');
    cy.wait('@postQuery');
    cy.get('[data-test-subj="applicationTitle"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', nameOne);
    cy.get('[data-test-subj="app-analytics-panelTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="addFirstVisualizationText"]', {
      timeout: TIMEOUT_DELAY,
    }).should('exist');
  });
});

describe('Viewing application', () => {
  beforeEach(() => {
    moveToApplication(nameOne);
  });

  it('Saves visualization #1 to panel', () => {
    cy.get('[data-test-subj="app-analytics-panelTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="addVisualizationButton"]', {
      timeout: TIMEOUT_DELAY,
    })
      .first()
      .click();
    cy.wait(delayTime);
    cy.get('[id="explorerPlotComponent"]', { timeout: TIMEOUT_DELAY }).should(
      'exist'
    );
    cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('.aa-List').find('.aa-Item').should('have.length', 11);
    cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
      timeout: TIMEOUT_DELAY,
    }).type(query_one, { delay: TYPING_DELAY });
    changeTimeTo24('months');
    cy.wait(delayTime * 2);
    cy.get('[data-test-subj="main-content-visTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    supressResizeObserverIssue();
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="eventExplorer__querySaveName"]', {
      timeout: TIMEOUT_DELAY,
    })
      .click()
      .type(visOneName);
    cy.wait(delayTime);
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime * 2);
    cy.get('[data-test-subj="app-analytics-panelTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="Flights to VeniceVisualizationPanel"]', {
      timeout: TIMEOUT_DELAY,
    }).should('exist');
    cy.get('[id="explorerPlotComponent"]', { timeout: TIMEOUT_DELAY }).should(
      'exist'
    );
    cy.get('[class="trace bars"]', { timeout: TIMEOUT_DELAY }).should('exist');
  });
});

describe('Editing application', () => {
  beforeEach(() => {
    moveToEditPage();
  });

  it('Redirects to application after saving changes', () => {
    cy.get('[data-test-subj="logSourceAccordion"]', { timeout: TIMEOUT_DELAY })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
      timeout: TIMEOUT_DELAY,
    }).should('be.disabled');
    cy.get('[data-test-subj="servicesEntitiesAccordion"]', {
      timeout: TIMEOUT_DELAY,
    })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="servicesEntitiesComboBox"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.focused().type('{downArrow}');
    cy.focused().type('{enter}');
    cy.get('[data-test-subj="servicesEntitiesCountBadge"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', '2');
    cy.get('[data-test-subj="traceGroupsAccordion"]', {
      timeout: TIMEOUT_DELAY,
    })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="comboBoxToggleListButton"]', {
      timeout: TIMEOUT_DELAY,
    })
      .eq(1)
      .click();
    cy.get('.euiFilterSelectItem').contains(trace_three).trigger('click');
    cy.get('[data-test-subj="traceGroupsCountBadge"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', '3');
    cy.get('[data-test-subj="traceGroupsAccordion"]', {
      timeout: TIMEOUT_DELAY,
    })
      .trigger('mouseover')
      .click();
    cy.get('[data-test-subj="createButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="app-analytics-configTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="configBaseQueryCode"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', baseQuery);
    cy.get('[aria-label="List of services and entities"]', {
      timeout: TIMEOUT_DELAY,
    })
      .find('li')
      .should('have.length', 2);
    cy.get('[aria-label="List of trace groups"]', { timeout: TIMEOUT_DELAY })
      .find('li')
      .should('have.length', 3);
    cy.get('[data-test-subj="applicationTitle"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', nameOne);
  });
});

describe('Application Analytics home page', () => {
  beforeEach(() => {
    moveToHomePage();
  });

  it('Renames application', () => {
    cy.get('[data-test-subj="appAnalyticsActionsButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="renameApplicationContextMenuItem"]', {
      timeout: TIMEOUT_DELAY,
    }).should('be.disabled');
    cy.get('[data-test-subj="appAnalyticsActionsButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('.euiTableRow')
      .first()
      .within(() => {
        cy.get('.euiCheckbox').click();
      });
    cy.wait(delayTime);
    cy.get('[data-test-subj="appAnalyticsActionsButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="renameApplicationContextMenuItem"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="customModalFieldText"]', {
      timeout: TIMEOUT_DELAY,
    })
      .clear()
      .focus()
      .type(newName);
    cy.get('[data-test-subj="runModalButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime);
    cy.get('.euiToast')
      .contains(`Application successfully renamed to "${newName}"`)
      .should('exist');
    cy.get('.euiTableRow')
      .first()
      .within(() => {
        cy.get('.euiLink').contains(newName).should('exist');
      });
  });

  it('Deletes application', () => {
    cy.get('[data-test-subj="appAnalyticsActionsButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="deleteApplicationContextMenuItem"]', {
      timeout: TIMEOUT_DELAY,
    }).should('exist');
    cy.get('[data-test-subj="appAnalyticsActionsButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('.euiTableRow')
      .first()
      .within(() => {
        cy.get('.euiCheckbox').click();
      });
    cy.wait(delayTime);
    cy.get('[data-test-subj="appAnalyticsActionsButton"]', {
      timeout: delayTime * 4,
    }).click();
    cy.get('[data-test-subj="deleteApplicationContextMenuItem"]', {
      timeout: delayTime,
    }).click();
    cy.get('[data-test-subj="popoverModal__deleteTextInput"]', {
      timeout: delayTime,
    }).type('delete');
    cy.get('[data-test-subj="popoverModal__deleteButton"', {
      timeout: delayTime,
    }).click();
    cy.get(`[data-test-subj="${newName}ApplicationLink"]`, {
      timeout: delayTime,
    }).should('not.exist');
  });
});
