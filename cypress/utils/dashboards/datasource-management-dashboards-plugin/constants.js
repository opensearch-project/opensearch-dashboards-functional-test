/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DS_API_PREFIX = '/api/saved_objects';

export const DS_API = {
  DATA_SOURCES_LISTING: `${DS_API_PREFIX}/_find?fields=id&fields=description&fields=title&per_page=10000&type=data-source`,
  CREATE_DATA_SOURCE: `${DS_API_PREFIX}/data-source`,
  DELETE_DATA_SOURCE: `${DS_API_PREFIX}/data-source/`,
};
