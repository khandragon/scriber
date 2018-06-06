const express = require('express')
const router = express.Router()

router.get('/config', (req, res) => {
  res.json({
    timeslice: 1000,
    type: 'audio/ogg',
    gateway: 'ws://' + req.hostname + '/api/v1/voice'
  })
})

router.use('/', require('./v1/voice'))

module.exports = router
