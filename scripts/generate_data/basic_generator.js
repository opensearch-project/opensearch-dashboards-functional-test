/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { faker } = require('@faker-js/faker');
const { DateTime } = require('luxon');

class BasicDocumentGenerator {
  constructor(startTime, endTime, docCount) {
    faker.seed(200); // To generate consistent data

    this.fakeCategories = ['Cat', 'Dog', 'Rabbit', 'Hawk'];
    this.categoryCount = this.fakeCategories.length;
    this.start = this.toDateTime(startTime);
    this.end = this.toDateTime(endTime);
    const { milliseconds: diffTime } = this.end.diff(this.start).toObject();
    this.delta = Math.floor(diffTime / docCount);
    this.docCount = docCount;
    this.fixturePath = './cypress/fixtures/dashboard/opensearch_dashboards';
  }

  toDateTime(value) {
    return DateTime.fromISO(value, { zone: 'utc' });
  }

  createDoc(index) {
    const getIndexDelta = (delta) => ({ milliseconds: delta });

    return {
      timestamp: this.start.plus(getIndexDelta(index * this.delta)),
      userId: faker.datatype.uuid(),
      username: faker.internet.userName(),
      email: faker.internet.email(),
      avatar: faker.image.avatar(),
      password: faker.internet.password(),
      birthdate: faker.date.birthdate(),
      age: faker.datatype.number({
        min: 10,
        max: 100,
      }),
      salary: this.docCount + index,
      categories:
        this.fakeCategories[
          Math.floor((index * this.categoryCount) / this.docCount)
        ],
    };
  }
}

module.exports = {
  BasicDocumentGenerator,
};
