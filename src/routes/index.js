const express = require('express')
const asyncHandler = require('express-async-handler')

const index = require('../controllers/index')
const router = express.Router()

router.get('/secret-login', index.login)
router.get('/callback', index.callback)
router.get('/current', index.current)
router.get('/register', index.register)
router.get('/voteskip', index.voteskip)
router.post('/playlist', asyncHandler(index.addPlaylist))

module.exports = router
