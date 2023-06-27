/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AD_URL } from './constants';

export const selectTopItemFromFilter = (
  dataTestSubjectName,
  allowMultipleSelections = true
) => {
  cy.getElementByTestId(dataTestSubjectName)
    .find('[data-test-subj=comboBoxToggleListButton]')
    .click({ force: true });
  cy.get('.euiFilterSelectItem').first().click();
  cy.wait(1000);
  // If multiple options can be selected, the combo box doesn't close after selecting an option.
  // We manually close in this case, so the unselected items aren't visible on the page.
  // This way, we can test whether or not filtering has worked as expected.
  if (allowMultipleSelections) {
    cy.getElementByTestId(dataTestSubjectName)
      .find('[data-test-subj=comboBoxToggleListButton]')
      .click();
  }
};

export const createSampleDetector = (createButtonDataTestSubj) => {
  cy.visit(AD_URL.OVERVIEW);

  cy.getElementByTestId('overviewTitle').should('exist');
  cy.getElementByTestId('viewSampleDetectorLink').should('not.exist');
  cy.getElementByTestId(createButtonDataTestSubj).click();
  cy.visit(AD_URL.OVERVIEW);

  // Check that the details page defaults to real-time, and shows detector is initializing
  cy.getElementByTestId('viewSampleDetectorLink').click();
  cy.getElementByTestId('detectorNameHeader').should('exist');
  cy.getElementByTestId('sampleIndexDetailsCallout').should('exist');
  cy.getElementByTestId('realTimeResultsHeader').should('exist');
  cy.getElementByTestId('detectorStateInitializing').should('exist');
};

const openAnomalyDetectionPanel = (dashboardName, visualizationName) => {
  cy.visitDashboard(dashboardName);
  cy.getVisPanelByTitle(visualizationName)
    .openVisContextMenu()
    .clickVisPanelMenuItem('Anomaly Detection');
};

export const openAddAnomalyDetectorFlyout = (
  dashboardName,
  visualizationName
) => {
  openAnomalyDetectionPanel(dashboardName, visualizationName);
  cy.clickVisPanelMenuItem('Add anomaly detector');
  cy.wait(5000);
};

export const openAssociatedDetectorsFlyout = (
  dashboardName,
  visualizationName
) => {
  openAnomalyDetectionPanel(dashboardName, visualizationName);
  cy.clickVisPanelMenuItem('Associated detectors');
};

// expected context: on create detector flyout
export const createDetectorFromVis = (detectorName) => {
  cy.get('[id="detectorDetailsAccordion"]')
    .parent()
    .find('[data-test-subj="accordionTitleButton"]')
    .click();
  cy.getElementByTestId('detectorNameTextInputFlyout').clear();
  cy.getElementByTestId('detectorNameTextInputFlyout').type(detectorName);
  cy.getElementByTestId('adAnywhereCreateDetectorButton').click();
  cy.wait(5000);
};

// expected context: on associate detector flyout
export const associateDetectorFromVis = (detectorName) => {
  cy.wait(2000);
  cy.getElementByTestId('comboBoxInput').type(
    `${detectorName}{downArrow}{enter}`
  );
  cy.wait(2000);
  cy.getElementByTestId('adAnywhereAssociateDetectorButton').click();
  cy.wait(5000);
};

export const ensureDetectorIsLinked = (
  dashboardName,
  visualizationName,
  detectorName
) => {
  openAssociatedDetectorsFlyout(dashboardName, visualizationName);
  cy.wait(1000);
  cy.get('.euiFieldSearch').type(detectorName);
  cy.get('.euiBasicTable').find('.euiTableRow').should('have.length', 1);
};

export const unlinkDetectorFromVis = (
  dashboardName,
  visualizationName,
  detectorName
) => {
  openAssociatedDetectorsFlyout(dashboardName, visualizationName);
  cy.wait(1000);
  cy.get('.euiFieldSearch').type(detectorName);
  cy.wait(1000);
  cy.getElementByTestId('unlinkButton').click();
  cy.getElementByTestId('confirmUnlinkButton').click();
  cy.wait(5000);
};
