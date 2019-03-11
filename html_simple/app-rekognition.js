var COLLECTION_ID = "matyldafaces";
var rekognition = null;
var store = {
  // responses from API Methods
  faceData: {},
  unknownFaceImageBytes: null,
  detecting: false
};

function UpdateStore() {
    var faceData = {};
    if (store.detectFaces && store.detectFaces.FaceDetails) {
      if (store.detectFaces.FaceDetails.length > 0) {
          var firstFaceDetails = store.detectFaces.FaceDetails[0];
          var boundingBox = firstFaceDetails.BoundingBox;
          store.firstFaceCanvas = getFaceCanvas(store.detectFacesCanvas, boundingBox);

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

function AnalyzeCanvasImage(currentCanvas) {
    if (!store.detecting) {
        store.detecting = true;
        DetectFaces(currentCanvas, function() {
            if (store.detectFaces.FaceDetails.length > 0) {
                var firstFaceDetails = store.detectFaces.FaceDetails[0];
                var boundingBox = firstFaceDetails.BoundingBox;
                SearchFacesByImage(getFaceCanvas(currentCanvas, boundingBox), function() {
                    render(store.faceData);
                    store.detecting = false;
                });
            } else {
                render({});
                store.detecting = false;
            }
        });
    }
}

/***********************************************************************/
/* Rekognition API Methods */

  function IndexCurrentFaces(imageBytes, personFirstName) {
    var params = {
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBytes
      },
      DetectionAttributes: [
        'ALL'
      ],
      ExternalImageId: personFirstName + "_" + Date.now(),
      MaxFaces: 1,
      QualityFilter: 'AUTO'
    };
    if (getFirstName()) {
        RekognitionAPICall('indexFaces', params);
    }
  }

  function DetectFaces(canvas, callback) {
    store.detectFacesCanvas = canvas;
    var params = {
      Image: {
        Bytes: GetCanvasImageBytes(canvas)
      },
      Attributes: [
        'ALL',
      ]
    };
    RekognitionAPICall('detectFaces', params, callback);
  }

  function SearchFacesByImage(canvas, callback) {
    var params = {
       CollectionId: COLLECTION_ID,
       FaceMatchThreshold: 85,
       Image: {
         Bytes: GetCanvasImageBytes(canvas)
       },
       MaxFaces: 5
    };
    RekognitionAPICall('searchFacesByImage', params, callback);
  }

  function RekognitionAPICall(method, params, callback) {
     console.log("Rekognition call: " + method + ": " + JSON.stringify(params));
     rekognition[method](params, function(err, data) {
         if (err) {
           store[method] = data;
           console.log(err, err.stack);
           document.getElementById("apiCallResult").innerHTML = "API Call Response = " + JSON.stringify(err, false, 4);
         } else {
           store[method] = data;
           console.log(data);
           document.getElementById("apiCallResult").innerHTML = "API Call Response = " + JSON.stringify(data, false, 4);
         }
         UpdateStore();
         callback && callback();
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
