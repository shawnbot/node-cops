#!/usr/bin/env node

var cops = require("../index"),
    async = require("async"),
    program = require("commander")
      .version(require("../package.json").version)
      .description("Manipulate images with cops, the Canvas-based image manipulation suite");

program.command("resize <image> <size> [output]")
  .description([
    "resize an image, where <size> may be any of the following:",
    "1. (width + 'x' + height): a width and height in pixels or percentages separated by 'x', e.g. '200x100' or '50%x25%'",
    "2. (percentage + '%'): a proportional percentage, e.g. '50%' or '150%'",
    "3. (pixels [+ 'px']): a proportional pixel value, optionally with the 'px' qualifier"
  ].join("\n"))
  .option("-L, --letterbox [color]", "Preserve the aspect ratio of the original and letterbox with the provided color")
  .option("-p, --preserve-aspect-ratio [orient]", "Preserve the aspect ratio and orient the image to <orient>")
  .action(function(input, size, output, options) {
    size = parseSize(size);
    return pipeline(input, output, [
      cops.resize({
        width: size.width,
        height: size.height,
        letterbox: options.letterbox,
        preserveAspectRatio: options.preserveAspectRatio
      })
    ], function(error) {
      if (error) return console.error("Error:", error);
      console.log("done resizing!");
    });
  });

program.command("compose <image> [overlays] [output]")
  .description("compose one or more images on top of another")
  .option("-p, --position <position>", "Place the image at a named position (e.g. 'center', 'southeast') or x,y (e.g. '10,20', '50%,75%')")
  .option("-g, --gravity <gravity>", "Place the image relative to this named position, a la ImageMagick's gravity setting ('center', 'northwest', etc.)")
  .action(function(image, overlay, output, options) {
    var overlays = overlay.split(","),
        tasks = overlays.map(function(filename) {
          var position = options.position,
              gravity = options.gravity;
          if (filename.indexOf("@") > -1) {
            var i = filename.lastIndexOf("@");
            gravity = filename.substr(i + 1);
            filename = filename.substr(0, i);
            position = null;
          }
          return cops.compose({
            image:    filename,
            position: position,
            gravity:  gravity
          });
        });
    return pipeline(image, output, tasks, function(error) {
      if (error) return console.error("Error:", error);
      console.log("done composing!");
    });
  });

program.command("entitle <image> <text> [output]")
  .description("write some text on your image")
  .option("-f, --font <font>", "The font style, a la CSS: '100px Helvetica', etc.")
  .option("-c, --color <color>", "The text color, named (e.g. 'green') or hex ('#ffcc00')")
  .option("-a, --align <align>", "The text alignment: 'left', 'center' or 'right'")
  .option("-p, --position <position>", "Place the image at a named position (e.g. 'center', 'southeast') or x,y (e.g. '10,20', '50%,75%')")
  .action(function(image, text, output, options) {
    var opts = {
      text: text
    };
    if (options.font) opts.font = options.font;
    if (options.color) opts.fill = options.color;
    if (options.align) opts.align = options.align;
    if (options.position) opts.position = options.position;
    return pipeline(image, output, [
      cops.entitle(opts)
    ], function(error) {
      if (error) return console.error("Error:", error);
      console.log("done drawing text!");
    });
  });

program.parse(process.argv);

function pipeline(input, output, tasks, callback) {
  tasks.unshift(read(input));
  tasks.push(write(output));
  return async.waterfall(tasks, callback);
}

function read(image) {
  if (image === "-") {
    image = process.stdin;
  }
  return cops.read(image);
}

function write(output) {
  if (!output || output === "undefined") output = process.stdout;
  return cops.write(output);
}

function parseSize(size) {
  var len = size.length,
      x = size.indexOf("x");
  // x is in the middle
  if (x > -1 && x < len - 1) {
    return {
      width: size.substr(0, x),
      height: size.substr(x + 1)
    };
  } else if (x > -1) {
    throw new Error("Unable to parse size: '" + size + "'! Remember: you don't need 'px'.");
  }
  return {
    width: size,
    height: size
  };
}
