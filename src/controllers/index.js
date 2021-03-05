const voteSkipService = require('../services/voteSkipService')
const spotifyService = require('../services/spotifyService')

function login (req, res) {
  res.redirect(spotifyService.createAuthorizeURL())
}

async function callback (req, res) {
  res.send('You are successfully logged in.')
  await spotifyService.authenticate(req.query.code)
}

async function current (req, res) {
  /* const current = await spotifyApi.getMyCurrentPlaybackState({
  })
    .catch((err) => {
      console.log('Something went wrong!', err)
    })
  if (current) {
    res.send(current.body)
  } else {
    res.send('You are not logged.')
  } */
}

function register (req, res) {
  if (voteSkipService.registerDevice(req.header('deviceId'))) {
    res.statusCode = 200
  } else {
    res.statusCode = 201
  }
  res.send()
}

function voteskip (req, res) {
  if (voteSkipService.registerVote(req.header('deviceId'))) {
    res.statusCode = 200
    res.json({ message: 'Vote skip succesfuly registred' })
  } else {
    res.statusCode = 401
    res.json({ message: 'Device not registred' })
  }

  res.send()
}

async function addPlaylist (req, res) {
  spotifyService.managePlaylist(req.body.playlistId)
  res.statusCode = 201
  res.json({ message: 'Playlist Added' })
}

module.exports = {
  login,
  callback,
  current,
  voteskip,
  register,
  addPlaylist
}
