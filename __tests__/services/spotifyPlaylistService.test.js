/* global mockPromiseThatResolves */
/* eslint-env jest */
const spotifyPlaylistService = require('../../src/services/spotifyService')
const mockSpotifyWebApi = require('../../src/spotifyApi')
jest.mock('../../src/spotifyApi')

const mockiPlaylistOrderer = require('../../src/services/spotifyPlaylistOrderer')
jest.mock('../../src/services/spotifyPlaylistOrderer')

const playlistItemsFixture = require('../../__fixtures__/playListItems.fixture')
const playlistFixture = require('../../__fixtures__/playlist.fixture')
const playlistMetadataFixture = require('../../__fixtures__/playlistMetadata.fixture')
const playbackStateFixture = require('../../__fixtures__/playbackState.fixture')
const userPlaylistsFixture = require('../../__fixtures__/userPlaylists.fixture')
const currentUserProfileFixture = require('../../__fixtures__/currentUserProfile.fixture')

const PlaylistDoesNotBelongToUserError = require('../../src/errors/PlaylistDoesNotBelongToUserError')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.clearAllTimers()
  jest.clearAllMocks()
})

describe('Spotify Reorder Endpoint should be called once for each unplayed track whose position in the reordered playlist differs from the current playlist', () => {
  it('Spotify Reorder Endpoint should not be called for an empty playlist', async () => {
    // Arrange
    const playlistItems = []
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('A2')
    mockSpotifyWebApi.getPlaylistTracks = mockPromiseThatResolves(playlistTracks)
    mockSpotifyWebApi.getPlaylist = mockPromiseThatResolves(playlist)
    mockSpotifyWebApi.getMyCurrentPlaybackState = mockPromiseThatResolves(playbackState)
    mockiPlaylistOrderer.reorder = jest.fn(() => [])
    // Act
    await spotifyPlaylistService.orderPlaylist('P1')

    // Assert
    expect(mockSpotifyWebApi.reorderTracksInPlaylist).toHaveBeenCalledTimes(0)
  })

  it('Spotify Reorder Endpoint should not be called for a playlist with single item', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('A1')
    mockSpotifyWebApi.getPlaylistTracks = mockPromiseThatResolves(playlistTracks)
    mockSpotifyWebApi.getPlaylist = mockPromiseThatResolves(playlist)
    mockSpotifyWebApi.getMyCurrentPlaybackState = mockPromiseThatResolves(playbackState)
    mockiPlaylistOrderer.reorder = jest.fn(() => playlistTracks.body.items[0])
    // Act
    await spotifyPlaylistService.orderPlaylist('P1')

    // Assert
    expect(mockSpotifyWebApi.reorderTracksInPlaylist).toHaveBeenCalledTimes(0)
  })

  it('Spotify Reorder Tracks In Playlist should be called 2 times for a playlist [A1*, A2, B1]', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }, { trackId: 'A2' }, { trackId: 'B1' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('A1')
    mockSpotifyWebApi.getPlaylistTracks = mockPromiseThatResolves(playlistTracks)
    mockSpotifyWebApi.getPlaylist = mockPromiseThatResolves(playlist)
    mockSpotifyWebApi.getMyCurrentPlaybackState = mockPromiseThatResolves(playbackState)
    mockiPlaylistOrderer.reorder = jest.fn(() => [playlistTracks.body.items[0], playlistTracks.body.items[2], playlistTracks.body.items[1]])

    // Act
    await spotifyPlaylistService.orderPlaylist('P1')

    // Assert
    expect(mockSpotifyWebApi.reorderTracksInPlaylist).toHaveBeenCalledTimes(2)
    expect(mockSpotifyWebApi.reorderTracksInPlaylist).toHaveBeenNthCalledWith(1, 'P1', 1, 2, 'S1')
    expect(mockSpotifyWebApi.reorderTracksInPlaylist).toHaveBeenNthCalledWith(2, 'P1', 2, 1, 'S1')
  })

  it('Spotify Reorder Tracks In Playlist should be called 2 times for a playlist [A1, *A2, B1, C1, A3]', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }, { trackId: 'A2' }, { trackId: 'B1' }, { trackId: 'C1' }, { trackId: 'A3' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('A2')
    mockSpotifyWebApi.getPlaylistTracks = mockPromiseThatResolves(playlistTracks)
    mockSpotifyWebApi.getPlaylist = mockPromiseThatResolves(playlist)
    mockSpotifyWebApi.getMyCurrentPlaybackState = mockPromiseThatResolves(playbackState)
    mockiPlaylistOrderer.reorder = jest.fn(() => [playlistTracks.body.items[0], playlistTracks.body.items[1], playlistTracks.body.items[4], playlistTracks.body.items[3], playlistTracks.body.items[2]])

    // Act
    await spotifyPlaylistService.orderPlaylist('P1')

    // Assert
    expect(mockSpotifyWebApi.reorderTracksInPlaylist).toHaveBeenCalledTimes(2)
    expect(mockSpotifyWebApi.reorderTracksInPlaylist).toHaveBeenNthCalledWith(1, 'P1', 2, 4, 'S1')
    expect(mockSpotifyWebApi.reorderTracksInPlaylist).toHaveBeenNthCalledWith(2, 'P1', 4, 2, 'S1')
  })

  it('Spotify Reorder Endpoint should not be called for any playlist if the currently playing song of the user is not in the playlist', async () => {
    // Arrange
    const playlistItems = [{ trackId: 'A1' }, { trackId: 'A2' }, { trackId: 'B1' }, { trackId: 'C1' }, { trackId: 'A3' }]
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistItems(playlistItems))
    const playlist = playlistMetadataFixture.generatePlaylistSnapshotId('S1')
    const playbackState = playbackStateFixture.generatePlaybackState('N1')
    mockSpotifyWebApi.getPlaylistTracks = mockPromiseThatResolves(playlistTracks)
    mockSpotifyWebApi.getPlaylist = mockPromiseThatResolves(playlist)
    mockSpotifyWebApi.getMyCurrentPlaybackState = mockPromiseThatResolves(playbackState)
    mockiPlaylistOrderer.reorder = jest.fn(() => playlistTracks.items)

    // Act
    await spotifyPlaylistService.orderPlaylist('P1')

    // Assert
    expect(mockSpotifyWebApi.reorderTracksInPlaylist).toHaveBeenCalledTimes(0)
  })

  // TODO implement this correctly
  it.skip('Spotify Playlist Items Endpoint should be called 2 times for a playlist with 101 tracks', async () => {
    const playlistTracks = playlistFixture.generatePlaylist(playlistItemsFixture.generatePlaylistWithNItems(101))
    mockSpotifyWebApi.getPlaylistTracks = mockPromiseThatResolves(playlistTracks)
    await spotifyPlaylistService.orderPlaylist('P1')

    // Assert
    expect(mockSpotifyWebApi.getPlaylistTracks).toHaveBeenCalledTimes(2)
  })

  it.todo('An exception should be returned if there was a problem retrieving User´s Current Playback State from Spotify')

  it.todo('An exception should be returned if there was a problem retrieving Playlist Snapshot ID from Spotify')
})

describe('Unsucessuful playlist management', () => {
  it('Trying to manage a playlist that the user does not own should throw exception and should not trigger a playlist reorder', async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsResponse([{ userId: 'U2', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfileResponse({ userId: 'U1' })
    mockSpotifyWebApi.getUserPlaylists = mockPromiseThatResolves(userPlaylists)
    mockSpotifyWebApi.getMe = mockPromiseThatResolves(currentUserProfile)

    // Act - Assert
    await expect(spotifyPlaylistService.managePlaylist('P1'))
      .rejects
      .toThrow(PlaylistDoesNotBelongToUserError)
    expect(setInterval).toHaveBeenCalledTimes(0)
  })

  it('Trying to manage a playlist that does not exist should throw exception and should not trigger a plyalist reorder', async () => {
    // Arrange
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsResponse([{ userId: 'U1', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfileResponse({ userId: 'U1' })
    mockSpotifyWebApi.getUserPlaylists = mockPromiseThatResolves(userPlaylists)
    mockSpotifyWebApi.getMe = mockPromiseThatResolves(currentUserProfile)

    // Act
    // Assert
    await expect(spotifyPlaylistService.managePlaylist('NP1'))
      .rejects
      .toThrow(PlaylistDoesNotBelongToUserError)
    expect(setInterval).toHaveBeenCalledTimes(0)
  })
})

describe('Sucessful playlist management', () => {
  beforeEach(() => {
    const userPlaylists = userPlaylistsFixture.generateUserPlaylistsResponse([{ userId: 'U1', playlistId: 'P1' }])
    const currentUserProfile = currentUserProfileFixture.generateCurrentUserProfileResponse({ userId: 'U1' })
    mockSpotifyWebApi.getUserPlaylists = mockPromiseThatResolves(userPlaylists)
    mockSpotifyWebApi.getMe = mockPromiseThatResolves(currentUserProfile)
  })

  it('The method to order a playlist should be called indefenitly after a playlist is given to be managed by the service', async () => {
    // Arrange
    spotifyPlaylistService.orderPlaylist = jest.fn()

    // Act
    await spotifyPlaylistService.managePlaylist('P1')
    jest.runOnlyPendingTimers()
    jest.runOnlyPendingTimers()

    // Assert
    expect(setInterval).toHaveBeenCalledTimes(1)
    expect(spotifyPlaylistService.orderPlaylist).toHaveBeenCalledTimes(2)
  })

  // TODO check that the timer object has been correctly deleted
  it('When the service is requested to unmanage the playist, the timer for that playlist should cease running', async () => {
    // Arrange
    spotifyPlaylistService.orderPlaylist = jest.fn()

    // Act
    await spotifyPlaylistService.managePlaylist('P1')
    spotifyPlaylistService.unmanagePlaylist('P1')

    // Assert
    expect(clearInterval).toHaveBeenCalledTimes(1)
  })
})
