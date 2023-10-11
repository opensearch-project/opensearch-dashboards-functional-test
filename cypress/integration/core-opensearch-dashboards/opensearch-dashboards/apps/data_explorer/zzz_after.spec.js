/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

describe('After', () => {
  before(() => {
    cy.deleteAllIndices();
    cy.deleteSavedObjectByType('index-pattern');
  });

  it('clean up complete', () => {});
});
