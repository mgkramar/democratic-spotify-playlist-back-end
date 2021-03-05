function generatePlaylist (playlistItems = []) {
  return { body: { items: playlistItems } }
}

module.exports.generatePlaylist = generatePlaylist
