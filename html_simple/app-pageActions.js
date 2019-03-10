window.addEventListener("DOMContentLoaded", function() {
  var video = document.getElementById('video');
  var mediaConfig =  { video: true };
  var errBack = function(e) {
    console.log('An error has occurred!', e)
  };

  // Put video listeners into place
  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(mediaConfig).then(function(stream) {
      video.srcObject = stream;
      video.play();
    });
  }

  AnonymousLogin();

  setInterval(Refresh, 1000);

  /* modal */
  var modal = document.getElementById('myModal');
  var btn = document.getElementById("myBtn");
  var span = document.getElementsByClassName("close")[0];
  span.onclick = function() {
    modal.style.display = "none";
    store.modalOpen = false;
  }
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
      store.modalOpen = false;
    }
  }
}, false);

function Refresh() {
  if (!store.modalOpen) {
      AnalyzeCanvasImage();
  }
}

function ShowModal() {
    var modal = document.getElementById('myModal');
    modal.style.display = 'block';
    store.modalOpen = true;
}
function SubmitModal() {
    var modal = document.getElementById('myModal');
    modal.style.display = 'none';
    store.modalOpen = false;

    var formValue = document.getElementById('personFirstName').value;
    if (formValue) {
        IndexCurrentFaces(unknownFaceImageBytes)
    }
}

function getCanvasFromVideo() {
  var video = document.getElementById('video');
  var canvas = document.createElement("canvas");
  canvas.width = video.width;
  canvas.height = video.height;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function GetCanvasImageBytes(dataURL, elementID) {
    elementID = elementID || 'video';
    if (!dataURL) {
      dataURL = getCanvasFromVideo().toDataURL('image/jpeg', 1.0);
    }
    var image = null;
    var jpg = true;
    try {
      image = atob(dataURL.split("data:image/jpeg;base64,")[1]);

    } catch (e) {
      jpg = false;
    }
    if (jpg == false) {
      try {
        image = atob(dataURL.split("data:image/png;base64,")[1]);
      } catch (e) {
        alert("Not an image file Rekognition can process");
        return;
      }
    }

    //unencode image bytes for Rekognition DetectFaces API
    var length = image.length;
    imageBytes = new ArrayBuffer(length);
    var ua = new Uint8Array(imageBytes);
    for (var i = 0; i < length; i++) {
      ua[i] = image.charCodeAt(i);
    }
    return imageBytes;
}
