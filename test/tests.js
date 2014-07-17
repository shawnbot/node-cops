var cops = require("../index"),
    Canvas = cops.Canvas,
    Image = cops.Image,
    async = require("async"),
    assert = require("assert");

var testFilename = "test/big.png",
    testSize = {width: 500, height: 300};

describe("cops.read()", function() {

  it("returns an async function with a single argument", function(done) {
    var read = cops.read(testFilename);
    assert.equal(read.length, 1);
    read(function(error, canvas) {
      if (error) throw error;
      assert.deepEqual(sizeOf(canvas), testSize, "size mismatch");
      done();
    });
  });

  it("reads a file asynchronously when you provide a callback", function(done) {
    cops.read(testFilename, function(error, canvas) {
      if (error) throw error;
      assert.deepEqual(sizeOf(canvas), testSize, "size mismatch");
      done();
    });
  });

});

describe("cops.write()", function() {

  it("returns an async function with a single argument", function(done) {
    var write = cops.write("out.png");
    assert.equal(write.length, 2);
    write(new Canvas(1, 1), function(error, canvas) {
      if (error) throw error;
      cops.read("out.png", function(error, canvas) {
        if (error) throw error;
        assert.deepEqual(sizeOf(canvas), {width: 1, height: 1}, "size mismatch");
        done();
      });
    });
  });

  it("writes a file asynchronously when you provide a callback", function(done) {
    cops.write("out.png", new Canvas(1, 1), function(error, canvas) {
      if (error) throw error;
      assert.deepEqual(sizeOf(canvas), {width: 1, height: 1}, "size mismatch");
      done();
    });
  });
});

describe("cops.pipeline()", function() {
  // TODO
});

describe("cops.resize()", function() {

  it("resizes by a percentage (nested)", function(done) {
    var shrink = cops.resize("50%"),
        desiredSize = {
          width: testSize.width / 2,
          height: testSize.height / 2
        };
    cops.read(testFilename, function(error, canvas) {
      if (error) throw error;
      shrink(canvas, function(error, canvas) {
        if (error) throw error;
        assert.deepEqual(sizeOf(canvas), desiredSize);
        done();
      });
    });
  });

  it("resizes by a percentage (waterfall)", function(done) {
    var desiredSize = {
          width: testSize.width / 2,
          height: testSize.height / 2
        };
    async.waterfall([
      cops.read(testFilename),
      cops.resize("50%")
    ], function(error, canvas) {
      if (error) throw error;
      assert.deepEqual(sizeOf(canvas), desiredSize);
      done();
    });
  });

  it("resizes to a fixed size", function(done) {
    var desiredSize = {
      width: 200,
      height: 200
    };
    async.waterfall([
      cops.read(testFilename),
      cops.resize(desiredSize)
    ], function(error, canvas) {
      if (error) throw error;
      assert.deepEqual(sizeOf(canvas), desiredSize);
      done();
    });
  });

  it("resizes to a fixed size with letterboxing", function() {
    // TODO
  });

  it("resizes to a fixed size with preserveAspectRatio", function() {
    // TODO
  });

});

describe("cops.compose()", function() {
  // TODO
});

describe("cops.entitle()", function() {
  // TODO
});

function sizeOf(thing) {
  return {
    width: thing.width,
    height: thing.height
  };
}
