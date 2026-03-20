/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import { SEARCH_RELEVANCE_PLUGIN_NAME } from '../../../utils/plugins/search-relevance-dashboards/constants';
import { BASE_PATH } from '../../../utils/base_constants';
import {
  initializeUbiIndices,
  enableWorkbenchUI,
} from '../../../utils/plugins/search-relevance-dashboards/common-setup';
import 'cypress-file-upload';

describe('Query Set Creation', () => {
  before(() => {
    cy.visit(Cypress.config().baseUrl, { timeout: 10000 });
    initializeUbiIndices();
    enableWorkbenchUI();
  });

  beforeEach(() => {
    cy.visit(
      `${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/querySet/create`
    );
    cy.wait(5000);
    cy.waitForLoader();
  });

  it('Should fail query set creation with more than 1000 queries', () => {
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .first()
      .focus()
      .type('Test UBI Query Set');
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .last()
      .focus()
      .type('Test UBI Query Set Description');
    cy.get('[data-test-subj="querySetSamplingSelect"]').select('random');
    cy.get('[data-test-subj="querySetSizeInput"]').type('10');
    cy.get('[data-test-subj="createQuerySetButton"]')
      .scrollIntoView()
      .click({ force: true });
    cy.contains('Failed to create query set', { timeout: 30000 }).should(
      'be.visible'
    );
  });

  it('Should succeed UBI query set creation with 200 status', () => {
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .first()
      .focus()
      .type('Test UBI Query Set');
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .last()
      .focus()
      .type('Test UBI Query Set Description');
    cy.get('[data-test-subj="querySetSamplingSelect"]').select('random');
    cy.get('[data-test-subj="createQuerySetButton"]')
      .scrollIntoView()
      .click({ force: true });
    cy.contains('created successfully', { timeout: 30000 }).should(
      'be.visible'
    );
  });

  it('Should succeed manual query set creation with 200 status', () => {
    cy.contains('Switch to manually adding queries').click();
    cy.wait(2000);
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .first()
      .focus()
      .type('Test Manual Query Set');
    cy.get('[data-test-subj="querySetDescriptionInput"]')
      .last()
      .focus()
      .type('Test Manual Query Set Description');

    const fileContent = [
      { queryText: 'test query 1', referenceAnswer: 'test answer 1' },
      { queryText: 'test query 2', referenceAnswer: 'test answer 2' },
    ]
      .map((obj) => JSON.stringify(obj))
      .join('\n');

    cy.get('[data-test-subj="manualQueriesFilePicker"]').attachFile({
      fileContent,
      fileName: 'queries.txt',
      mimeType: 'text/plain',
    });

    cy.contains('Preview').should('be.visible');
    cy.get('[data-test-subj="createQuerySetButton"]')
      .scrollIntoView()
      .click({ force: true });
    cy.contains('created successfully', { timeout: 30000 }).should(
      'be.visible'
    );

    cy.visit(`${BASE_PATH}/app/${SEARCH_RELEVANCE_PLUGIN_NAME}#/querySet`);
    cy.wait(3000);
    cy.contains('Test Manual Query Set').click();
    cy.url().should('include', '/querySet/view/');
    cy.contains('Query Set Details').should('be.visible');
    cy.contains('test query 1').should('be.visible');
    cy.contains('test query 2').should('be.visible');
  });

  it('Should show validation errors for empty required fields', () => {
    cy.get('[data-test-subj="createQuerySetButton"]')
      .scrollIntoView()
      .click({ force: true });
    cy.contains('Name is a required parameter', { timeout: 30000 }).should(
      'be.visible'
    );
    cy.contains('Description is a required parameter', {
      timeout: 30000,
    }).should('be.visible');
  });

  it('Should navigate back on cancel', () => {
    cy.get('[data-test-subj="cancelQuerySetButton"]').click();
    cy.url().should('include', '/querySet');
  });
});
