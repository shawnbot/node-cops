# node-cops

> ![](https://raw.githubusercontent.com/shawnbot/node-cops/master/assets/node-cops.jpg)
>
> Original photo by [Quinn Dombrowski](https://www.flickr.com/photos/quinnanya/6668359047/)

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
var cops = require("cops"),
    shrink = cops.resize("50%");

cops.read("big.png", function(error, canvas) {
  shrink(canvas, function(error, canvas) {
    cops.write("small.png", canvas, function(error) {
      // we're done here
    });
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
  cops.resize({width: 200, height: 200}),
  cops.write("small.png")
], function(error, canvas) {
  // mic drop
});
```

## Command Line Utility
The `cops` CLI gives you some nice, node-y tools:

```sh
# resize images
$ cops resize big.jpg 50% small.jpg
$ cat big.jpg | cops resize - 50% > small.jpg

# compose images
$ cops compose --gravity southeast photo.jpg watermark.png
```

Run `cops --help` for more information.

