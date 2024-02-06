/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../../../utils/constants';

describe('Documents layer', () => {
  before(() => {
    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory/sampleData`, {
      retryOnStatusCodeFailure: true,
      timeout: 60000,
    });
    cy.get('div[data-test-subj="sampleDataSetCardflights"]', {
      timeout: 60000,
    })
      .contains(/(Add|View) data/)
      .click();
    cy.wait(60000);
  });

  const uniqueName = 'saved-map-' + Date.now().toString();

  it('Add new documents layer with configuration', () => {
    cy.visit(`${BASE_PATH}/app/maps-dashboards`);
    cy.wait(5000);
    cy.contains('Create map', { timeout: 120000 }).click();
    cy.get("button[data-test-subj='addLayerButton']", {
      timeout: 120000,
    }).click();
    cy.contains('Documents', { timeout: 120000 }).click();
    cy.contains('Select data source', { timeout: 120000 }).click({
      force: true,
    });
    cy.contains('opensearch_dashboards_sample_data_flights', {
      timeout: 120000,
    }).click();
    cy.contains('Select data field', { timeout: 120000 }).click({
      force: true,
    });
    cy.wait(5000).contains('DestLocation').click();
    cy.get('[data-test-subj="indexPatternSelect"]').should(
      'contain',
      'opensearch_dashboards_sample_data_flights'
    );
    cy.get('[data-test-subj="geoFieldSelect"]').should(
      'contain',
      'DestLocation'
    );
    cy.get(`button[testSubj="styleTab"]`).click();
    cy.contains('Fill color').click();
    cy.get(`button[aria-label="Select #E7664C as the color"]`).click();
    cy.wait(1000).contains('Border color').click();
    cy.get(`button[aria-label="Select #DA8B45 as the color"]`).click();
    cy.wait(1000).get(`button[testSubj="settingsTab"]`).click();
    cy.get('[name="layerName"]').clear().type('Documents layer 1');
    cy.get(`button[data-test-subj="updateButton"]`).click();
    cy.get('[data-test-subj="layerControlPanel"]').should(
      'contain',
      'Documents layer 1'
    );
    cy.wait(5000).get('[data-test-subj="top-nav"]').click();
    cy.wait(5000).get('[data-test-subj="savedObjectTitle"]').type(uniqueName);
    cy.wait(5000)
      .get('[data-test-subj="confirmSaveSavedObjectButton"]')
      .click();
    cy.wait(5000)
      .get('[data-test-subj="breadcrumb last"]')
      .should('contain', uniqueName);
  });

  it('Open saved map with documents layer', () => {
    cy.visit(`${BASE_PATH}/app/maps-dashboards`);
    cy.get('[data-test-subj="mapListingPage"]', { timeout: 120000 }).should(
      'contain',
      uniqueName
    );
    cy.contains(uniqueName).click();
    cy.get('[data-test-subj="layerControlPanel"]').should(
      'contain',
      'Documents layer 1'
    );
  });

  after(() => {
    cy.visit(`${BASE_PATH}/app/home#/tutorial_directory`);
    cy.get('button[data-test-subj="removeSampleDataSetflights"]')
      .should('be.visible')
      .click();
  });
});
