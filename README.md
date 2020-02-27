# blurhash-js

This is basically just a port of the TypeScript blurhash implementation for pure JavaScript (ES6) with added helper functions to generate Image objects from decoded blurhashes that can be appended to the DOM directly.

TypeScript implementation: https://github.com/woltapp/blurhash/tree/master/TypeScript

More infos on blurhash: https://blurha.sh/

## Usage

See demo.html for sample usage of encode and decode.

### Embedding

You can use the minified version:

`<script src="blurhash_pure_js_port.min.js"></script>`

### Decode

```javascript
blurhash.decodePromise(hash, width, height, punch).then(imgObject => {
    document.body.appendChild(imgObject);
});
```

### Encode

```javascript
// imgData is a Uint8ClampedArray
blurhash
    .encodePromise(imgData, width, height, componentX, componentY)
    .then(hash => console.log(hash));
```

### Utils

```javascript
/**
 * @param {Image} img
 * @returns {Uint8ClampedArray}
 */
blurhash.getImageData(img);
```

```javascript
/**
 * @param {Image} img
 * @param {Number} width
 * @param {Number} height
 * @returns {HTMLCanvasElement}
 */
blurhash.drawImageDataOnNewCanvas(imgData, width, height);
```

```javascript
/**
 * @param {Uint8ClampedArray} imgData
 * @param {Number} width
 * @param {Number} height
 * @param {function} onload on image load
 */
blurhash.getImageDataAsImage(imgData, width, height, onload);
```

```javascript
/**
 * @param {Uint8ClampedArray} imgData
 * @param {Number} width
 * @param {Number} height
 * @returns {Promise<Image>}
 */
blurhash.getImageDataAsImageWithOnloadPromise(imgData, width, height);
```
