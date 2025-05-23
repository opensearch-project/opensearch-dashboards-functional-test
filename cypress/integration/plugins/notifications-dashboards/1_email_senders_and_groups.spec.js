/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="cypress" />

import {
  BASE_PATH,
  NOTIFICATIONS_DELAY,
  NOTIFICATIONS_PLUGIN_NAME,
} from '../../../utils/constants';

import testSslSmtpSender from '../../../fixtures/plugins/notifications-dashboards/test_ssl_smtp_sender.json';
import testTlsSmtpSender from '../../../fixtures/plugins/notifications-dashboards/test_tls_smtp_sender.json';
import testSesSender from '../../../fixtures/plugins/notifications-dashboards/test_ses_sender.json';
import testEmailRecipientGroup from '../../../fixtures/plugins/notifications-dashboards/test_email_recipient_group.json';

describe('Test create email senders', () => {
  before(() => {
    // Delete all Notification configs
    cy.deleteAllNotificationConfigs();
  });

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${NOTIFICATIONS_PLUGIN_NAME}#email-senders`);
    cy.reload(true);
    cy.wait(NOTIFICATIONS_DELAY * 5);
  });

  it('creates ssl sender', () => {
    cy.get('.euiButton__text')
      .contains('Create SMTP sender')
      .click({ force: true });
    cy.get('[data-test-subj="create-sender-form-name-input"]').type(
      'test-ssl-sender'
    );
    cy.get('.euiButton__text').contains('Create').click({ force: true });
    cy.contains('Some fields are invalid.').should('exist');

    cy.get('[data-test-subj="create-sender-form-email-input"]').type(
      'test@email.com'
    );
    cy.get('[data-test-subj="create-sender-form-host-input"]').type(
      'test-host.com'
    );
    cy.get('[data-test-subj="create-sender-form-port-input"]').type('123');
    cy.get('.euiButton__text').contains('Create').click({ force: true });
    cy.contains('successfully created.').should('exist');
    cy.contains('test-ssl-sender').should('exist');
  });

  it('creates tls sender', () => {
    cy.get('.euiButton__text')
      .contains('Create SMTP sender')
      .click({ force: true });
    cy.get('[data-test-subj="create-sender-form-name-input"]').type(
      'test-tls-sender'
    );
    cy.get('[data-test-subj="create-sender-form-email-input"]').type(
      'test@email.com'
    );
    cy.get('[data-test-subj="create-sender-form-host-input"]').type(
      'test-host.com'
    );
    cy.get('[data-test-subj="create-sender-form-port-input"]').type('123');
    cy.get('[data-test-subj="create-sender-form-encryption-input"]').click({
      force: true,
    });
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('.euiContextMenuItem__text').contains('TLS').click({ force: true });
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('.euiButton__text').contains('Create').click({ force: true });
    cy.contains('successfully created.').should('exist');
    cy.contains('test-tls-sender').should('exist');
  });

  it('creates SES sender', () => {
    cy.get('.euiButton__text')
      .contains('Create SES sender')
      .click({ force: true });
    cy.get('[data-test-subj="create-ses-sender-form-name-input"]').type(
      'test-ses-sender'
    );
    cy.get('[data-test-subj="create-ses-sender-form-email-input"]').type(
      'test@email.com'
    );
    cy.get('[data-test-subj="create-ses-sender-form-role-arn-input"]').type(
      'arn:aws:iam::012345678912:role/NotificationsSESRole'
    );
    cy.get('[data-test-subj="create-ses-sender-form-aws-region-input"]').type(
      'us-east-1'
    );

    cy.get('.euiButton__text').contains('Create').click({ force: true });
    cy.contains('successfully created.').should('exist');
    cy.contains('test-ses-sender').should('exist');
  });
});

describe('Test edit senders', () => {
  before(() => {
    // Delete all Notification configs
    cy.deleteAllNotificationConfigs();

    cy.createNotificationConfig(testSslSmtpSender);
    cy.createNotificationConfig(testTlsSmtpSender);
    cy.createNotificationConfig(testSesSender);
  });

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${NOTIFICATIONS_PLUGIN_NAME}#email-senders`);
    cy.reload(true);
    cy.wait(NOTIFICATIONS_DELAY * 5);
  });

  it('edits sender email address', () => {
    cy.get('.euiCheckbox__input[aria-label="Select this row"]').eq(0).click(); // ssl sender
    cy.get('[data-test-subj="senders-table-edit-button"]').click();
    cy.get('[data-test-subj="create-sender-form-email-input"]').type(
      '{selectall}{backspace}editedtest@email.com'
    );
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('.euiButton__text').contains('Save').click({ force: true });
    cy.contains('successfully updated.').should('exist');
  });

  it('edits ses sender region', () => {
    cy.get('.euiCheckbox__input[aria-label="Select this row"]').eq(2).click(); // ses sender
    cy.get('[data-test-subj="ses-senders-table-edit-button"]').click();
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('[data-test-subj="create-ses-sender-form-aws-region-input"]').type(
      '{selectall}{backspace}us-west-2'
    );
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('.euiButton__text').contains('Save').click({ force: true });
    cy.contains('successfully updated.').should('exist');
  });
});

describe('Test delete senders', () => {
  before(() => {
    // Delete all Notification configs
    cy.deleteAllNotificationConfigs();

    cy.createNotificationConfig(testSslSmtpSender);
    cy.createNotificationConfig(testTlsSmtpSender);
    cy.createNotificationConfig(testSesSender);
  });

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${NOTIFICATIONS_PLUGIN_NAME}#email-senders`);
    cy.reload(true);
    cy.wait(NOTIFICATIONS_DELAY * 5);
  });

  it('deletes smtp senders', () => {
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('.euiCheckbox__input[aria-label="Select this row"]').eq(0).click(); // ssl sender
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('[data-test-subj="senders-table-delete-button"]').click({
      force: true,
    });
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('input[placeholder="delete"]').should('be.visible').type('delete');
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('[data-test-subj="delete-sender-modal-delete-button"]').click();
    cy.contains('successfully deleted.').should('exist');
  });

  it('deletes ses senders', () => {
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('.euiCheckbox__input[aria-label="Select this row"]').last().click(); // ses sender
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('[data-test-subj="ses-senders-table-delete-button"]').click({
      force: true,
    });
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('input[placeholder="delete"]').should('be.visible').type('delete');
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('[data-test-subj="delete-sender-modal-delete-button"]').click();
    cy.contains('successfully deleted.').should('exist');

    cy.contains('No SES senders to display').should('exist');
  });
});

describe('Test create, edit and delete recipient group', () => {
  beforeEach(() => {
    // Delete all Notification configs
    cy.deleteAllNotificationConfigs();

    cy.createNotificationConfig(testEmailRecipientGroup);

    cy.visit(
      `${BASE_PATH}/app/${NOTIFICATIONS_PLUGIN_NAME}#email-recipient-groups`
    );
    cy.reload(true);
    cy.wait(NOTIFICATIONS_DELAY * 5);
  });

  it('creates recipient group', () => {
    cy.get('.euiButton__text')
      .contains('Create recipient group')
      .click({ force: true });
    cy.get('[data-test-subj="create-recipient-group-form-name-input"]').type(
      'Test recipient group'
    );
    cy.get('.euiButton__text').contains('Create').click({ force: true });
    cy.contains('Some fields are invalid.').should('exist');

    cy.get(
      '[data-test-subj="create-recipient-group-form-description-input"]'
    ).type('Test group description');
    cy.get('[data-test-subj="comboBoxInput"]').type(
      'custom.email.1@test.com{enter}'
    );
    cy.get('[data-test-subj="comboBoxInput"]').type(
      'custom.email.2@test.com{enter}'
    );
    cy.get('[data-test-subj="comboBoxInput"]').type(
      'custom.email.3@test.com{enter}'
    );
    cy.get('[data-test-subj="comboBoxInput"]').type(
      'custom.email.4@test.com{enter}'
    );
    cy.get('[data-test-subj="comboBoxInput"]').type(
      'custom.email.5@test.com{enter}'
    );
    cy.get('[data-test-subj="comboBoxInput"]').type(
      'custom.email.6@test.com{enter}'
    );
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('.euiButton__text').contains('Create').click({ force: true });
    cy.contains('successfully created.').should('exist');
    cy.contains('Test recipient group').should('exist');
    cy.wait(NOTIFICATIONS_DELAY);
  });

  it('edits recipient group description', () => {
    cy.get('.euiCheckbox__input[aria-label="Select this row"]')
      .last()
      .click({ force: true }); // recipient group
    cy.get('[data-test-subj="recipient-groups-table-edit-button"]').click({
      force: true,
    });
    cy.get(
      '[data-test-subj="create-recipient-group-form-description-input"]'
    ).type('{selectall}{backspace}Updated group description');
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('.euiButton__text').contains('Save').click({ force: true });
    cy.contains('successfully updated.').should('exist');
  });

  it('opens email addresses popup', () => {
    cy.get('.euiTableCellContent--overflowingContent .euiLink')
      .contains('1 more')
      .click({ force: true });
    cy.contains('custom.email.6@test.com').should('exist');
  });

  it('deletes recipient groups', () => {
    cy.wait(NOTIFICATIONS_DELAY);
    cy.contains('Test recipient group').should('exist');
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('[data-test-subj="checkboxSelectAll"]').click({ force: true });
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('[data-test-subj="recipient-groups-table-delete-button"]').click({
      force: true,
    });
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get('input[placeholder="delete"]').should('be.visible').type('delete');
    cy.wait(NOTIFICATIONS_DELAY);
    cy.get(
      '[data-test-subj="delete-recipient-group-modal-delete-button"]'
    ).click({ force: true });
    cy.contains('successfully deleted.').should('exist');

    cy.contains('No recipient groups to display').should('exist');
  });
});
