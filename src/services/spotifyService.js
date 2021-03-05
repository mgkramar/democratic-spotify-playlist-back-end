const spotifyApi = require('../../src/spotifyApi')
const spotifyPlaylistOderer = require('./spotifyPlaylistOrderer')

const PlaylistDoesNotBelongToUserError = require('../errors/PlaylistDoesNotBelongToUserError')

const managedPlaylists = {}

const scopes = [
  'user-read-private',
  'user-read-playback-state',
  'playlist-modify-public',
  'playlist-modify-private'
]

const state = null

async function authenticate (code) {
  const data = await spotifyApi.authorizationCodeGrant(code).catch((err) => {
    console.log('Something went wrong!', err)
  })
  if (data) {
    console.log(data.body)
    spotifyApi.setAccessToken(data.body.access_token)
    spotifyApi.setRefreshToken(data.body.refresh_token)
    setInterval(
      () =>
        spotifyApi.refreshAccessToken().then(
          function (data) {
            console.log('The access token has been refreshed!')
            spotifyApi.setAccessToken(data.body.access_token)
          },
          function (err) {
            console.log('Could not refresh access token', err)
          }
        ),
      data.body.expires_in * 500
    )
  } else {
    console.log('Please Login')
  }
}

function createAuthorizeURL () {
  return spotifyApi.createAuthorizeURL(scopes, state)
}

function retrievePlaylistTracks (playlistId) {
  const offsetCounter = 0
  return spotifyApi
    .getPlaylistTracks(playlistId, {
      offset: offsetCounter,
      fields: 'items(added_at, added_by.id,track(id))'
    })
    .then(
      function (data) {
        return data.body
      },
      function (err) {
        console.log('Error while retrieving playlist tracks!', err)
      }
    )
}

function retrievePlaylistSnapshotId (playlistId) {
  return spotifyApi.getPlaylist(playlistId, { fields: 'snapshot_id' }).then(
    function (data) {
      return data.body?.snapshot_id ?? ''
    },
    function (err) {
      console.log(
        'Error while fetching information of the playlist tracks!',
        err
      )
      // Exception here
    }
  )
}

function retrieveCurrentTrackId () {
  return spotifyApi.getMyCurrentPlaybackState().then(
    function (data) {
      return data.body.item?.id ?? ''
    },
    function (err) {
      console.log('Error while getting User´s playback state!', err)
      return ''
    }
  )
}

function retrieveCurrentUserProfile () {
  return spotifyApi.getMe().then(
    function (data) {
      return data.body ?? {}
    },
    function (err) {
      console.log('Error while getting User Profile!', err)
      return ''
    }
  )
}

function retrieveUserPlaylists () {
  return spotifyApi.getUserPlaylists().then(
    function (data) {
      return data.body?.items ?? []
    },
    function (err) {
      console.log('Error while retriever User Playlists!', err)
      return ''
    }
  )
}

async function orderPlaylist (playlistId) {
  let currenPlaylist = retrievePlaylistTracks(playlistId)
  let currentTrackId = retrieveCurrentTrackId()
  const playlistSnapshotId = retrievePlaylistSnapshotId(playlistId);
  [currenPlaylist, currentTrackId] = await Promise.all([currenPlaylist, currentTrackId]).catch((err) => { throw err })
  const currentPlaylistTracks = currenPlaylist.items
  const currentTrack = currentPlaylistTracks.find((trackInfo) => trackInfo.track.id === currentTrackId) ?? {}
  const reorderedPlaylistTracks = spotifyPlaylistOderer.reorder(currentPlaylistTracks, currentTrack)
  reorderPlaylistOnSpotify(currentPlaylistTracks, reorderedPlaylistTracks, currentTrack, playlistId, await playlistSnapshotId)
}

async function reorderPlaylistOnSpotify (
  currentPlaylistTracks,
  reorderedPlaylistTracks,
  currentTrack,
  playlistId,
  playlistSnapshotId
) {
  const nextTrackPosition = currentPlaylistTracks.indexOf(currentTrack) + 1
  for (const track of currentPlaylistTracks.slice(nextTrackPosition)) {
    const positionInCurentPlaylist = currentPlaylistTracks.indexOf(track)
    const positionInOrderedPlaylist = reorderedPlaylistTracks.indexOf(track)
    if (positionInCurentPlaylist !== positionInOrderedPlaylist) {
      spotifyApi.reorderTracksInPlaylist(playlistId, positionInCurentPlaylist, positionInOrderedPlaylist, playlistSnapshotId)
    }
  }
}

async function managePlaylist (playlistId) {
  const userPlaylists = retrieveUserPlaylists()
  const userId = (await retrieveCurrentUserProfile()).id
  const userHasPlaylistWithPlaylistId = (await userPlaylists).some(
    (playlist) => playlist.id === playlistId && playlist.owner.id === userId
  )

  if (!userHasPlaylistWithPlaylistId) {
    throw new PlaylistDoesNotBelongToUserError(playlistId, userId)
  }

  const timer = setInterval(function () {
    module.exports.orderPlaylist(playlistId)
  }, 30 * 1000)
  managedPlaylists[playlistId] = timer
}

function unmanagePlaylist (playlistId) {
  clearInterval(managedPlaylists[playlistId])
  delete managedPlaylists[playlistId]
}

module.exports = {
  authenticate,
  createAuthorizeURL,
  retrievePlaylistTracks,
  retrievePlaylistSnapshotId,
  retrieveCurrentTrackId,
  orderPlaylist,
  managePlaylist,
  unmanagePlaylist
}
