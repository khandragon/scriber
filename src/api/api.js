const express = require('express')
const router = express.Router()

router.get('/info', (req, res) => {
  res.json({
    latest: 'v1',
    supported: ['v1']
  })
})

module.exports = router
