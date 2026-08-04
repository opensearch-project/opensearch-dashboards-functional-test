/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DS_API_PREFIX = '/api/saved_objects';
export const OSD_TEST_DOMAIN_ENDPOINT_URL = 'https://opensearch.org';
export const OSD_TEST_DATA_SOURCE_ENDPOINT_NO_AUTH = Cypress.env(
  'remoteDataSourceNoAuthUrl'
);
export const OSD_TEST_DATA_SOURCE_ENDPOINT_BASIC_AUTH = Cypress.env(
  'remoteDataSourceBasicAuthUrl'
);
export const USERNAME = Cypress.env('remoteDataSourceBasicAuthUsername');
export const PASSWORD = Cypress.env('remoteDataSourceBasicAuthPassword');

export const OSD_INVALID_ENDPOINT_URL = 'test';
export const DS_API = {
  DATA_SOURCES_LISTING: `${DS_API_PREFIX}/_find?fields=id&fields=description&fields=title&per_page=10000&type=data-source`,
  CREATE_DATA_SOURCE: `${DS_API_PREFIX}/data-source`,
  DELETE_DATA_SOURCE: `${DS_API_PREFIX}/data-source/`,
};
export const DS_NO_AUTH_LABEL = 'RemoteDataSourceNoAuth';

export const DEFAULT_DS_TITLE = 'DefaultDataSource';

export const DS_BASIC_AUTH_HEADER = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;
export const DS_BASIC_AUTH_LABEL = 'RemoteDataSourceBasicAuth';

export const TIMEOUT_OPTS = { timeout: 60000 };
export const FORCE_CLICK_OPTS = { force: true };
export const DATASOURCE_DELAY = 1000;
// test data
export const REGION = 'us-east-1';
export const ACCESS_KEY = 'accessKey';
export const SECRET_KEY = 'secretKey';

export const AUTH_TYPE_SIGV4 = 'sigv4';
export const AUTH_TYPE_NO_AUTH = 'no_auth';
export const AUTH_TYPE_BASIC_AUTH = 'username_password';
export const SERVICE_TYPE_OPENSEARCH = 'es';
export const SERVICE_TYPE_OPENSEARCH_SERVERLESS = 'aoss';

/* Mocks */

export const DS_JSON = {
  attributes: {
    title: 'ds_for_update_test',
    description: 'test ds_description_update',
    endpoint: OSD_TEST_DATA_SOURCE_ENDPOINT_NO_AUTH,
    auth: {
      type: AUTH_TYPE_NO_AUTH,
    },
  },
};

export const DS_JSON_2 = {
  attributes: {
    title: 'ds_dup_test',
    description: 'test ds_description_update',
    endpoint: OSD_TEST_DATA_SOURCE_ENDPOINT_NO_AUTH,
    auth: {
      type: AUTH_TYPE_NO_AUTH,
    },
  },
};

export const DS_JSON_UNIQUE_VALUES = {
  attributes: {
    title: 'ds_unique_title',
    description: '',
    endpoint: OSD_TEST_DATA_SOURCE_ENDPOINT_NO_AUTH,
    auth: {
      type: AUTH_TYPE_NO_AUTH,
      credentials: {
        username: 'a',
        password: 'a',
        region: REGION,
        accessKey: 'a',
        secretKey: 'a',
        service: SERVICE_TYPE_OPENSEARCH_SERVERLESS,
      },
    },
  },
};
