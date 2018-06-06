const express = require('express')
const router = express.Router()
const WebSocket = require('ws')

const auth = require('./auth.json')
const username = auth.username
const pass = auth.password

const Authorization = 'Basic ' + Buffer.from(`${username}:${pass}`).toString('base64')

const contentType = 'audio/ogg'

const languages = {
  'en-US': 'en-US_BroadbandModel',
  'fr-FR': 'fr-FR_BroadbandModel'
}

const uri = 'wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?model='

const openMessage = JSON.stringify({
  action: 'start',
  'content-type': contentType,
  'interim_results': true,
  'max-alternatives': 3,
})

let id = 0
router.ws('/voice/:lang', (ws, req) => {
  const wsId = id++
  const language = languages[req.params.lang || 'en-US']

  console.log('Connection received: ' + wsId)

  if (!language) {
    ws.send('{"error": "invalid language"}')
    return ws.close()
  }

  const watson = new WebSocket(uri + language, { headers: { Authorization } })

  watson.on('open', () => {
    console.log('WebSocket opened')
    watson.send(openMessage)
  })

  watson.on('message', data => {
    console.log('WebSocket message: ', data)
    ws.send(data)
  })

  watson.on('close', (code, msg) => {
    console.log('WebSocket closed: ', code, msg)
    watson.send('{"action": "stop"')
  })

  watson.on('error', err => {
    console.error('WebSocket error: ', err)
  })

  ws.on('message', msg => {
    console.log(wsId, msg)
    ws.send('{"log": "Received voice"}')
    watson.send(msg)
  })
})

module.exports = router
