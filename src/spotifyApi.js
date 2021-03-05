const SpotifyWebApi = require('spotify-web-api-node')

const redirectUri = process.env.SPOTIFY_CALLBACK
const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

const spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret: clientSecret
})

module.exports = spotifyApi
