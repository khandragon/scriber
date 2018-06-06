// Older browsers might not implement mediaDevices at all, so we set an empty object first
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}

// Some browsers partially implement mediaDevices. We can't just assign an object
// with getUserMedia as it would overwrite existing properties.
// Here, we will just add the getUserMedia property if it's missing.
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function (constraints) {

    // First get ahold of the legacy getUserMedia, if present
    var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    // Some browsers just don't implement it - return a rejected promise with an error
    // to keep a consistent interface
    if (!getUserMedia) {
      return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
    }

    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
    return new Promise(function (resolve, reject) {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  }
}

// primitive code
var g = {};
let recorder
const timeslice = 1000

function startSTT() {
  navigator.mediaDevices.getUserMedia({
      audio: true
    })
    .then(stream => {
      recorder = new MediaRecorder(stream)
      let ws = new WebSocket('wss://voz.plazao.ca/api/v1/voice/en-US')
      let chunks = []

      let transcript = document.createElement("span")
      recResult.appendChild(transcript)

      recorder.addEventListener('dataavailable', e => {
        console.log(e.data)
        ws.send(e.data)
        chunks.push(e.data)
      })

      ws.addEventListener('message', e => {
        console.log('Message from server: ', e.data)

        const d = JSON.parse(e.data)

        if (d.error) {
          console.error('Error from server: ', e.data)
          return ws.close()
        }

        /*
        {
          "results": [
              {
                "alternatives": [
                    {
                      "transcript": "yeah "
                    }
                ],
                "final": false
              }
          ],
          "result_index": 0
        }
        */

        if (d.results) {
          transcript.innerText = d.results[0].alternatives[0].transcript

          const confidence = d.results[0].alternatives[0].confidence

          if (confidence) {
            transcript.style.backgroundColor = `hsl(${+confidence * 100}, 100%, 50%)`
          } else {
            transcript.style.backgroundColor = 'lightgray'
          }

          if (d.results[0].final) {
            transcript = document.createElement("span")
            recResult.appendChild(transcript)
          }
        }
      })



      recorder.addEventListener('stop', e => {
        console.log('Recording stopped, creating audio')

        let audio = document.createElement('audio')
        let blob = new Blob(chunks, {
          type: 'audio/ogg; codecs=opus'
        })
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
      } else if (e.name === 'NotFoundError') {
        alert('Did not find a microphone')
      } else {
        alert('Something went wrong!')
        console.error(e)
      }
    })
}


document.addEventListener('DOMContentLoaded', e => {
  // primitive code
  g.popup = document.getElementById('popup')
  const startRec = document.getElementById('start-rec')
  const stopRec = document.getElementById('stop-rec')
  const clearRec = document.getElementById('clear-rec')
  recResult = document.getElementById('rec-result')
  popup("Hello There :)")

  clearRec.addEventListener('click', function() {
    recResult.value = "";
  })

  startRec.addEventListener('change', e => {
    // primitive code
    popup("Recording Started !!")
    startSTT()
    startRec.disabled = true
    stopRec.disabled = false
  })

  stopRec.addEventListener('click', e => {
    // primitive code
    popup("Recording Stopped !!")
    recorder.stop()
    stopRec.disabled = true
    startRec.disabled = false
  })
})

// JS for popup BELOW

function popup(message) {
  g.popup.className = "show";
  g.popup.innerHTML += message
  setTimeout(function() {
    g.popup.className = g.popup.className.replace("show", "");
    g.popup.innerHTML = "";
  }, 3000);
}
