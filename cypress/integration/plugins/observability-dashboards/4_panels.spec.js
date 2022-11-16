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
    cy.get('[data-test-subj="eventExplorer__querySaveConfirm"]')
      .trigger('mouseover')
      .click();
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

  it('Displays error toast for invalid panel name', () => {
    cy.get('.euiButton__text')
      .contains('Create panel')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiButton__text')
      .contains(/^Create$/)
      .trigger('mouseover')
      .click();
    cy.wait(delay);

    cy.get('.euiToastHeader__title')
      .contains('Invalid Operational Panel name')
      .should('exist');
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
    cy.get('.euiButton__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
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

  it('Redirects to correct page on breadcrumb click', () => {
    moveToTestPanel();
    cy.get('.euiBreadcrumb').contains(TEST_PANEL).trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.euiTitle').contains(TEST_PANEL).should('exist');
    cy.get('.euiBreadcrumb')
      .contains('Operational panels')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiTitle').contains('Operational panels').should('exist');
    cy.get('.euiBreadcrumb')
      .contains('Observability')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiTitle').contains('Event analytics').should('exist');
  });

  it('Duplicate the open panel', () => {
    moveToTestPanel();
    cy.get('.euiButton__text')
      .contains('Panel actions')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Duplicate panel')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get(`input.euiFieldText[value="${TEST_PANEL} (copy)"]`).should('exist');
    cy.get('.euiButton__text')
      .contains('Duplicate')
      .trigger('mouseover')
      .click();
    cy.wait(delay * 3);
    cy.get('.euiToastHeader__title').contains('successfully').should('exist');
    cy.get('h1')
      .contains(TEST_PANEL + ' (copy)')
      .should('exist');
    cy.wait(delay);
  });

  it('Rename the open panel', () => {
    cy.get('.euiButton__text')
      .contains('Panel actions')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get('.euiContextMenuItem__text')
      .contains('Rename panel')
      .trigger('mouseover')
      .click();
    cy.wait(delay);
    cy.get(`input.euiFieldText[value="${TEST_PANEL} (copy)"]`)
      .focus()
      .clear({ force: true })
      .focus()
      .type('Renamed Panel', {
        delay: 200,
      });
    cy.get('.euiButton__text').contains('Rename').trigger('mouseover').click();
    cy.wait(delay * 3);
    cy.get('.euiToastHeader__title').contains('successfully').should('exist');
    cy.get('h1').contains('Renamed Panel').should('exist');
    cy.wait(delay);
  });

  it('Change date filter of the panel', () => {
    moveToTestPanel();
    cy.get(
      '.euiButtonEmpty[data-test-subj="superDatePickerToggleQuickMenuButton"]'
    ).click({
      force: true,
    });
    cy.get('.euiLink').contains('This year').trigger('mouseover').click();
    cy.wait(delay * 2);
    cy.get(
      '.euiSuperDatePicker__prettyFormat[data-test-subj="superDatePickerShowDatesButton"]'
    )
      .contains('This year')
      .should('exist');
    cy.wait(delay);
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

  it('Drag and drop a visualization', () => {
    cy.get('.euiButton__text').contains('Edit').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('h5')
      .contains(PPL_VISUALIZATIONS_NAMES[1])
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientX: 1100, clientY: 0 })
      .trigger('mouseup', { force: true });
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Save').trigger('mouseover').click();
    cy.wait(delay * 3);
    cy.get('div.react-grid-layout>div')
      .eq(1)
      .invoke('attr', 'style')
      .should('match', new RegExp('(.*)transform: translate((.*)10px)(.*)'));
    cy.wait(delay);
  });

  it('Resize a visualization', () => {
    cy.get('.euiButton__text').contains('Edit').trigger('mouseover').click();
    cy.wait(delay);
    cy.get('.react-resizable-handle')
      .eq(1)
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientX: 2000, clientY: 800 })
      .trigger('mouseup', { force: true });
    cy.wait(delay);
    cy.get('.euiButton__text').contains('Save').trigger('mouseover').click();
    cy.wait(delay * 3);
    cy.get('div.react-grid-layout>div')
      .eq(1)
      .invoke('height')
      .should('match', new RegExp('470'));
    cy.wait(delay);
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
