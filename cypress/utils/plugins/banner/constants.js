/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Constants for banner plugin tests
 */

export const BANNER_TIMEOUT = 60000;

export const BANNER_SELECTORS = {
  BANNER_CONTAINER: '.globalBanner',
  CALLOUT: '.euiCallOut--primary',
  CLOSE_BUTTON: '[data-test-subj="closeCallOutButton"]',
};

export const BANNER_TEXT = {
  ANNOUNCEMENT: 'This is an important announcement for all users.',
  LEARN_MORE: 'Learn more',
};

export const BANNER_LINKS = {
  LEARN_MORE: 'https://opensearch.org',
};
