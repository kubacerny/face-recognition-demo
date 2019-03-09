// Load the SDK and UUID
var AWS = require('aws-sdk');
var uuid = require('uuid');
var atob = require('atob');

const DEFAULT_DATA_URL = require('./defaultDataURL').defaultDataURL;
const COLLECTION_ID = "matyldafaces";
var rekognition = null;
var store = {};

var innerGetCanvasImageBytes = function() {
  var dataURL = DEFAULT_DATA_URL;

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
      console.log("Not an image file Rekognition can process");
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

function UpdateStore() {
    var faceData = {};
    if (store.detectFaces && store.detectFaces.FaceDetails) {
      if (store.detectFaces.FaceDetails.length > 0) {
          var firstFaceDetails = store.detectFaces.FaceDetails[0];
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
    store.faceData = faceData;
}


function RekognitionAPICall(method, params, callback) {
   // console.log("Rekognition call: " + method + ": " + JSON.stringify(params));
   rekognition[method](params, function(err, data) {
       if (err) {
         store[method] = data;
         // console.log(err, err.stack);
         UpdateStore();
       } else {
         store[method] = data;
         // console.log(data);
         UpdateStore();
       }
       callback && callback(err,data);
   });
}

//Provides anonymous log on to AWS services
module.exports = {
  AnonymousLogin: function() {
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
  },
  SetImageBytesGetter: function (getterFunc) {
    innerGetCanvasImageBytes = getterFunc;
  },
  GetCanvasImageBytes: function() {
    return innerGetCanvasImageBytes();
  },
  GetFacesFromStore: function() {
    return store.faceData;
  },

  DetectFaces: function(imageBytes, callback) {
    var params = {
      Image: {
        Bytes: imageBytes
      },
      Attributes: [
        'ALL',
      ]
    };
    RekognitionAPICall('detectFaces', params, callback);
  },

  SearchFacesByImage: function(imageBytes, callback) {
    var params = {
       CollectionId: COLLECTION_ID,
       FaceMatchThreshold: 85,
       Image: {
         Bytes: imageBytes
       },
       MaxFaces: 5
    };
    RekognitionAPICall('searchFacesByImage', params, callback);
  },

  IndexCurrentFaces: function(firstName, imageBytes, callback) {
    var params = {
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBytes
      },
      DetectionAttributes: [
        'ALL'
      ],
      ExternalImageId: firstName + "_" + Date.now(),
      MaxFaces: 1,
      QualityFilter: 'AUTO'
    };
    RekognitionAPICall('indexFaces', params, callback);
  }
}
