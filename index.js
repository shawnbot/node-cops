var fs = require("fs"),
    util = require("./lib/util"),
    events = require("events"),
    stream = require("stream"),
    Canvas = require("canvas"),
    Image = Canvas.Image;

var cops = {
  Canvas: Canvas,
  Image: Image,
  version: require("./package.json").version
};

module.exports = cops;

var Operation = function(options) {
  this.options = util.extend({}, this.defaults, options);
};


Operation.prototype.call = function(image, callback) {
  var draw = this.draw.bind(this);
  // console.log("Operation.call(", image, ")");
  return cops.coerceCanvas(image, function(error, canvas) {
    if (error) return callback(error);
    draw(canvas, callback);
  });
};

Operation.prototype.apply = function(that, args) {
  var draw = this.draw;
  // console.log("Operation.apply(", image, ")");
  return cops.coerceCanvas(image, function(error, canvas) {
    if (error) return callback(error);
    draw.apply(that, args);
  });
};

Operation.extend = function(proto) {
  var construct = proto.initialize || Operation,
      op = function(options) {
        if (!(this instanceof op)) {
          return new op(options);
        }
        construct.call(this, options);
      };
  util.extend(op.prototype, Operation.prototype, proto);
  return op;
};

/*
 * resize an image:
 *
 * Resize({width: 100, height: 200})
 * Resize({width: "50%", height: "50%"})
 * Resize("50%")
 */
cops.Resize = Operation.extend({
  defaults: {
    letterbox: true
  },

  initialize: function(options) {
    if (typeof options !== "object") {
      options = {width: options, height: options};
    }
    Operation.call(this, options);
  },

  getSize: function(image) {
    return {
      width: cops.parseUnits(this.options.width, image.width),
      height: cops.parseUnits(this.options.height, image.height)
    };
  },

  draw: function(canvas, callback) {
    var image = new Image();
    image.src = cops.coerceBuffer(canvas);
    var size = this.getSize(canvas);
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext("2d")
      .drawImage(image, 0, 0, canvas.width, canvas.height);
    return callback(null, canvas);
  }
});

/*
 * Add text to an image:
 *
 * Entitle({text: "Hello, world!"})
 * Entitle({text: "Hi!", position: "center", font: "100px Helvetica"})
 * Entitle({text: "Over here!!", textAlign: "right", position: "right"})
 */
cops.Entitle = Operation.extend({
  defaults: {
    font: "50px Helvetica",
    fillStyle: "#999",
    textAlign: "center",
    position: "center",
    text: ""
  },

  draw: function(canvas, callback) {
    if (!this.options.text) return callback(null, canvas);
    var context = canvas.getContext("2d");
    context.font = this.options.font;
    context.textAlign = this.options.textAlign;
    context.fillStyle = this.options.fillStyle;
    var position = cops.resolvePosition(this.options.position, canvas.width, canvas.height);
    context.fillText(this.options.text, position.x, position.y);
    context.fill();
    return callback(null, canvas);
  }
});

cops.Compose = Operation.extend({
  defaults: {
    mode: null,
    alpha: 1
  },

  initialize: function(options) {
    Operation.call(this, options);
    if (!this.options.image) {
      throw new Error("compose() requires the 'image' option (a Buffer)");
    }
    this.image = new Image();
    this.image.src = cops.coerceBuffer(this.options.image);
  },

  draw: function(canvas, callback) {
    var context = canvas.getContext("2d"),
        overlay = this.image,
        position = {
          x: (canvas.width - overlay.width) / 2,
          y: (canvas.height - overlay.height) / 2
        };
    if (this.options.position) {
      position = cops.resolvePosition(this.options.position, canvas.width, canvas.height);
    } else if (this.options.gravity) {
      position = cops.resolveGravity(this.options.gravity, overlay, canvas.width, canvas.height);
    }
    context.drawImage(overlay, position.x, position.y);
    return callback(null, canvas);
  }
});

cops.coerceCanvas = function(image, callback) {
  var canvas;
  if (image instanceof Canvas) {

    canvas = image;

  } else if (Buffer.isBuffer(image)) {

    // TODO: stream this shit
    var img = new Image();
    img.src = image;
    return cops.coerceCanvas(img, callback);

  } else if (image instanceof Image) {

    canvas = new Canvas(image.width, image.height);
    canvas.getContext("2d")
        .drawImage(image, 0, 0, image.width, image.height);

  } else if (typeof image === "string") {

    if (callback) {
      return cops.coerceBuffer(image, function(error, buffer) {
        if (error) return callback(error);
        cops.coerceCanvas(buffer, callback);
      });
    } else {
      var buffer = cops.coerceBuffer(image);
      return cops.coerceCanvas(buffer);
    }

  } else if (image instanceof stream.Stream) {
    if (callback) {
      var buffer = [];
      return image.on("data", function(chunk) {
        buffer.push(chunk);
      })
      .on("end", function() {
        cops.coerceCanvas(Buffer.concat(buffer), callback);
      });
    } else {
      // coerce the Buffer to a canvas
      // XXX this is suboptimal, obviously
      return cops.coerceCanvas(image.read());
    }
  } else {
    return callback && callback("Unable to coerce: " + (typeof image));
  }
  // console.log("image -> canvas", image, canvas);
  return callback ? callback(null, canvas) : canvas;
};

cops.coerceBuffer = function(image, callback) {
  if (Buffer.isBuffer(image)) {
    return image;
  } else if (image instanceof Canvas) {
    return image.toBuffer(callback);
  } else if (image instanceof Image) {
    var canvas = new Canvas(image.width, image.height),
        context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, image.width, image.height);
    return canvas.toBuffer(callback);
  }
  return (typeof callback === "function")
    ? fs.readFile(image, callback)
    : fs.readFileSync(image);
};

cops.parseUnits = function(value, relativeTo) {
  switch (typeof value) {
    case "number":
      return value;
    case "string":
      if (String(+value) === value) {
        return +value;
      }
      var match = value.match(/^(.+)(px|%)$/);
      if (!match) throw new Error("Invalid units: " + value);
      var num = +match[1],
          units = match[2];
      if (isNaN(num)) throw new Error("Bad number: " + match[1]);
      switch (units) {
        case "px":
          return num;
        case "%":
          return num / 100 * relativeTo;
      }
    default:
      throw new Error("Unexpected position type: " + (typeof value));
  }
};

cops.Operation = Operation;

cops.resize = operation(cops.Resize);
cops.compose = operation(cops.Compose);
cops.entitle = operation(cops.Entitle);

/*
 * Pipeline input through a series of operations, write to output and call a
 * callback when finished.
 *
 * cops.pipeline("big.png", [
 *   cops.resize("50%")
 * ], "small.png", function(error, canvas) {
 * });
 */
cops.pipeline = function(input, output, operations, callback) {
  // allow pipeline(input, operations, output, callback)
  if (Array.isArray(operations)) {
    var tmp = operations;
    operations = output;
    output = tmp;
  }
  var tasks = operations.slice();
  tasks.unshift(cops.read(input));
  tasks.push(cops.write(output));
  return async.waterfall(tasks, callback);
};

/*
 * Read a filename, buffer, Image (or pass through a Canvas instance)
 * asynchronously. With one argument it returns a function with the signature
 * read(callback), and always reads the same input:
 *
 * cops.read("foo.png");
 * cops.read(buffer);
 * cops.read(image);
 *
 * If you provide a callback, it will be read asynchronously right away:
 *
 * cops.read("foo.png", function(error, canvas) {
 * });
 */
cops.read = function(input, callback) {
  var read = function(callback) {
    cops.coerceCanvas(input, callback);
  };
  return callback ? read(callback) : read;
};

/*
 * Write a Canvas to a filename or stream. With just one or two arguments it
 * will return a composable write function with the signature
 * write(canvas, callback):
 *
 * // the default encoder is PNG
 * cops.write("out.png");
 * // JPEG is inferred by filename
 * cops.write("out.jpg", {quality: 80});
 * // or you can specify type in the options
 * cops.write(stream, {type: "jpeg"});
 *
 * If you pass a canvas and callback as the last two arguments it'll just run:
 *
 * cops.write("out.png", canvas, callback); // just write it now
 * cops.write(stream, {quality: 90}, canvas, callback); // just write it now
 */
cops.write = function(filenameOrStream, optionsOrCanvas, callback) {
  if (!filenameOrStream) {
    throw new Error("cops.write() expects a filename or writeable stream");
  }

  var options = {},
      canvas;
  if (optionsOrCanvas instanceof Canvas) {
    canvas = optionsOrCanvas;
    if (!callback) throw new Error("cops.write() got a canvas but no callback");
  } else if (arguments.length > 2) {
    canvas = arguments[2];
    callback = arguments[3];
    if (!callback) {
      throw new Error("cops.write() got a canvas but no callback");
    }
  } else {
    options = optionsOrCanvas;
  }

  if (typeof filenameOrStream === "string") {
    var implicitType = filenameOrStream.split(".").pop();
    if (options && !options.type) options.type = implicitType;
    else if (!options) options = {type: implicitType};
  }

  var write = function(canvas, callback) {
    var out = (typeof filenameOrStream === "string")
      ? fs.createWriteStream(filenameOrStream)
      : filenameOrStream;
    if (typeof out.write !== "function") {
      throw new Error("cops.write() got a non-stream: " + out);
    }
    return cops.createWriteStream(canvas, options)
      .on("data", function(chunk) {
        out.write(chunk);
      })
      .on("end", callback);
  };
  return (canvas && callback)
    ? write(canvas, callback)
    : write;
};

cops.createWriteStream = function(canvas, options) {
  if (options) {
    switch (options.type.toLowerCase()) {
      case "jpg":
      case "jpeg":
        return canvas.jpegStream(options);
      case "png":
        break;
      default:
        throw new Error("Unrecognized image type: " + options.type);
    }
  }
  return canvas.pngStream(options);
};

cops.resolvePosition = function(position, width, height, size) {
  if (typeof position === "string") {

    return cops.resolveGravity(position, {width: 0, height: 0}, width, height);

  } else if (typeof position === "object") {

    var pos = {x: 0, y: 0};

    if (position.hasOwnProperty("x")) {
      pos.x = cops.parseUnits(position.x, width);
    } else if (position.hasOwnProperty("left")) {
      pos.x = cops.parseUnits(position.left, width);
    } else if (position.hasOwnProperty("right")) {
      pos.x = width - cops.parseUnits(position.right, width);
    }

    if (position.hasOwnProperty("y")) {
      pos.y = cops.parseUnits(position.y, height);
    } else if (position.hasOwnProperty("top")) {
      pos.y = cops.parseUnits(position.top, height);
    } else if (position.hasOwnProperty("bottom")) {
      pos.y = height - cops.parseUnits(position.bottom, height);
    }

    return pos;

  } else {
    throw new Error("Invalid position: " + position);
  }
};

cops.resolveGravity = function(gravity, size, width, height) {
  switch (String(gravity).toLowerCase()) {
    case "west":
    case "left":
      return {x: 0, y: (height - size.height) / 2};

    case "north":
    case "top":
      return {x: (width - size.width) / 2, y: 0};

    case "east":
    case "right":
      return {x: width - size.width, y: (height - size.height) / 2};

    case "south":
    case "bottom":
      return {x: (width - size.width) / 2, y: height - size.height};

    case "center":
    case "middle":
      return {x: (width - size.width) / 2, y: (height - size.height) / 2};

    case "northwest":
    case "topleft":
    case "top-left":
      return {x: 0, y: 0};

    case "northeast":
    case "topright":
    case "top-right":
      return {x: width - size.width, y: 0};

    case "southeast":
    case "bottom-right":
      return {x: width - size.width, y: height - size.height};

    case "southwest":
    case "bottomleft":
    case "bottom-left":
      return {x: 0, y: height - size.height};
  }
  throw new Error("Unrecognized gravity: '" + gravity + "'");
};

cops.hasSignature = function(args, signature) {
  for (var i = 0, len = signature.length; i < len; i++) {
    if (args.length < i) return false;
    var arg = args[i],
        sig = signature[i];
    // check with class methods that know better than instanceof
    switch (sig) {
      case Array: if (!Array.isArray(arg)) return false;
      case Buffer: if (!Buffer.isBuffer(arg)) return false;
    }
    switch (typeof sig) {
      // if the signature is a string, compare with typeof
      case "string":
        if (typeof arg !== sig) return false;
        break;
      // if the signature is a function, compare with instanceof
      case "function":
        if (!(arg instanceof sig)) return false;
        break;
    }
  }
  return true;
};

function operation(klass) {
  return function(options, canvas, callback) {
    var instance = new klass(options),
        op = instance.call.bind(instance);
    return (canvas && callback)
      ? op(canvas, callback)
      : op;
  };
}
