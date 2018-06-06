const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const app = express()
const expressWs = require('express-uws')(app)

app.use(bodyParser.json())

const staticOptions = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  index: 'index.html',
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}

app.use(express.static('public', staticOptions))

app.get('/recordings/:id', (req, res) => {
  console.log('Getting recording with id: ' + req.params.id)

  const file = path.join('public', 'recordings', req.params.id)

  fs.access(file, fs.constants.R_OK, (err) => {
    if (err) {
      return res.status(404).send('No recording found, want to record one?')
    }

    fs.readFile(file, 'utf-8', (err, data) => {
      if (err) {
        return res.status(500).send('Error reading file')
      }

      res.status(200).send(data)
    })
  })
})

app.put('/recordings/:id', (req, res) => {
  console.log('Putting recording with id: ' + req.params.id)

  if (!req.is('application/json')) {
    return res.status(403).send('Expected content type `application/json`')
  }

  const file = path.join('public', 'recordings', req.params.id)

  fs.access(file, fs.constants.W_OK, (err) => {
    if (!err) {
      return res.status(403).send('That recording already exists')
    }

    if (!req.body.text) {
      return res.status(400).send('`text` param missing')
    }

    fs.writeFile(file, req.body.text, (err) => {
      res.status(201).send('Uploaded!')
    })
  })
})

app.delete('/recordings/:id', (req, res) => {
  console.log('Deleting recording with id: ' + req.params.id)

  const file = path.join('public', 'recordings', req.params.id)

  fs.access(file, fs.constants.W_OK | fs.constants.R_OK, (err) => {
    if (err) {
      return res.status(404).send('That recording does not exist')
    }


    fs.unlink(file, (err) => {
      if (err) {
        return res.status(500).send('Error while trying to delete the file')
      }

      res.status(204).send('Deleted')
    })
  })
})

app.use('/api/', require('./src/api/api.js'))
app.use('/api/v1', require('./src/api/v1.js'))

app.listen(5005, () => console.log('Running!'))
