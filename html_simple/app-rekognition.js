var COLLECTION_ID = "matyldafaces";
var rekognition = null;
var store = {};

var unknownFaceImageBytes = null;

function UpdateStore() {
    var faceData = {};
    if (store.detectFaces && store.detectFaces.FaceDetails) {
      if (store.detectFaces.FaceDetails.length > 0) {
          var firstFaceDetails = store.detectFaces.FaceDetails[0];

          var oldElement = document.getElementById('firstFaceCanvas');
          if (oldElement) {oldElement.remove();}
          var canvas = getCanvasFromVideo();
          var context = canvas.getContext('2d');
          var firstFaceCanvas = document.createElement('canvas');
          var firstFaceContext = firstFaceCanvas.getContext('2d');
          var imageWidth = canvas.width;
          var imageHeight = canvas.height;
          var boundingBox = firstFaceDetails.BoundingBox;
          var leftCorner = boundingBox.Left * imageWidth;
          var topCorner = boundingBox.Top * imageHeight;
          var faceWidth = boundingBox.Width * imageWidth;
          var faceHeight = boundingBox.Height * imageHeight;
          firstFaceCanvas.id = 'firstFaceCanvas';
          firstFaceCanvas.width = faceWidth;
          firstFaceCanvas.height = faceHeight;
          var resultElem = document.getElementById('result');
          resultElem.parentNode.insertBefore(firstFaceCanvas, resultElem);
          firstFaceContext.drawImage(canvas, leftCorner, topCorner, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);
          context.lineWidth = 2; /* px */
          context.strokeStyle = 'green';
          context.rect(leftCorner, topCorner, faceWidth, faceHeight);
          context.stroke();

          var infoDataFaceDetails = {
            AgeRange: firstFaceDetails.AgeRange,
            Gender: firstFaceDetails.Gender,
            Smile: firstFaceDetails.Smile,
            Emotions: firstFaceDetails.Emotions.filter((item) => (item.Confidence > 45))
          };
          faceData = Object.assign(faceData, infoDataFaceDetails);
      }
    }
    if (store.searchFacesByImage) {
          var faceMatches = store.searchFacesByImage.FaceMatches;
          var mostSimilarPeople = {};
          faceMatches.forEach((item) => {
            mostSimilarPeople[item.Face.ExternalImageId.replace(/_.*$/, '')] = item.Similarity;}
          );
          var similarPeopleList = [];
          for (var name in mostSimilarPeople) {
              similarPeopleList.push({
                Value: name,
                Similarity: mostSimilarPeople[name]
              });
          }

          var infoDataSimilarities = {
            SimilarPeople: similarPeopleList
          };
          faceData = Object.assign(faceData, infoDataSimilarities);
    }
    // text info
    store.faceData = faceData;
    // render(faceData);
}

function render(faceData) {
    var content = "";
    if (faceData) {
        if (!faceData.AgeRange) {
            content += 'Where are some people? Please come and look at the camera.';
        } else {
            if (faceData.SimilarPeople && faceData.SimilarPeople.length > 0) {
                var name = faceData.SimilarPeople[0].Value;
                content += "Hello <span class=\"name\">" + name + "!</span> How are you? <br>";
            } else {
                content += "Hello, I do not know you yet. What is your name? <br>";
                // Remember uknow face and trigger modal
                faceCanvas = document.getElementById('firstFaceCanvas');
                unknownFaceImageBytes = GetCanvasImageBytes(faceCanvas.toDataURL());
                faceCanvasClone = faceCanvas.cloneNode();
                faceCanvasClone.id = "tmpFaceCanvas";
                faceCanvasClone.getContext('2d').drawImage(faceCanvas, 0, 0, faceCanvas.width, faceCanvas.height);
                popupCanvasContainer = document.getElementById('popupCanvasContainer');
                popupCanvasContainer.innerHTML = "";
                popupCanvasContainer.appendChild(faceCanvasClone);
                ShowModal();
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
}

function AnalyzeCanvasImage() {
  var returnedCalls = 0;
  function checkIfReady() {
     returnedCalls++;
     if (returnedCalls >= 2) {
         render(store.faceData);
     }
  }
  DetectFaces(checkIfReady);
  SearchFacesByImage(checkIfReady);
}

/***********************************************************************/
/* Rekognition API Methods */

  function CreateCollection() {
    var params = {
      CollectionId: COLLECTION_ID
    };
    RekognitionAPICall('createCollection', params);
  }
  function DescribeCollection() {
    var params = {
      CollectionId: COLLECTION_ID
    };
    RekognitionAPICall('describeCollection', params);
  }
  function IndexCurrentFaces(imageBytes) {
    function getFirstName() {
        var formValue = document.getElementById('personFirstName').value;
        return formValue;
    }
    if (!imageBytes) {
        imageBytes = GetCanvasImageBytes(null, 'firstFaceCanvas');
    }
    var params = {
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBytes
      },
      DetectionAttributes: [
        'ALL'
      ],
      ExternalImageId: getFirstName() + "_" + Date.now(),
      MaxFaces: 1,
      QualityFilter: 'AUTO'
    };
    if (getFirstName()) {
        RekognitionAPICall('indexFaces', params);
    }
  }

  function DetectFaces(callback) {
    var params = {
      Image: {
        Bytes: GetCanvasImageBytes()
      },
      Attributes: [
        'ALL',
      ]
    };
    RekognitionAPICall('detectFaces', params, callback);
  }

  function SearchFacesByImage(callback) {
    var params = {
       CollectionId: COLLECTION_ID,
       FaceMatchThreshold: 85,
       Image: {
         Bytes: GetCanvasImageBytes()
       },
       MaxFaces: 5
    };
    RekognitionAPICall('searchFacesByImage', params, callback);
  }

  function DeleteFace() {
    var params = {
      CollectionId: COLLECTION_ID,
      FaceIds: [
        document.getElementById('faceID').value
      ]
     };
     RekognitionAPICall('deleteFaces', params);
  }

  function ListFaces() {
    var params = {
      CollectionId: COLLECTION_ID,
      MaxResults: 100
    };
    RekognitionAPICall('listFaces', params);
  }

  function RekognitionAPICall(method, params, callback) {
     console.log("Rekognition call: " + method + ": " + JSON.stringify(params));
     rekognition[method](params, function(err, data) {
         if (err) {
           store[method] = data;
           console.log(err, err.stack);
           document.getElementById("apiCallResult").innerHTML = "API Call Response = " + JSON.stringify(err, false, 4);
           UpdateStore();
           callback && callback();
         } else {
           store[method] = data;
           console.log(data);
           document.getElementById("apiCallResult").innerHTML = "API Call Response = " + JSON.stringify(data, false, 4);
           UpdateStore();
           callback && callback();
         }
     });
  }

  //Provides anonymous log on to AWS services
  function AnonymousLogin() {
    AWS.config.region = 'eu-west-1';
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'eu-west-1:22362520-b8b7-4f4e-beff-ebe70915a2e2',
    });
    // Make the call to obtain credentials
    AWS.config.credentials.get(function () {
      // Credentials will be available when this function is called.
      var accessKeyId = AWS.config.credentials.accessKeyId;
      var secretAccessKey = AWS.config.credentials.secretAccessKey;
      var sessionToken = AWS.config.credentials.sessionToken;
    });
    rekognition = new AWS.Rekognition();
  }
