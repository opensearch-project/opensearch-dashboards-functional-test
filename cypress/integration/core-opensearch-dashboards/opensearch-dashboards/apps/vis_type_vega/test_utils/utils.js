/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import _ from 'lodash';

export const updateVegaSpec = ({
  dataSourceName,
  indexName,
  isDataFieldAnArray,
  spec,
}) => {
  const newSpec = _.cloneDeep(spec);
  if (isDataFieldAnArray) {
    if (dataSourceName) {
      newSpec.data[0].url.data_source_name = dataSourceName;
    }
    newSpec.data[0].url.index = indexName;
  } else {
    if (dataSourceName) {
      newSpec.data.url.data_source_name = dataSourceName;
    }
    newSpec.data.url.index = indexName;
  }

  return newSpec;
};
