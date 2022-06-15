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
  query_two,
  visOneName,
  visTwoName,
  newName,
  TYPING_DELAY,
  TIMEOUT_DELAY,
  supressResizeObserverIssue,
  testIndexDataSet
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
    })
      .focus()
      .type(baseQuery, { delay: TYPING_DELAY });
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
    cy.route2('POST', '/api/observability/application/').as(
      'addApplication'
    );
    cy.route2('POST', 'panels').as('addPanels');
    cy.route2('PUT', '/api/observability/application/').as('putApplication');
    cy.route2('POST', 'query').as('postQuery');
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
  before(() => {
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
      .click({ force: true });
    cy.wait(delayTime);
    cy.get('[id="explorerPlotComponent"]', { timeout: TIMEOUT_DELAY }).should(
      'exist'
    );
    cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
      timeout: TIMEOUT_DELAY,
    })
      .click({ force: true });
    cy.get('.aa-List', { timeout: TIMEOUT_DELAY }).find('.aa-Item').should('have.length', 11);
    cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
      timeout: TIMEOUT_DELAY,
    })
      .focus()
      .type(query_one, { delay: TYPING_DELAY });
    changeTimeTo24('months');
    cy.wait(delayTime * 2);
    cy.get('[data-test-subj="main-content-visTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click({ force: true });
    supressResizeObserverIssue();
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]', {
      timeout: TIMEOUT_DELAY,
    }).click({ force: true });
    cy.get('[data-test-subj="eventExplorer__querySaveName"]', {
      timeout: TIMEOUT_DELAY,
    })
      .click({ force: true })
      .type(visOneName);
    cy.wait(delayTime);
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]', {
      timeout: TIMEOUT_DELAY,
    }).click({ force: true });
    cy.wait(delayTime * 2);
    cy.get('[data-test-subj="app-analytics-panelTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click({ force: true });
    cy.get('[data-test-subj="Flights to VeniceVisualizationPanel"]', {
      timeout: TIMEOUT_DELAY,
    }).should('exist');
  });

  it('Adds availability level to visualization #1', () => {
    cy.get('[data-test-subj="app-analytics-panelTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[aria-label="actionMenuButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="editVizContextMenuItem"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    supressResizeObserverIssue();
    cy.get('[data-test-subj="superDatePickerShowDatesButton"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', 'Last 24 months');
    cy.get('.euiTab[id="availability-panel"]').click();
    cy.get('[title="Bar"]', { timeout: TIMEOUT_DELAY }).click();
    cy.focused().type('{downArrow}');
    cy.focused().type('{enter}');
    cy.get('[data-test-subj="addAvailabilityButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="colorPickerAnchor"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[aria-label="Select #54B399 as the color"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="nameFieldText"]', { timeout: TIMEOUT_DELAY })
      .click()
      .type('Available');
    cy.get('option').contains('≥').should('exist');
    cy.get('option').contains('≤').should('exist');
    cy.get('option').contains('>').should('exist');
    cy.get('option').contains('<').should('exist');
    cy.get('option').contains('=').should('exist');
    cy.get('option').contains('≠').should('exist');
    cy.get('[data-test-subj="expressionSelect"]', {
      timeout: TIMEOUT_DELAY,
    }).select('>');
    cy.get('[data-test-subj="valueFieldNumber"]', { timeout: TIMEOUT_DELAY })
      .clear()
      .type('0.5');
    cy.get('[data-test-subj="visualizeEditorRenderButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="app-analytics-panelTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[id="explorerPlotComponent"]', { timeout: TIMEOUT_DELAY }).should(
      'exist'
    );
    cy.get('[class="lines"]', { timeout: TIMEOUT_DELAY }).should('exist');
    cy.get('.textpoint').contains('Available').should('exist');
    cy.get('.euiBreadcrumb[href="#/application_analytics"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="AvailableAvailabilityBadge"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', 'Available');
    cy.get(
      '[data-test-subj="AvailableAvailabilityBadge"][style="background-color: rgb(84, 179, 153); color: rgb(0, 0, 0);"]'
    ).should('exist');
  });

  it('Saves visualization #2 to panel with availability level', () => {
    cy.get(`[data-test-subj="${nameOne}ApplicationLink"]`, {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="applicationTitle"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', nameOne);
    changeTimeTo24('months');
    cy.get('[data-test-subj="app-analytics-logTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[id="explorerPlotComponent"]', { timeout: TIMEOUT_DELAY }).should(
      'exist'
    );
    cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
      timeout: TIMEOUT_DELAY,
    }).clear();
    cy.get('[data-test-subj="searchAutocompleteTextArea"]', {
      timeout: TIMEOUT_DELAY,
    })
      .focus()
      .type(query_two, { delay: TYPING_DELAY });
    cy.get('[data-test-subj="superDatePickerApplyTimeButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime);
    cy.get('[data-test-subj="main-content-visTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    supressResizeObserverIssue();
    cy.get('.euiTab[id="availability-panel"]').click();
    cy.get('[title="Bar"]', { timeout: TIMEOUT_DELAY }).click();
    cy.focused().type('{downArrow}');
    cy.focused().type('{enter}');
    cy.wait(delayTime);
    cy.get('[data-test-subj="addAvailabilityButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="colorPickerAnchor"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[aria-label="Select #9170B8 as the color"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime);
    cy.get('[data-test-subj="nameFieldText"]', { timeout: TIMEOUT_DELAY })
      .click()
      .type('Super');
    cy.get('[data-test-subj="expressionSelect"]', {
      timeout: TIMEOUT_DELAY,
    }).select('<');
    cy.get('[data-test-subj="valueFieldNumber"]', { timeout: TIMEOUT_DELAY })
      .clear()
      .type('5.5');
    cy.get('[data-test-subj="visualizeEditorRenderButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime);
    cy.get('[data-test-subj="addAvailabilityButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="colorPickerAnchor"]', {
      timeout: TIMEOUT_DELAY,
    })
      .first()
      .click();
    cy.get('[aria-label="Select #CA8EAE as the color"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime);
    cy.get('[data-test-subj="nameFieldText"]', { timeout: TIMEOUT_DELAY })
      .first()
      .click()
      .type('Cool');
    cy.get('[data-test-subj="expressionSelect"]', { timeout: TIMEOUT_DELAY })
      .first()
      .select('>');
    cy.get('[data-test-subj="valueFieldNumber"]', { timeout: TIMEOUT_DELAY })
      .first()
      .clear()
      .type('0');
    cy.get('[data-test-subj="visualizeEditorRenderButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime);
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="eventExplorer__querySaveName"]', {
      timeout: TIMEOUT_DELAY,
    })
      .click()
      .type(visTwoName);
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime);
    cy.get('[data-test-subj="app-analytics-panelTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[id="explorerPlotComponent"]', { timeout: TIMEOUT_DELAY }).should(
      'have.length',
      2
    );
    moveToHomePage();
    cy.get(
      '[data-test-subj="SuperAvailabilityBadge"][style="background-color: rgb(145, 112, 184); color: rgb(0, 0, 0);"]'
    ).should('contain', 'Super');
  });

  it('Changes availability visualization', () => {
    cy.get(`[data-test-subj="${nameOne}ApplicationLink"]`, {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="applicationTitle"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', nameOne);
    cy.get('[data-test-subj="app-analytics-configTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime);
    cy.get('select').select(visOneName);
    cy.wait(delayTime);
    moveToHomePage();
    cy.get(
      '[data-test-subj="AvailableAvailabilityBadge"][style="background-color: rgb(84, 179, 153); color: rgb(0, 0, 0);"]'
    ).should('contain', 'Available');
    cy.get(`[data-test-subj="${nameOne}ApplicationLink"]`, {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="applicationTitle"]', {
      timeout: TIMEOUT_DELAY,
    }).should('contain', nameOne);
    cy.get('[data-test-subj="app-analytics-configTab"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.wait(delayTime);
    cy.get('select').find('option:selected').should('have.text', visOneName);
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
  })

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
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="deleteApplicationContextMenuItem"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get('[data-test-subj="popoverModal__deleteTextInput"').type('delete');
    cy.get('[data-test-subj="popoverModal__deleteButton"]', {
      timeout: TIMEOUT_DELAY,
    }).click();
    cy.get(`[data-test-subj="${newName}ApplicationLink"]`, {
      timeout: TIMEOUT_DELAY,
    }).should('not.exist');
  });
});
