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

  // Trigger photo take
  document.getElementById('snap').addEventListener('click', function() {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, 320, 240);
    AnalyzeCanvasImage();
  });

  // Trigger file upload
  document.getElementById("fileToUpload").addEventListener("change", function (event) {
    LoadImageToCanvas();
    AnalyzeCanvasImage();
  }, false);

  AnonymousLogin();
}, false);

function LoadImageToCanvas() {
  var control = document.getElementById("fileToUpload");
  var file = control.files[0];

  // Load base64 encoded image
  var reader = new FileReader();
  reader.onload = (function (theFile) {
    return function (e) {
      //var img = document.createElement('img');
      var img = new Image();
      var image = null;
      img.src = e.target.result;

      // draw image to canvas
      img.onload = () => {
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, 320, 240);
        AnalyzeCanvasImage();
      }
    };
  })(file);
  reader.readAsDataURL(file);
}


function GetCanvasImageBytes(dataURL, elementID) {
    elementID = elementID || 'canvas';
    if (!dataURL) {
      var canvas = document.getElementById(elementID);
      dataURL = canvas.toDataURL('image/jpeg', 1.0);
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
