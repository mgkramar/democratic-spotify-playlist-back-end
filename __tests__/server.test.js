/* eslint-env jest */
const request = require('supertest')
const server = require('../src/server')
const voteSkip = require('../src/services/voteSkipService')
const spotifyService = require('../src/services/spotifyService')
jest.mock('../src/services/spotifyService')

const PlaylistDoesNotBelongToUserError = require('../src/errors/PlaylistDoesNotBelongToUserError')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.clearAllMocks()
})

afterAll(() => {
  server.close()
})

describe('Device registration', () => {
  it('The fist time a device is registred should return 201', async () => {
    voteSkip.registerDevice = jest.fn(() => false)

    const res = await request(server)
      .get('/register')
      .set('deviceId', 'XXXX')
      .send()

    expect(res.statusCode).toBe(201)
  })

  it('After the first registration, a device register return 200', async () => {
    voteSkip.registerDevice = jest.fn(() => true)

    const res = await request(server)
      .get('/register')
      .set('deviceId', 'YYYY')
      .send()

    expect(res.statusCode).toBe(200)
  })
})

describe('Voteskip', () => {
  it('A registred device should get 200 when voteskiping', async () => {
    voteSkip.registerVote = jest.fn(() => true)

    const res = await request(server)
      .get('/voteskip')
      .set('deviceId', 'YYYY1')
      .send()
    expect(res.statusCode).toBe(200)
  })

  it('An uregistred device should get 401 when voteskiping', async () => {
    voteSkip.registerVote = jest.fn(() => false)

    const res = await request(server)
      .get('/voteskip')
      .set('deviceId', 'YYYY2')
      .send()

    expect(res.statusCode).toBe(401)
  })

  it.todo('An uregistred device should get 401 when voteskiping')
})

describe('Playlist', () => {
  it('When a client requests to add a playlist that they do not own, an status code 400 should be returned', async () => {
    spotifyService.managePlaylist = jest.fn(() => { throw new PlaylistDoesNotBelongToUserError('P1', 'U1') })

    const res = await request(server)
      .post('/playlist')
      .send({ playlistId: 'P1' })

    expect(res.statusCode).toBe(400)
    expect(res.body.message).toBe('The given playlist [P1] does not belong to the user [U1]')
  })

  it('When a client requests to add a playlist that they own for the first time, an status code 201 should be returned', async () => {
    spotifyService.managePlaylist = jest.fn(() => true)

    const res = await request(server)
      .post('/playlist')
      .send({ playlistId: 'P1' })

    expect(res.statusCode).toBe(201)
  })

  it.todo('When a client requests to add a playlist that they own after the first time, an status code 200 should be returned')

  it.todo('When a client requests to remove a playlist that they own for the first time, an status code 200 should be returned')
  it.todo('When a client requests to remove a playlist that they do not own, an status code 400 should be returned')

  it.todo('When a client requests to remove a playlist that was never added, an status code 400 should be returned')
})
