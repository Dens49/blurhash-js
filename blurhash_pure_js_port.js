const blurhash = (function(context) {
    // in closure only

    const digitCharacters = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "#",
        "$",
        "%",
        "*",
        "+",
        ",",
        "-",
        ".",
        ":",
        ";",
        "=",
        "?",
        "@",
        "[",
        "]",
        "^",
        "_",
        "{",
        "|",
        "}",
        "~"
    ];

    const decode83 = str => {
        let value = 0;
        for (let i = 0; i < str.length; i++) {
            const c = str[i];
            const digit = digitCharacters.indexOf(c);
            value = value * 83 + digit;
        }
        return value;
    };

    const encode83 = (n, length) => {
        var result = "";
        for (let i = 1; i <= length; i++) {
            let digit = (Math.floor(n) / Math.pow(83, length - i)) % 83;
            result += digitCharacters[Math.floor(digit)];
        }
        return result;
    };

    const sRGBToLinear = value => {
        let v = value / 255;
        if (v <= 0.04045) {
            return v / 12.92;
        } else {
            return Math.pow((v + 0.055) / 1.055, 2.4);
        }
    };

    const linearTosRGB = value => {
        let v = Math.max(0, Math.min(1, value));
        if (v <= 0.0031308) {
            return Math.round(v * 12.92 * 255 + 0.5);
        } else {
            return Math.round(
                (1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5
            );
        }
    };

    const sign = n => (n < 0 ? -1 : 1);

    const signPow = (val, exp) => sign(val) * Math.pow(Math.abs(val), exp);

    const validateBlurhash = blurhash => {
        if (!blurhash || blurhash.length < 6) {
            throw new Error(
                "The blurhash string must be at least 6 characters"
            );
        }

        const sizeFlag = decode83(blurhash[0]);
        const numY = Math.floor(sizeFlag / 9) + 1;
        const numX = (sizeFlag % 9) + 1;

        if (blurhash.length !== 4 + 2 * numX * numY) {
            throw new Error(
                `blurhash length mismatch: length is ${
                    blurhash.length
                } but it should be ${4 + 2 * numX * numY}`
            );
        }
    };

    const isBlurhashValid = blurhash => {
        try {
            validateBlurhash(blurhash);
        } catch (error) {
            return { result: false, errorReason: error.message };
        }

        return { result: true };
    };

    const decodeDC = value => {
        const intR = value >> 16;
        const intG = (value >> 8) & 255;
        const intB = value & 255;
        return [sRGBToLinear(intR), sRGBToLinear(intG), sRGBToLinear(intB)];
    };

    const decodeAC = (value, maximumValue) => {
        const quantR = Math.floor(value / (19 * 19));
        const quantG = Math.floor(value / 19) % 19;
        const quantB = value % 19;

        const rgb = [
            signPow((quantR - 9) / 9, 2.0) * maximumValue,
            signPow((quantG - 9) / 9, 2.0) * maximumValue,
            signPow((quantB - 9) / 9, 2.0) * maximumValue
        ];

        return rgb;
    };

    const bytesPerPixel = 4;

    const multiplyBasisFunction = (pixels, width, height, basisFunction) => {
        let r = 0;
        let g = 0;
        let b = 0;
        const bytesPerRow = width * bytesPerPixel;

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const basis = basisFunction(x, y);
                r +=
                    basis *
                    sRGBToLinear(
                        pixels[bytesPerPixel * x + 0 + y * bytesPerRow]
                    );
                g +=
                    basis *
                    sRGBToLinear(
                        pixels[bytesPerPixel * x + 1 + y * bytesPerRow]
                    );
                b +=
                    basis *
                    sRGBToLinear(
                        pixels[bytesPerPixel * x + 2 + y * bytesPerRow]
                    );
            }
        }

        let scale = 1 / (width * height);

        return [r * scale, g * scale, b * scale];
    };

    const encodeDC = value => {
        const roundedR = linearTosRGB(value[0]);
        const roundedG = linearTosRGB(value[1]);
        const roundedB = linearTosRGB(value[2]);
        return (roundedR << 16) + (roundedG << 8) + roundedB;
    };

    const encodeAC = (value, maximumValue) => {
        let quantR = Math.floor(
            Math.max(
                0,
                Math.min(
                    18,
                    Math.floor(signPow(value[0] / maximumValue, 0.5) * 9 + 9.5)
                )
            )
        );
        let quantG = Math.floor(
            Math.max(
                0,
                Math.min(
                    18,
                    Math.floor(signPow(value[1] / maximumValue, 0.5) * 9 + 9.5)
                )
            )
        );
        let quantB = Math.floor(
            Math.max(
                0,
                Math.min(
                    18,
                    Math.floor(signPow(value[2] / maximumValue, 0.5) * 9 + 9.5)
                )
            )
        );

        return quantR * 19 * 19 + quantG * 19 + quantB;
    };

    // context

    /**
     * @param {String} blurhash
     * @param {Number} width
     * @param {Number} height
     * @param {Number} punch
     * @returns {Promise<Uint8ClampedArray>}
     */
    context.decodePromise = (blurhash, width, height, punch = 1.0) => {
        return new Promise((resolve, reject) => {
            resolve(context.decode(blurhash, width, height, punch));
        });
    };

    /**
     * @param {String} blurhash
     * @param {Number} width
     * @param {Number} height
     * @param {Number} punch
     * @returns {Uint8ClampedArray}
     */
    context.decode = (blurhash, width, height, punch = 1.0) => {
        validateBlurhash(blurhash);

        punch = punch | 1;

        const sizeFlag = decode83(blurhash[0]);
        const numY = Math.floor(sizeFlag / 9) + 1;
        const numX = (sizeFlag % 9) + 1;

        const quantisedMaximumValue = decode83(blurhash[1]);
        const maximumValue = (quantisedMaximumValue + 1) / 166;

        const colors = new Array(numX * numY);

        for (let i = 0; i < colors.length; i++) {
            if (i === 0) {
                const value = decode83(blurhash.substring(2, 6));
                colors[i] = decodeDC(value);
            } else {
                const value = decode83(
                    blurhash.substring(4 + i * 2, 6 + i * 2)
                );
                colors[i] = decodeAC(value, maximumValue * punch);
            }
        }

        const bytesPerRow = width * 4;
        const pixels = new Uint8ClampedArray(bytesPerRow * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0;
                let g = 0;
                let b = 0;

                for (let j = 0; j < numY; j++) {
                    for (let i = 0; i < numX; i++) {
                        const basis =
                            Math.cos((Math.PI * x * i) / width) *
                            Math.cos((Math.PI * y * j) / height);
                        let color = colors[i + j * numX];
                        r += color[0] * basis;
                        g += color[1] * basis;
                        b += color[2] * basis;
                    }
                }

                let intR = linearTosRGB(r);
                let intG = linearTosRGB(g);
                let intB = linearTosRGB(b);

                pixels[4 * x + 0 + y * bytesPerRow] = intR;
                pixels[4 * x + 1 + y * bytesPerRow] = intG;
                pixels[4 * x + 2 + y * bytesPerRow] = intB;
                pixels[4 * x + 3 + y * bytesPerRow] = 255; // alpha
            }
        }
        return pixels;
    };

    /**
     * @param {Uint8ClampedArray} pixels
     * @param {Number} width
     * @param {Number} height
     * @param {Number} componentX
     * @param {Number} componentY
     * @returns {Promise<String>}
     */
    context.encodePromise = (pixels, width, height, componentX, componentY) => {
        return new Promise((resolve, reject) => {
            resolve(
                context.encode(pixels, width, height, componentX, componentY)
            );
        });
    };

    /**
     * @param {Uint8ClampedArray} pixels
     * @param {Number} width
     * @param {Number} height
     * @param {Number} componentX
     * @param {Number} componentY
     * @returns {String}
     */
    context.encode = (pixels, width, height, componentX, componentY) => {
        if (
            componentX < 1 ||
            componentX > 9 ||
            componentY < 1 ||
            componentY > 9
        ) {
            throw new Error("BlurHash must have between 1 and 9 components");
        }
        if (width * height * 4 !== pixels.length) {
            throw new Error("Width and height must match the pixels array");
        }

        let factors = [];
        for (let y = 0; y < componentY; y++) {
            for (let x = 0; x < componentX; x++) {
                const normalisation = x == 0 && y == 0 ? 1 : 2;
                const factor = multiplyBasisFunction(
                    pixels,
                    width,
                    height,
                    (i, j) =>
                        normalisation *
                        Math.cos((Math.PI * x * i) / width) *
                        Math.cos((Math.PI * y * j) / height)
                );
                factors.push(factor);
            }
        }

        const dc = factors[0];
        const ac = factors.slice(1);

        let hash = "";

        let sizeFlag = componentX - 1 + (componentY - 1) * 9;
        hash += encode83(sizeFlag, 1);

        let maximumValue;
        if (ac.length > 0) {
            let actualMaximumValue = Math.max(
                ...ac.map(val => Math.max(...val))
            );
            let quantisedMaximumValue = Math.floor(
                Math.max(
                    0,
                    Math.min(82, Math.floor(actualMaximumValue * 166 - 0.5))
                )
            );
            maximumValue = (quantisedMaximumValue + 1) / 166;
            hash += encode83(quantisedMaximumValue, 1);
        } else {
            maximumValue = 1;
            hash += encode83(0, 1);
        }

        hash += encode83(encodeDC(dc), 4);

        ac.forEach(factor => {
            hash += encode83(encodeAC(factor, maximumValue), 2);
        });

        return hash;
    };

    // utils

    /**
     *
     * @param {Image} img
     * @returns {Uint8ClampedArray}
     */
    context.getImageData = img => {
        const width = img.width;
        const height = img.height;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.width = width;
        ctx.height = height;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, width, height).data;
    };

    /**
     * @param {Image} img
     * @param {Number} width
     * @param {Number} height
     * @returns {HTMLCanvasElement}
     */
    context.drawImageDataOnNewCanvas = (imgData, width, height) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.width = width;
        ctx.height = height;
        ctx.putImageData(new ImageData(imgData, width, height), 0, 0);
        return canvas;
    };

    /**
     * @param {Uint8ClampedArray} imgData
     * @param {Number} width
     * @param {Number} height
     * @returns {Promise<Image>}
     */
    context.getImageDataAsImageWithOnloadPromise = (imgData, width, height) => {
        return new Promise((resolve, reject) => {
            context.getImageDataAsImage(
                imgData,
                width,
                height,
                (event, img) => {
                    resolve(img);
                }
            );
        });
    };

    /**
     * @param {Uint8ClampedArray} imgData
     * @param {Number} width
     * @param {Number} height
     * @param {function} onload on image load
     */
    context.getImageDataAsImage = (imgData, width, height, onload) => {
        const canvas = context.drawImageDataOnNewCanvas(imgData, width, height);
        const dataURL = canvas.toDataURL();
        const img = new Image(width, height);
        img.onload = event => onload(event, img);
        img.width = width;
        img.height = height;
        img.src = dataURL;
        return img;
    };

    return context;
})({});
