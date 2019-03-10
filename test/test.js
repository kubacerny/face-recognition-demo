var atob = require('atob');
var assert = require('assert');
const sharp = require('sharp');
var faceDetection = require("../index.js");
const myAWSRecognition = require('../lib/aws-recognition');

describe('Array', function() {

    it('atob()', function() {
      var b64 = "SGVsbG8sIFdvcmxkIQ==";
      var bin = atob(b64);
      assert.equal(bin, "Hello, World!");
    });

    it('GetCanvasImageBytes()', function() {
      var bytes = myAWSRecognition.GetCanvasImageBytes();
      assert.equal(typeof bytes, "object");
    });

    it('Crop Image Bytes', function() {
      var bytes = myAWSRecognition.GetCanvasImageBytes();
      var croppedImageBytes = sharp(Buffer.from(bytes))
          .extract({ left: 5, top: 5, width: 5, height: 5 })
          .toBuffer();
      assert.equal(typeof croppedImageBytes, "object");
    });

    it('Detect Faces()', function() {
      faceDetection.init();
      var imageBytes = myAWSRecognition.GetCanvasImageBytes();
      myAWSRecognition.DetectFaces(imageBytes);
      assert.equal(1, 1);
    });

    it('getCurrentFace()', function(done) {
      this.timeout(10000);

      faceDetection.init();
      faceDetection.getCurrentFace(function(data){
        assert.equal(data.AgeRange.Low, 35);
        console.log("getCurrentFace() -> " + JSON.stringify(data, false, 4));
        done();
      });
    });

    it('indexCurrentFace()', function(done) {
      this.timeout(10000);

      faceDetection.init();
      faceDetection.getCurrentFace();
      faceDetection.indexCurrentFace('mel', function(data){
        assert.equal(data.FaceRecords[0].Face.ExternalImageId.replace(/_.*$/,''), 'mel');
        console.log("indexCurrentFace() -> " + JSON.stringify(data, false, 4));
        done();
      });
    });
});
