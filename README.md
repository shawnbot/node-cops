# node-cops
Cops is an image manipulation suite for Node.js using a
[Cairo](http://cairographics.org/)-backed
[Canvas implementation](https://github.com/Automattic/node-canvas). The goal is
to make image operations such as resizing, composing, cropping, and creating
text overlays as friendly and simple as possible.

## Installation
Install cops with [npm](http://npmjs.org):

```sh
$ npm install cops
```

## Usage
The npm module exposes both classes and asynchronous helpers for specific tasks:

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

Cops operations are made to work with [async.waterfall](https://github.com/caolan/async#waterfall):

```js
var cops = require("cops"),
    async = require("async");

async.waterfall([
  cops.read("big.png"),
  cops.resize("50%"),
  cops.write("small.png")
], function(error, canvas) {
});
```
