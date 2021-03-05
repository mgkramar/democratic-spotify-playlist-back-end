/* eslint-env jest */
const mockPlaySoundFile = jest.fn()
const mock = jest.mock('spotify-web-api-node', () => {
  return {
    SpotifyWebApi: { playSoundFile: mockPlaySoundFile } // mock here
  }
})

module.exports = mock
