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
    /* Add last image to indes with given persons first name
       FIXME should crop image only to bounding box. 
    */
    indexCurrentFace: function(personFirstName, callback) {
        myAWSRecognition.IndexCurrentFaces(personFirstName, lastImageBytes, function(err, data) {
            callback(data);
        });
    }
};
