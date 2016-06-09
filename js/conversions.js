function _diffHelper(v, channel, diff) {
    return (v - channel) / 6 / diff + 1 / 2;
};

/*function rgbToHsv(rgbPixel) {
    var rr = undefined,
        gg = undefined,
        bb = undefined,
        h = undefined,
        s = undefined;

    var r = rgbPixel.red / 255,
        g = rgbPixel.green / 255,
        b = rgbPixel.blue / 255,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b);

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = _diffHelper(v, r, diff);
        gg = _diffHelper(v, g, diff);
        bb = _diffHelper(v, b, diff);

        if (r === v) {
            h = bb - gg;
        } else if (g === v) {
            h = (1 / 3) + rr - bb;
        } else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return new HSVPixel(Math.round(h * 360), Math.round(s * 100), Math.round(v * 100));
}*/

function rgbToHsv(pixel) {
    var r = pixel.red / 255,
        g = pixel.green / 255,
        b = pixel.blue / 255,
        max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        diff = max - min,
        h = undefined,
        s = undefined,
        v = undefined;
    //hue calculation
    v = max;
    s = (max == 0) ? 0 : (diff / max);
    if (diff === 0) {
        h = 0;
        return new HSVPixel(h, s, v);
    }
    if (max === r) {
        h = 60 * (((g - b) / diff) % 6);
        return new HSVPixel(h, s * 100, v * 100);
    }
    if (max === g) {
        h = 60 * ((b - r) / diff + 2);
        return new HSVPixel(h, s * 100, v * 100);
    }
    if (max === b) {
        h = 60 * ((r - g) / diff + 4);
        return new HSVPixel(h, s * 100, v * 100);
    }
}

function rgbTocyb(pixel) {
    var y = 16,
        // y = 0,
        cb = 128,
        cr = 128;

    y += CYB_CONVERSION_MATRIX[0][0] * pixel.red + CYB_CONVERSION_MATRIX[0][1] * pixel.green + CYB_CONVERSION_MATRIX[0][2] * pixel.blue;
    cb += CYB_CONVERSION_MATRIX[1][0] * pixel.red + CYB_CONVERSION_MATRIX[1][1] * pixel.green + CYB_CONVERSION_MATRIX[1][2] * pixel.blue;
    cr += CYB_CONVERSION_MATRIX[2][0] * pixel.red + CYB_CONVERSION_MATRIX[2][1] * pixel.green + CYB_CONVERSION_MATRIX[2][2] * pixel.blue;

    return new cybPixel(y, cb, cr);
}

function rgbToRb(pixel) {
    var sum = pixel.red + pixel.blue + pixel.green,
        r = pixel.red / sum,
        b = pixel.blue / sum;
    return new RBPixel(r, b);
}