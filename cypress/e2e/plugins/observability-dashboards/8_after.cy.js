/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

describe('After', () => {
  before(() => {
    cy.deleteAllIndices();
  });

  it('clean up complete', () => {});
});
