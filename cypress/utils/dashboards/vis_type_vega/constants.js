/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BASE_PATH } from '../../base_constants';

// Data
export const VEGA_INDEX_DATA = 'vis-vega.data.txt';
export const VEGA_PATH_FIXTURE =
  'dashboard/opensearch_dashboards/vis_type_vega/';
export const VEGA_PATH_INDEX_DATA = VEGA_PATH_FIXTURE + VEGA_INDEX_DATA;
export const VEGA_INDEX_START_TIME = 'Dec 31, 2021 @ 00:00:00.000';
export const VEGA_INDEX_END_TIME = 'Oct 2, 2022 @ 00:00:00.000';
export const VEGA_INDEX_ID = 'vis-vega';
export const VEGA_INDEX_PATTERN = 'index-pattern-vis-vega';

// App URL Paths
export const VEGA_VIS_APP_PATH = '/app/visualize';
export const VEGA_CREATE_URL = `${BASE_PATH}${VEGA_VIS_APP_PATH}#/create?type=vega`;
