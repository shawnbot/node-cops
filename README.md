# node-cops
Cops is an image manipulation suite for Node.js using a
[Cairo](http://cairographics.org/)-backed
[Canvas implementation](https://github.com/Automattic/node-canvas). The goal is
to make common image operations such as resizing, compositing, cropping, and creating
text overlays as simple and friendly as possible.

## Installation
Install cops with [npm](http://npmjs.org):

```sh
$ npm install cops
```

## Usage
The `cops` module exposes both classes and asynchronous
helpers for specific tasks:

### Resize an image
```js
var cops = require("cops");

var shrink = cops.resize("50%");
cops.read("foo.png", function(error, canvas) {
  shrink(canvas, function(error) {
    // write canvas to disk
  });
});
```

Cops operations are designed to work with
[async.waterfall](https://github.com/caolan/async#waterfall),
each producing a Canvas instance for the next operation:

```js
var cops = require("cops"),
    async = require("async");

async.waterfall([
  cops.read("big.png"),
  cops.resize("50%"),
  cops.write("small.png")
], function(error, canvas) {
  // we're done here
});
```
