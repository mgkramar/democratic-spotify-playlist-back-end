/* eslint-env jest */
global.mockPromiseThatResolves = (mockedData) => jest.fn(() => new Promise((resolve, reject) => {
  process.nextTick(() => resolve(mockedData))
}))
