/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  PANEL_DELAY as delay,
  TEST_PANEL,
  PPL_VISUALIZATIONS,
  PPL_VISUALIZATIONS_NAMES,
  supressResizeObserverIssue,
  BASE_PATH,
} from '../../../utils/constants';

const moveToEventsHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/event_analytics/`);
  cy.wait(delay * 3);
};

const moveToPanelHome = () => {
  cy.visit(`${BASE_PATH}/app/observability-dashboards#/operational_panels/`);
  cy.wait(delay * 3);
};

const moveToTestPanel = () => {
  moveToPanelHome();
  cy.get('.euiTableCellContent')
    .contains(TEST_PANEL)
    .trigger('mouseover')
    .click();
  cy.wait(delay * 3);
  cy.get('h1').contains(TEST_PANEL).should('exist');
  cy.wait(delay);
};

describe('Creating visualizations', () => {
  beforeEach(() => {
    moveToEventsHome();
  });

  it('Create first visualization in event analytics', () => {
    cy.get('[id^=autocomplete-textarea]').focus().type(PPL_VISUALIZATIONS[0], {
      delay: 50,
    });
    cy.get('.euiButton__text').contains('Refresh').trigger('mouseover').click();
    cy.wait(delay);
    supressResizeObserverIssue();
    cy.get('button[id="main-content-vis"]')
      .contains('Visualizations')
      .trigger('mouseover')
      .click();
    cy.wait(delay * 2);
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]')
      .trigger('mouseover')
      .click();
    cy.wait(1000);
    cy.get('[data-test-subj="eventExplorer__querySaveName"]')
      .focus()
      .type(PPL_VISUALIZATIONS_NAMES[0], {
        delay: 50,
      });
    cy.intercept('POST', '/_dashboards/api/observability/event_analytics/saved_objects/vis').as('savedVisFetch');
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]')
      .trigger('mouseover')
      .click();
    cy.wait('@savedVisFetch');
    cy.wait(delay);
    cy.get('.euiToastHeader__title').contains('successfully').should('exist');
  });

  it('Create second visualization in event analytics', () => {
    cy.get('[id^=autocomplete-textarea]').focus().type(PPL_VISUALIZATIONS[1], {
      delay: 50,
    });
    cy.get('.euiButton__text').contains('Refresh').trigger('mouseover').click();
    cy.wait(delay);
    supressResizeObserverIssue();
    cy.get('button[id="main-content-vis"]')
      .contains('Visualizations')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('[data-test-subj="eventExplorer__saveManagementPopover"]')
      .trigger('mouseover')
      .click();
    cy.wait(1000);
    cy.get('[data-test-subj="eventExplorer__querySaveName"]')
      .focus()
      .type(PPL_VISUALIZATIONS_NAMES[1], {
        delay: 50,
      });
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiToastHeader__title').contains('successfully').should('exist');
  });
});

describe('Testing panels table', () => {
  beforeEach(() => {
    moveToPanelHome();
  });

  it('Creates a panel and redirects to the panel', () => {
    cy.get('.euiButton__text')
      .contains('Create panel')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('input.euiFieldText').focus().type(TEST_PANEL, {
      delay: 50,
    });
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .trigger('mouseover')
      .click();
    cy.wait(delay);

    cy.contains(TEST_PANEL).should('exist');
  });

  it('Duplicates and renames a panel', () => {
    cy.get('.euiCheckbox__input[title="Select this row"]')
      .eq(0)
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.intercept('POST', '/_dashboards/api/observability/operational_panels/panels/clone').as('clonePanel');
    cy.get('.euiButton__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.wait('@clonePanel');
    cy.wait(delay);

    cy.get('.euiCheckbox__input[title="Select this row"]')
      .eq(1)
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiCheckbox__input[title="Select this row"]')
      .eq(0)
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Rename')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('input.euiFieldText').focus().type(' (rename)', {
      delay: 50,
    });
    cy.get('.euiButton__text').contains('Rename').trigger('mouseover').click();
    cy.wait(delay);
  });

  it('Searches existing panel', () => {
    cy.get('input.euiFieldSearch').focus().type('this panel should not exist', {
      delay: 50,
    });
    cy.wait(delay);

    cy.get('.euiTableCellContent__text')
      .contains('No items found')
      .should('exist');

    cy.get('.euiFormControlLayoutClearButton').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('input.euiFieldSearch')
      .focus()
      .type(TEST_PANEL + ' (copy) (rename)', {
        delay: 50,
      });
    cy.wait(delay);

    cy.get('a.euiLink')
      .contains(TEST_PANEL + ' (copy) (rename)')
      .should('exist');
  });

  it('Deletes panels', () => {
    cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Delete')
      .trigger('mouseover')
      .click();
    cy.wait(delay);

    cy.get('button.euiButton--danger').should('be.disabled');

    cy.get('input.euiFieldText[placeholder="delete"]').focus().type('delete', {
      delay: 50,
    });
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').trigger('mouseover').click();

    cy.get('.euiTextAlign').contains('No Operational Panels').should('exist');

    // keep a panel for testing
    cy.get('.euiButton__text')
      .contains('Create panel')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('input.euiFieldText').focus().type(TEST_PANEL, {
      delay: 50,
    });
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .trigger('mouseover')
      .click();
    cy.wait(delay * 2);
  });
});

describe('Testing a panel', () => {
  it('Move to test panel', () => {
    moveToTestPanel();
  });

  it('Add existing visualization #1', () => {
    cy.get('.euiButton__text')
      .contains('Add visualization')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Select existing visualization')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('select').select(PPL_VISUALIZATIONS_NAMES[0]);
    cy.get('button[aria-label="refreshPreview"]').trigger('mouseover').click();
    cy.wait(delay * 2);
    cy.get('.plot-container').should('exist');
    cy.get('.euiButton__text')
      .contains(new RegExp('^Add$', 'g'))
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiToastHeader__title').contains('successfully').should('exist');
  });

  it('Add existing visualization #2', () => {
    cy.get('.euiButton__text')
      .contains('Add visualization')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Select existing visualization')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('select').select(PPL_VISUALIZATIONS_NAMES[1]);
    cy.get('button[aria-label="refreshPreview"]').trigger('mouseover').click();
    cy.wait(delay * 2);
    cy.get('.plot-container').should('exist');
    cy.get('.euiButton__text')
      .contains(new RegExp('^Add$', 'g'))
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiToastHeader__title').contains('successfully').should('exist');
  });

  it('Delete a visualization', () => {
    cy.get('h5').contains(PPL_VISUALIZATIONS_NAMES[1]).should('exist');
    cy.get('.euiButton__text').contains('Edit').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.visualization-action-button > .euiIcon')
      .eq(1)
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Save').trigger('mouseover').click();
    cy.wait(delay * 3);
    cy.get('h5').contains(PPL_VISUALIZATIONS_NAMES[1]).should('not.exist');
    cy.wait(delay);
  });

  it('Duplicate a visualization', () => {
    cy.get('h5').contains(PPL_VISUALIZATIONS_NAMES[0]).should('exist');
    cy.get('button[aria-label="actionMenuButton"]')
      .trigger('mouseover')
      .click();
    cy.get('.euiContextMenu__itemLayout > .euiContextMenuItem__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.wait(delay * 2);
    cy.get('.euiToastHeader__title').contains('successfully').should('exist');
    cy.wait(delay);
    cy.get('h5').eq(0).contains(PPL_VISUALIZATIONS_NAMES[0]).should('exist');
    cy.get('h5').eq(1).contains(PPL_VISUALIZATIONS_NAMES[0]).should('exist');
    cy.wait(delay);
  });
});

describe('Clean up all test data', () => {
  it('Delete visualizations from event analytics', () => {
    moveToEventsHome();
    cy.get('[data-test-subj="tablePaginationPopoverButton"]')
      .trigger('mouseover')
      .click();
    cy.get('.euiContextMenuItem__text')
      .contains('50 rows')
      .trigger('mouseover')
      .click();
    cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Delete')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('button.euiButton--danger').should('be.disabled');
    cy.get('input.euiFieldText[placeholder="delete"]').focus().type('delete', {
      delay: 50,
    });
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiTextAlign')
      .contains('No Queries or Visualizations')
      .should('exist');
  });

  it('Deletes test panel', () => {
    moveToPanelHome();
    cy.get('.euiCheckbox__input[data-test-subj="checkboxSelectAll"]')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Actions').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Delete')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('button.euiButton--danger').should('be.disabled');
    cy.get('input.euiFieldText[placeholder="delete"]').focus().type('delete', {
      delay: 50,
    });
    cy.get('button.euiButton--danger').should('not.be.disabled');
    cy.get('.euiButton__text').contains('Delete').trigger('mouseover').click();

    cy.get('.euiTextAlign').contains('No Operational Panels').should('exist');
  });
});
