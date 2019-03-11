window.addEventListener("DOMContentLoaded", function() {
  // Put video listeners into place
  var video = document.getElementById('video');
  var mediaConfig =  { video: true };
  if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(mediaConfig).then(function(stream) {
      video.srcObject = stream;
      video.play();
    });
  }

  AnonymousLogin();
  InitModal();
  setInterval(Refresh, 1000);
}, false);

function Refresh() {
  if (!store.modalOpen) {
      AnalyzeCanvasImage(getCanvasFromVideo());
  }
}

function InitModal() {
    var modal = document.getElementById('myModal');
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

    var firstNameValue = document.getElementById('personFirstName').value;
    if (firstNameValue) {
        IndexCurrentFaces(store.unknownFaceImageBytes, firstNameValue)
    }
}

function render(faceData) {
    var content = "";
    if (faceData) {
        if (!faceData.AgeRange) {
            content += 'Where are some people? Please come and look in the camera.';
        } else {
            if (faceData.SimilarPeople && faceData.SimilarPeople.length > 0) {
                var name = faceData.SimilarPeople[0].Value;
                content += "Hello <span class=\"name\">" + name + "!</span> How are you? <br>";
            } else {
                content += "Hello, I do not know you yet. What is your name? <br>";
            }
            if (faceData.AgeRange) {
              content += "You are between " + faceData.AgeRange.Low + " - " + faceData.AgeRange.High + " years old. <br>";
            }

            if (faceData.Gender) {
                if (faceData.Gender.Confidence > 80) {
                    content += "You are <span class=\"name\">" +
                        (faceData.Gender.Value == 'Male' ? 'men' : 'women')  +
                        ".</span>";
                } else {
                    content += "I think you are <span class=\"name\">" +
                        (faceData.Gender.Value == 'Male' ? 'men' : 'women')  +
                        ".</span> But I am not sure.";
                }
            }

            if (faceData.Emotions) {
                content += "<br><br>";
                var emotions = faceData.Emotions.map((item) => (item.Type));
                if (emotions.length <= 0) {
                    content += "Show me some emotions! (sad, smile, surprise, calm,...)";
                } else {
                    content += "You are " + emotions.join(", ") + ".";
                }
            }
        }
    }
    // content += "<pre>" + JSON.stringify(faceData, false, 4) + "</pre>";
    document.getElementById("result").innerHTML = content;
    replaceFaceCanvas(store.firstFaceCanvas, !!faceData.AgeRange);

    if (faceData && store.detectFaces.FaceDetails.length > 0 && !(faceData.SimilarPeople && faceData.SimilarPeople.length > 0)) {
        // seeing someone unknown
        renderModalAskForName();
    }
}

function renderModalAskForName() {
    faceCanvas = store.firstFaceCanvas;
    store.unknownFaceImageBytes = GetCanvasImageBytes(faceCanvas);
    faceCanvasClone = faceCanvas.cloneNode();
    faceCanvasClone.id = "tmpFaceCanvas";
    faceCanvasClone.getContext('2d').drawImage(faceCanvas, 0, 0, faceCanvas.width, faceCanvas.height);
    popupCanvasContainer = document.getElementById('popupCanvasContainer');
    popupCanvasContainer.innerHTML = "";
    popupCanvasContainer.appendChild(faceCanvasClone);
    ShowModal();
}

function replaceFaceCanvas(newFaceCanvas, haveFaceData) {
  var oldElement = document.getElementById('firstFaceCanvas');
  if (oldElement) {oldElement.remove();}
  if (haveFaceData) {
    var resultElem = document.getElementById('result');
    resultElem.parentNode.insertBefore(newFaceCanvas, resultElem);
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
function getFaceCanvas(originalCanvas, boundingBox) {
  var context = originalCanvas.getContext('2d');
  var firstFaceCanvas = document.createElement('canvas');
  var imageWidth = originalCanvas.width;
  var imageHeight = originalCanvas.height;
  var leftCorner = boundingBox.Left * imageWidth;
  var topCorner = boundingBox.Top * imageHeight;
  var faceWidth = boundingBox.Width * imageWidth;
  var faceHeight = boundingBox.Height * imageHeight;
  firstFaceCanvas.id = 'firstFaceCanvas';
  firstFaceCanvas.width = faceWidth;
  firstFaceCanvas.height = faceHeight;
  var firstFaceContext = firstFaceCanvas.getContext('2d');
  firstFaceContext.drawImage(originalCanvas, leftCorner, topCorner, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);

  // draw bounding box in originalCanvas
  /*
  context.lineWidth = 2;
  context.strokeStyle = 'green';
  context.rect(leftCorner, topCorner, faceWidth, faceHeight);
  context.stroke();
  */
  return firstFaceCanvas;
}

function GetCanvasImageBytes(canvas, dataURL) {
    if (!dataURL) {
      if (canvas) {
        dataURL = canvas.toDataURL('image/jpeg', 1.0);
      } else {
        dataURL = getCanvasFromVideo().toDataURL('image/jpeg', 1.0);
      }
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
