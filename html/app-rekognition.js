var COLLECTION_ID = "matyldafaces";
var rekognition = null;
var store = {};

function UpdateStore() {
    var faceData = {};
    if (store.detectFaces && store.detectFaces.FaceDetails) {
      if (store.detectFaces.FaceDetails.length > 0) {
          var firstFaceDetails = store.detectFaces.FaceDetails[0];

          var oldElement = document.getElementById('firstFaceCanvas');
          if (oldElement) {oldElement.remove();}
          var canvas = document.getElementById('canvas');
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
    document.getElementById("result").innerHTML = "your face = " + JSON.stringify(faceData, false, 4);
}

function AnalyzeCanvasImage() {
  DetectFaces();
  SearchFacesByImage();
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
  function IndexCurrentFaces() {
    function getFirstName() {
        var formValue = document.getElementById('personFirstName').value;
        return formValue || 'anonymous';
    }
    var params = {
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: GetCanvasImageBytes(null, 'firstFaceCanvas')
      },
      DetectionAttributes: [
        'ALL'
      ],
      ExternalImageId: getFirstName() + "_" + Date.now(),
      MaxFaces: 1,
      QualityFilter: 'AUTO'
    };
    RekognitionAPICall('indexFaces', params);
  }

  function DetectFaces() {
    var params = {
      Image: {
        Bytes: GetCanvasImageBytes()
      },
      Attributes: [
        'ALL',
      ]
    };
    RekognitionAPICall('detectFaces', params);
  }

  function SearchFacesByImage() {
    var params = {
       CollectionId: COLLECTION_ID,
       FaceMatchThreshold: 85,
       Image: {
         Bytes: GetCanvasImageBytes()
       },
       MaxFaces: 5
    };
    RekognitionAPICall('searchFacesByImage', params);
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

  function RekognitionAPICall(method, params) {
     console.log("Rekognition call: " + method + ": " + JSON.stringify(params));
     rekognition[method](params, function(err, data) {
         if (err) {
           store[method] = data;
           console.log(err, err.stack);
           document.getElementById("apiCallResult").innerHTML = "API Call Response = " + JSON.stringify(err, false, 4);
           UpdateStore();
         } else {
           store[method] = data;
           console.log(data);
           document.getElementById("apiCallResult").innerHTML = "API Call Response = " + JSON.stringify(data, false, 4);
           UpdateStore();
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
