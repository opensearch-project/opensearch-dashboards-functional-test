/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const setStorageItem = (storage, key, value) => {
  const oldValue = storage.getItem(key);
  storage.setItem(key, value);
  return () => {
    if (oldValue === null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, oldValue);
    }
  };
};
