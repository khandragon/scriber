// Older browsers might not implement mediaDevices at all, so we set an empty object first
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices. We can't just assign an object
// with getUserMedia as it would overwrite existing properties.
// Here, we will just add the getUserMedia property if it's missing.
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function(constraints) {

    // First get ahold of the legacy getUserMedia, if present
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // Some browsers just don't implement it - return a rejected promise with an error
    // to keep a consistent interface
    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  }
}

let recorder
const timeslice = 1000

function startSTT() {
  navigator.mediaDevices.getUserMedia({audio: true})
  .then(stream => {
    recorder = new MediaRecorder(stream)
    let ws = new WebSocket('ws://localhost:5005/api/v1/voice/en-US')
    let chunks = []

    recorder.addEventListener('dataavailable', e => {
      console.log(e.data)
      ws.send(e.data)
      chunks.push(e.data)
    })

    ws.addEventListener('message', e => {
      console.log('Message from server: ', e.data)
      if (e.data.error) {
        console.error('Error from server: ', e.data)
        return ws.close()
      }
    })

    recorder.addEventListener('stop', e => {
      console.log('Recording stopped, creating audio')

      let audio = document.createElement('audio')
      let blob = new Blob(chunks, { type : 'audio/ogg; codecs=opus' })
      // Normal Closure
      ws.close(1000)
      audio.src = URL.createObjectURL(blob)
      audio.controls = true

      document.body.appendChild(audio)
    })

    if (ws.readyState === ws.OPEN) {
      recorder.start(timeslice)
    }

    ws.addEventListener('open', e => {
      console.log('WebSocket open, starting recording')
      recorder.start(timeslice)
    })

  }).catch(e => {
    if (e.name === 'PermissionDeniedError') {
      alert('Did not get permission to record :(')
    } else if (e.name === 'NotFoundError'){
      alert('Did not find a microphone')
    } else {
      alert('Something went wrong!')
      console.error(e)
    }
  })
}
