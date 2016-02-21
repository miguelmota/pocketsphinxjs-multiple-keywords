'use strict';

// These will be initialized later
var recognizer, recorder, callbackManager, audioContext, outputContainer;
// Only when both recorder and recognizer do we have a ready application
var recorderReady = recognizerReady = false;
// A convenience function to post a message to the recognizer and associate
// a callback to its response
function postRecognizerJob(message, callback) {
  var msg = message || {};
  if (callbackManager) {
    msg.callbackId = callbackManager.add(callback);
  }
  if (recognizer) {
    recognizer.postMessage(msg);
  }
}
// This function initializes an instance of the recorder
// it posts a message right away and calls onReady when it
// is ready so that onmessage can be properly set
function spawnWorker(workerURL, onReady) {
  recognizer = new Worker(workerURL);
  recognizer.onmessage = function(event) {
    onReady(recognizer);
  };
  recognizer.postMessage('');
}
// To display the hypothesis sent by the recognizer
function updateHyp(hyp) {
  if (outputContainer) outputContainer.innerHTML = hyp;
}
// This updates the UI when the app might get ready
// Only when both recorder and recognizer are ready do we enable the buttons
function updateUI() {
  if (recorderReady && recognizerReady) startBtn.disabled = stopBtn.disabled = false;
}
// This is just a logging window where we display the status
function updateStatus(newStatus) {
  document.getElementById('currentStatus').innerHTML += "<br/>" + newStatus;
}
// A not-so-great recording indicator
function displayRecording(display) {
  if (display) document.getElementById('recordingIndicator').innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
  else document.getElementById('recordingIndicator').innerHTML = "";
}
// Callback function once the user authorises access to the microphone
// in it, we instanciate the recorder
function startUserMedia(stream) {
  var input = audioContext.createMediaStreamSource(stream);
  // Firefox hack https://support.mozilla.org/en-US/questions/984179
  window.firefox_audio_hack = input;
  var audioRecorderConfig = {errorCallback: function(x) {updateStatus("Error from recorder: " + x);}};
  recorder = new AudioRecorder(input, audioRecorderConfig);
  // If a recognizer is ready, we pass it to the recorder
  if (recognizer) recorder.consumers = [recognizer];
  recorderReady = true;
  updateUI();
  updateStatus("Audio recorder ready");
};
// This starts recording. We first need to get the id of the grammar to use
var startRecording = function() {
  if (recorder && recorder.start()) displayRecording(true);
};
// Stops recording
var stopRecording = function() {
  recorder && recorder.stop();
  displayRecording(false);
};
// Called once the recognizer is ready
// We then add the grammars to the input select tag and update the UI
var recognizerReady = function() {
  recognizerReady = true;
  updateUI();
  updateStatus("Recognizer ready");
};
// This initializes the recognizer. When it calls back, we add words
var initRecognizer = function() {

  recognizer.postMessage({
    command: 'load',
    callbackId: callbackManager.add(
      function() {
        // You can pass parameters to the recognizer,
        postRecognizerJob({
          command: 'initialize',
          data: [
            ['-kws', '/keyphrase.list'],
            ['-dict', 'keyphrase.dict']
          ]
        }, function() {
          startRecording();
        });

      }),
      data: [
        '/scripts/keyphrase-list.js'
      ]
  });



};
// When the page is loaded, we spawn a new recognizer worker and call getUserMedia to
// request access to the microphone
window.onload = function() {
  outputContainer = document.getElementById("output");
  updateStatus("Initializing web audio and speech recognizer, waiting for approval to access the microphone");
  callbackManager = new CallbackManager();
  spawnWorker("/scripts/recognizer.js", function(worker) {
    // This is the onmessage function, once the worker is fully loaded
    worker.onmessage = function(e) {
      console.log('event', e.data.hyp);
      // This is the case when we have a callback id to be called
      if (e.data.hasOwnProperty('id')) {
        var clb = callbackManager.get(e.data['id']);
        var data = {};
        if ( e.data.hasOwnProperty('data')) data = e.data.data;
        if(clb) clb(data);
      }
      // This is a case when the recognizer has a new hypothesis
      if (e.data.hasOwnProperty('hyp')) {
        var newHyp = e.data.hyp;
        if (e.data.hasOwnProperty('final') &&  e.data.final) {
          newHyp = "Final: " + newHyp;
        }
        updateHyp(newHyp);
      }
      // This is the case when we have an error
      if (e.data.hasOwnProperty('status') && (e.data.status == "error")) {
        updateStatus("Error in " + e.data.command + " with code " + e.data.code);
      }
    };
    // Once the worker is fully loaded, we can call the initialize function
    initRecognizer();
  });
  // The following is to initialize Web Audio
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    window.URL = window.URL || window.webkitURL;
    audioContext = new AudioContext();
  } catch (e) {
    updateStatus("Error initializing Web Audio browser");
  }
  if (navigator.getUserMedia) navigator.getUserMedia(

    {
      audio: {mandatory:
        {googEchoCancellation: false,
          googAutoGainControl: false,
          googNoiseSuppression: false,
          googHighpassFilter: false
      },
      optional: []
      }
    }, startUserMedia, function(e) {
      updateStatus("No live audio input in this browser");
    });
    else updateStatus("No web audio support in this browser");
    // Wiring JavaScript to the UI
    var startBtn = document.getElementById('startBtn');
    var stopBtn = document.getElementById('stopBtn');
    startBtn.disabled = true;
    stopBtn.disabled = true;
    startBtn.onclick = startRecording;
    stopBtn.onclick = stopRecording;
};
