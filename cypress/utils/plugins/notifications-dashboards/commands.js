/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import testTlsSmtpSender from '../../../fixtures/plugins/notifications-dashboards/test_tls_smtp_sender.json';
import testSmtpEmailChannel from '../../../fixtures/plugins/notifications-dashboards/test_smtp_email_channel.json';
import { API } from './constants';

Cypress.Commands.add('deleteAllNotificationConfigs', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('openSearchUrl')}${API.CONFIGS_BASE}`,
  }).then((response) => {
    if (response.status === 200) {
      for (let i = 0; i < response.body.total_hits; i++) {
        cy.request(
          'DELETE',
          `${Cypress.env('openSearchUrl')}${API.CONFIGS_BASE}/${
            response.body.config_list[i].config_id
          }`
        );
      }
    } else {
      cy.log('Failed to get configs.', response);
    }
  });
});

Cypress.Commands.add('createNotificationConfig', (notificationConfigJSON) => {
  cy.request(
    'POST',
    `${Cypress.env('openSearchUrl')}${API.CONFIGS_BASE}`,
    notificationConfigJSON
  );
});

Cypress.Commands.add('createTestEmailChannel', () => {
  cy.createNotificationConfig(testTlsSmtpSender);
  cy.createNotificationConfig(testSmtpEmailChannel);
});
