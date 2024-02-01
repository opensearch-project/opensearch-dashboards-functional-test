/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRENT_TENANT } from '../../../../../utils/commands';

/// <reference types="cypress" />

describe('Before', () => {
  before(() => {
    CURRENT_TENANT.newTenant = 'global';
    cy.deleteAllIndices();
    cy.deleteSavedObjectByType('index-pattern');
  });

  it('setup completed', () => {});
});
