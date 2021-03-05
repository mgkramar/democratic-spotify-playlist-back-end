const GeneralError = require('./GeneralError')

class PlaylistDoesNotBelongToUserError extends GeneralError {
  constructor (plyalistId, userId) {
    super(`The given playlist [${plyalistId}] does not belong to the user [${userId}]`, 400)
  }
}

module.exports = PlaylistDoesNotBelongToUserError
