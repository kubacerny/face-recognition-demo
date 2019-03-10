const sharp = require('sharp');
const myAWSRecognition = require('./lib/aws-recognition');

var lastImageBytes = null;

module.exports = {
    /* To init connection AWS using anonymous Cognito access */
    init: function() {
        myAWSRecognition.AnonymousLogin();
    },
    /* Getter to get image bytes to be passed to AWS API */
    setImageBytesGetter: function(getBytesFunc) {
        myAWSRecognition.SetImageBytesGetter(getBytesFunc);
    },
    /* Will call callback(data), whera data are attributes about current user */
    getCurrentFace: function(callback) {
        var returnedCalls = 0;
        function checkIfReady() {
           returnedCalls++;
           if (returnedCalls >= 2) {
               callback && callback(myAWSRecognition.GetFacesFromStore());
           }
        }
        var imageBytes = myAWSRecognition.GetCanvasImageBytes();
        lastImageBytes = imageBytes;

        myAWSRecognition.DetectFaces(imageBytes, checkIfReady);
        myAWSRecognition.SearchFacesByImage(imageBytes, checkIfReady);
    },
    /* Add last image to indes with given persons first name  */
    indexCurrentFace: function(personFirstName, callback) {
        var firstFaceDetails = myAWSRecognition.GetMethodResponseFromStore('detectFaces').FaceDetails[0];
        var lastImage = sharp(Buffer.from(lastImageBytes));
        lastImage.metadata().then(info => {
            var imageWidth = info.width;
            var imageHeight = info.height;
            var boundingBox = firstFaceDetails.BoundingBox;
            var leftCorner = Math.trunc(boundingBox.Left * imageWidth);
            var topCorner = Math.trunc(boundingBox.Top * imageHeight);
            var faceWidth = Math.trunc(boundingBox.Width * imageWidth);
            var faceHeight = Math.trunc(boundingBox.Height * imageHeight);
            var croppedImageBytes = lastImage
                .extract({ left: leftCorner, top: topCorner, width: faceWidth, height: faceHeight })
                .toBuffer((err, data, info) => {
                    myAWSRecognition.IndexCurrentFaces(personFirstName, data, function(err, data) {
                        callback(data);
                    });
                });
        });
    }
};
