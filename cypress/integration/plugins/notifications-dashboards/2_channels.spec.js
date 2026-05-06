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

import testSlackChannel from '../../../fixtures/plugins/notifications-dashboards/test_slack_channel.json';
import testChimeChannel from '../../../fixtures/plugins/notifications-dashboards/test_chime_channel.json';
import testWebhookChannel from '../../../fixtures/plugins/notifications-dashboards/test_webhook_channel.json';
import testTlsSmtpSender from '../../../fixtures/plugins/notifications-dashboards/test_tls_smtp_sender.json';

// V13 fix: Robust function to check for success messages in the toast list
const expectSuccessToast = (message = 'successfully') => {
  // Simpler global check for toast list containing the message
  cy.get('[data-test-subj="globalToastList"]', { timeout: 60000 })
    .contains(message, { timeout: 60000 })
    .should('be.visible');
};

// Helper to click the create button which might have duplicates (top and bottom)
const clickCreateChannelButton = () => {
  cy.get('[data-test-subj="create-channel-create-button"]')
    .filter(':visible')
    .first()
    .should('be.visible')
    .click({ force: true });
};

// Helper to select from combobox by typing (more robust than clicking)
const selectFromComboBox = (index, text) => {
  cy.get('[data-test-subj="comboBoxInput"]')
    .eq(index)
    .should('be.visible')
    .find('input') // V13 fix: Target the actual input inside the wrapper div
    .clear({ force: true })
    .type(`${text}{enter}`, { force: true });
  cy.wait(NOTIFICATIONS_DELAY);
};

describe('Test create channels', { testIsolation: true }, () => {
  before(() => {
    // Delete all Notification configs
    cy.deleteAllNotificationConfigs();
    cy.createNotificationConfig(testTlsSmtpSender);
    cy.wait(NOTIFICATIONS_DELAY * 2);
  });

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${NOTIFICATIONS_PLUGIN_NAME}#create-channel`);
    // V13 fix: Wait for a specific input instead of a general ID
    cy.get('[placeholder="Enter channel name"]', { timeout: 60000 }).should(
      'be.visible'
    );
    cy.wait(NOTIFICATIONS_DELAY);
  });

  it('creates a slack channel and send test message', () => {
    clickCreateChannelButton();
    cy.contains('Some fields are invalid.').should('be.visible');

    cy.get('[placeholder="Enter channel name"]').type('Test slack channel');
    cy.get('[data-test-subj="create-channel-slack-webhook-input"]').type(
      'https://hooks.slack.com/services/A123456/B1234567/A1B2C3D4E5F6G7H8I9J0K1L2'
    );

    cy.get('[data-test-subj="create-channel-send-test-message-button"]').click({
      force: true,
    });

    // This needs some time to appear as it will wait for backend call to timeout
    cy.get('[data-test-subj="globalToastList"]', { timeout: 60000 })
      .contains('test message.', { timeout: 60000 })
      .should('be.visible');

    clickCreateChannelButton();
    expectSuccessToast('successfully created.');
  });

  it('creates a chime channel', () => {
    cy.get('[placeholder="Enter channel name"]').type('Test chime channel');

    // Robust way: Click the super select button regardless of its current text
    cy.get('.euiSuperSelectControl')
      .should('be.visible')
      .click({ force: true });
    cy.get('.euiContextMenuItem__text')
      .contains('Chime')
      .should('be.visible')
      .click({ force: true });
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('[data-test-subj="create-channel-chime-webhook-input"]').type(
      'https://hooks.chime.aws/incomingwebhooks/sample_chime_url?token=123456'
    );

    clickCreateChannelButton();
    expectSuccessToast('successfully created.');
  });

  it('creates an email channel', () => {
    cy.get('[placeholder="Enter channel name"]').type('Test email channel');

    cy.get('.euiSuperSelectControl')
      .should('be.visible')
      .click({ force: true });
    cy.get('.euiContextMenuItem__text')
      .contains('Email')
      .should('be.visible')
      .click({ force: true });
    cy.wait(NOTIFICATIONS_DELAY);

    // custom data-test-subj does not work on combo box. Type to filter.
    selectFromComboBox(0, 'test-tls-sender');

    cy.get('.euiButton__text')
      .contains('Create recipient group')
      .should('be.visible')
      .click({ force: true });
    cy.get('[data-test-subj="create-recipient-group-form-name-input"]').type(
      'Test recipient group'
    );
    cy.get(
      '[data-test-subj="create-recipient-group-form-description-input"]'
    ).type('Recipient group created while creating email channel.');
    cy.get('[data-test-subj="comboBoxInput"]')
      .last()
      .find('input')
      .type('custom.email@test.com{enter}');

    cy.get(
      '[data-test-subj="create-recipient-group-modal-create-button"]'
    ).click({ force: true });
    cy.get('.euiModal').should('not.exist');
    expectSuccessToast('successfully created.');
    cy.wait(NOTIFICATIONS_DELAY);

    clickCreateChannelButton();
    expectSuccessToast('successfully created.');
  });

  it('creates an email channel with ses sender', () => {
    cy.get('[placeholder="Enter channel name"]').type(
      'Test email channel with ses'
    );

    cy.get('.euiSuperSelectControl')
      .should('be.visible')
      .click({ force: true });
    cy.get('.euiContextMenuItem__text')
      .contains('Email')
      .should('be.visible')
      .click({ force: true });
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('input.euiRadio__input#ses_account').click({ force: true });
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('.euiButton__text')
      .contains('Create SES sender')
      .should('be.visible')
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
    cy.get('[data-test-subj="create-ses-sender-modal-create-button"]').click({
      force: true,
    });
    cy.get('.euiModal').should('not.exist');
    expectSuccessToast('successfully created.');
    cy.wait(NOTIFICATIONS_DELAY);

    // custom data-test-subj does not work on combo box. Type to filter.
    selectFromComboBox(1, 'Test recipient group');

    clickCreateChannelButton();
    expectSuccessToast('successfully created.');
  });

  it('creates a webhook channel', () => {
    cy.get('[placeholder="Enter channel name"]').type('Test webhook channel');

    cy.get('.euiSuperSelectControl')
      .should('be.visible')
      .click({ force: true });
    cy.get('.euiContextMenuItem__text')
      .contains('Custom webhook')
      .should('be.visible')
      .click({ force: true });
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('[data-test-subj="custom-webhook-url-input"]').type(
      'https://custom-webhook-test-url.com:8888/test-path?params1=value1&params2=value2&params3=value3&params4=value4&params5=values5&params6=values6&params7=values7'
    );

    clickCreateChannelButton();
    expectSuccessToast('successfully created.');
  });

  it('creates an sns channel', () => {
    cy.get('[placeholder="Enter channel name"]').type('test-sns-channel');

    cy.get('.euiSuperSelectControl')
      .should('be.visible')
      .click({ force: true });
    cy.get('.euiContextMenuItem__text')
      .contains('Amazon SNS')
      .should('be.visible')
      .click({ force: true });
    cy.wait(NOTIFICATIONS_DELAY);

    cy.get('[data-test-subj="sns-settings-topic-arn-input"]').type(
      'arn:aws:sns:us-west-2:123456789012:notifications-test'
    );
    cy.get('[data-test-subj="sns-settings-role-arn-input"]').type(
      'arn:aws:iam::012345678901:role/NotificationsSNSRole'
    );

    clickCreateChannelButton();
    expectSuccessToast('successfully created.');
  });
});

describe('Test channels table', { testIsolation: true }, () => {
  before(() => {
    // Delete all Notification configs
    cy.deleteAllNotificationConfigs();

    // Create test channels
    cy.createNotificationConfig(testSlackChannel);
    cy.createNotificationConfig(testChimeChannel);
    cy.createNotificationConfig(testWebhookChannel);
    cy.createTestEmailChannel();
    cy.wait(NOTIFICATIONS_DELAY * 2);
  });

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${NOTIFICATIONS_PLUGIN_NAME}#channels`);
    // V13 fix: Wait for table to be loaded
    cy.get('.euiTableRow', { timeout: 60000 }).should('be.visible');
  });

  it('displays channels', () => {
    cy.contains('Test slack channel').should('be.visible');
    cy.contains('Test email channel').should('be.visible');
    cy.contains('Test chime channel').should('be.visible');
    cy.contains('Test webhook channel').should('be.visible');
  });

  it('mutes channels', () => {
    cy.get('.euiCheckbox__input[aria-label="Select this row"]').eq(0).click(); // chime channel
    cy.get('.euiButton__text').contains('Actions').click({ force: true });
    cy.get('.euiContextMenuItem__text').contains('Mute').click({ force: true });
    cy.get('[data-test-subj="mute-channel-modal-mute-button"]').click({
      force: true,
    });

    // V13 fix: Wait for modal to disappear before checking toast
    cy.get('.euiModal', { timeout: 10000 }).should('not.exist');
    expectSuccessToast('successfully muted.');
    cy.contains('Muted').should('be.visible');
  });

  it('filters channels', () => {
    cy.get('input[placeholder="Search"]')
      .type('chime{enter}')
      .trigger('search');
    // V13 fix: Wait for table to update after filter
    cy.get('.euiTableRow', { timeout: 10000 }).should('have.length', 1);
    cy.contains('Test chime channel').should('be.visible');
    cy.contains('Test slack channel').should('not.exist');
    cy.contains('Test email channel').should('not.exist');
    cy.contains('Test webhook channel').should('not.exist');

    cy.get('input[placeholder="Search"]')
      .clear()
      .type('Source{enter}')
      .trigger('search');
    cy.contains('No channels to display').should('be.visible');
  });
});

describe('Test channel details', { testIsolation: true }, () => {
  before(() => {
    // Ensure data exists for this suite independently
    cy.deleteAllNotificationConfigs();
    cy.createNotificationConfig(testSlackChannel);
    cy.createNotificationConfig(testChimeChannel);
    cy.createNotificationConfig(testWebhookChannel);
    cy.createTestEmailChannel();
    cy.wait(NOTIFICATIONS_DELAY * 2);
  });

  beforeEach(() => {
    cy.visit(`${BASE_PATH}/app/${NOTIFICATIONS_PLUGIN_NAME}#channels`);
    // V13 fix: Wait for table before clicking
    cy.get('.euiTableRow', { timeout: 60000 }).should('be.visible');
    cy.contains('Test webhook channel').click();
    // V13 fix: Ensure navigation is successful
    cy.location('hash').should('include', 'channel-details');
  });

  it('displays channel details', () => {
    cy.contains('custom-webhook-test-url.com').should('be.visible');
    cy.contains('test-path').should('be.visible');
    cy.contains('8888').should('be.visible');
    cy.contains('2 more').click();
    cy.contains('Query parameters (7)').should('be.visible');
    cy.contains('params7').should('be.visible');
  });

  it('mutes and unmutes channels', () => {
    cy.contains('Mute channel').click({ force: true });
    cy.get('[data-test-subj="mute-channel-modal-mute-button"]').click({
      force: true,
    });
    cy.get('.euiModal', { timeout: 10000 }).should('not.exist');
    expectSuccessToast('successfully muted.');
    cy.contains('Muted').should('be.visible');

    cy.contains('Unmute channel').click({ force: true });
    expectSuccessToast('successfully unmuted.');
    cy.contains('Active').should('be.visible');
  });

  it('edits channels', () => {
    cy.contains('Actions').click({ force: true });
    cy.contains('Edit').click({ force: true });
    cy.contains('Edit channel').should('be.visible');
    cy.get('.euiText').contains('Custom webhook').should('be.visible');

    cy.get('[data-test-subj="create-channel-description-input"]').type(
      '{selectall}{backspace}Updated custom webhook description'
    );
    // In original code, there was also an euiTextArea type
    cy.get('.euiTextArea').type(
      '{selectall}{backspace}Updated custom webhook description'
    );
    cy.contains('Save').click({ force: true });

    expectSuccessToast('successfully updated.');
    cy.contains('Updated custom webhook description').should('be.visible');
  });

  it('deletes channels', () => {
    cy.contains('Actions').click({ force: true });
    cy.contains('Delete').click({ force: true });
    cy.get('input[placeholder="delete"]').type('delete');
    cy.get('[data-test-subj="delete-channel-modal-delete-button"]').click({
      force: true,
    });
    cy.get('.euiModal', { timeout: 10000 }).should('not.exist');
    expectSuccessToast('successfully deleted.');

    // Check it's gone from table
    cy.visit(`${BASE_PATH}/app/${NOTIFICATIONS_PLUGIN_NAME}#channels`);
    cy.get('.euiTableRow', { timeout: 60000 }).should('be.visible');
    cy.contains('Test webhook channel').should('not.exist');
    cy.contains('Test slack channel').should('be.visible');
  });
});
