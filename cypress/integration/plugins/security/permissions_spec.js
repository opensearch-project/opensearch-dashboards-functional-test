/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SEC_API_ACTIONGROUPS_PATH,
  SEC_PERMISSIONS_FIXTURES_PATH,
  SEC_UI_PERMISSIONS_PATH,
} from '../../../utils/constants';

describe('Permissions page', () => {
  // start a server so that server responses can be mocked via fixtures
  // in all of the below test cases
  before(() => {
    cy.server();
  });

  it('should load Permissions page properly', () => {
    cy.mockPermissionsAction(
      SEC_PERMISSIONS_FIXTURES_PATH + '/actiongroups_response.json',
      () => {
        cy.visit(SEC_UI_PERMISSIONS_PATH);
      }
    );

    cy.contains('h3', 'Permissions');

    // One of the many action-groups
    cy.contains('span', 'data_access');
  });


  it('should expand an action-group when it is clicked', () => {
    cy.mockPermissionsAction(
      SEC_PERMISSIONS_FIXTURES_PATH + '/actiongroups_response.json',
      () => {
        cy.visit(SEC_UI_PERMISSIONS_PATH);
      }
    );
    
    cy.get('tr[class="euiTableRow euiTableRow-isExpandedRow"]').should('not.be.visible');

    cy.get('[class="euiTableRowCell euiTableRowCell--isExpander"]').find('button').first().click({ force:true });

    // a row should be expanded after click
    cy.get('tr[class="euiTableRow euiTableRow-isExpandedRow"]').should('be.visible');
  });

  it('should open modal with options to create new action group page', () => {
    cy.mockPermissionsAction(
      SEC_PERMISSIONS_FIXTURES_PATH + '/actiongroups_response.json',
      () => {
        cy.visit(SEC_UI_PERMISSIONS_PATH);
      }
    );

    cy.contains('button', 'Create from blank').should('not.exist');
    cy.contains('button', 'Create from selection').should('not.exist');

    cy.contains('button', 'Create action group').first().click({ force: true });
    
    cy.contains('button', 'Create from blank');
    cy.contains('button', 'Create from selection');
  });

  it('should create new action group successfully by selecting `Create from blank`', () => {
    cy.visit(SEC_UI_PERMISSIONS_PATH);
    cy.contains('button', 'Create action group').first().click({ force: true });
    
    cy.contains('button', 'Create from blank').first().click({ force: true });

    cy.contains('button', 'Create');
    cy.contains('button', 'Cancel')
    cy.contains('.euiModalHeader__title', 'Create new action group');

    const actionGroupName = 'test';
    cy.get('input[data-test-subj="name-text"]').type(actionGroupName, { force: true });
    cy.get('input[data-test-subj="name-text"]').should('have.value', actionGroupName);

    cy.mockPermissionsAction(
      SEC_PERMISSIONS_FIXTURES_PATH + '/actiongroups_post_new_creation_response.json',
      () => {
        cy.get('button[id="submit"]').first().click({ force: true });
      }
    );
    
    
    cy.url().should((url) => {
      expect(url).to.contain('/permissions');
    });


    cy.contains('h3', 'Permissions');
    // should contain the new action group that was just created
    cy.contains('span', actionGroupName);

  });

});
