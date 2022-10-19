/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DS_API_PREFIX = '/api/saved_objects';
export const OSD_TEST_DOMAIN_ENDPOINT_URL = 'https://test';
export const OSD_INVALID_ENPOINT_URL = 'test';
export const DS_API = {
  DATA_SOURCES_LISTING: `${DS_API_PREFIX}/_find?fields=id&fields=description&fields=title&per_page=10000&type=data-source`,
  CREATE_DATA_SOURCE: `${DS_API_PREFIX}/data-source`,
  DELETE_DATA_SOURCE: `${DS_API_PREFIX}/data-source/`,
};

export const TIMEOUT_OPTS = { timeout: 60000 };
export const FORCE_CLICK_OPTS = { force: true };

/* Mocks */

export const DS_JSON = {
  attributes: {
    title: 'ds_for_update_test',
    description: 'test ds_description_update',
    endpoint: OSD_TEST_DOMAIN_ENDPOINT_URL,
    auth: {
      type: 'no_auth',
    },
  },
};

export const DS_JSON_2 = {
  attributes: {
    title: 'ds_dup_test',
    description: 'test ds_description_update',
    endpoint: OSD_TEST_DOMAIN_ENDPOINT_URL,
    auth: {
      type: 'no_auth',
    },
  },
};

export const DS_JSON_UNIQUE_VALUES = {
  attributes: {
    title: 'ds_unique_title',
    description: '',
    endpoint: OSD_TEST_DOMAIN_ENDPOINT_URL,
    auth: {
      type: 'no_auth',
      credentials: {
        username: 'a',
        password: 'a',
      },
    },
  },
};
