/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function getLastPathSegment(url) {
  return url.split('/').pop();
}
