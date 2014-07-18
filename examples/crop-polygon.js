var cops = require("../index");

var cropToPolygon = cops.draw(function(canvas) {
  var polygon = [
    [10, 10],
    [80, 20],
    [75, 70],
    [15, 70]
  ];

  var context = canvas.getContext("2d");
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = "#000";
  context.beginPath();
  // initialize the top left and bottom right corners as the first point
  var tl = polygon[0].slice(),
      br = polygon[0].slice();
  for (var i = 0, len = polygon.length; i < len; i++) {
    var p = polygon[i];
    if (i === 0) {
      // move to the first point
      context.moveTo(p[0], p[1]);
    } else {
      // line to the rest
      context.lineTo(p[0], p[1]);
      // establish bounding box
      if (p[0] < tl[0]) tl[0] = p[0];
      if (p[0] > br[0]) br[0] = p[0];
      if (p[1] < tl[1]) tl[1] = p[1];
      if (p[1] > br[1]) br[1] = p[1];
    }
  }
  // close the path
  context.closePath();
  context.fill();

  // grab the pixels
  var x = tl[0],
      y = tl[1],
      width = br[0] - tl[0],
      height = br[1] - tl[1],
      pixels = context.getImageData(x, y, width, height);
  console.log("cropping to bounding box: (" + tl + "), (" + br + ")");

  canvas.width = width;
  canvas.height = height;
  context.putImageData(pixels, 0, 0);
});

cops.pipeline("test.png", [cropToPolygon], "cropped-polygon.png", function(error, canvas) {
  if (error) throw error;
  console.log("all done!");
});
