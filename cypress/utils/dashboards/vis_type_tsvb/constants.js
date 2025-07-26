/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../base_constants';

// Data
export const TSVB_INDEX_DATA = 'metrics.data.txt';
export const TSVB_PATH_FIXTURE =
  'dashboard/opensearch_dashboards/vis_type_tsvb/';
export const TSVB_PATH_INDEX_DATA = TSVB_PATH_FIXTURE + TSVB_INDEX_DATA;

// Update the constants
export const TSVB_INDEX_START_TIME = 'May 16, 2010 @ 00:00:00.000';
export const TSVB_INDEX_END_TIME = 'May 16, 2024 @ 00:00:00.000';
export const TSVB_INDEX_ID = 'vis-metrics';
export const TSVB_INDEX_PATTERN = 'index-pattern-vis-metrics';

export const TSVB_VIS_TYPE = 'visualization';

// App URL Paths
export const VIS_APP_PATH = '/app/visualize';
export const TSVB_CREATE_URL = `${BASE_PATH}${VIS_APP_PATH}#/create?type=metrics`;
