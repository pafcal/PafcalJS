function binaryImageMultiplication(firstImage, secondImage) {
    if (firstImage.n !== secondImage.n || firstImage.m !== secondImage.m) {
        throw new Error("Matrixes are not the same size!")
    }
    var result = new BinaryImage(firstImage.n, firstImage.m);
    for (var i = 0; i < firstImage.n; i++) {
        for (var j = 0; j < firstImage.m; j++) {
            result.data[i][j] = firstImage.data[i][j] * secondImage.data[i][j];
        }
    }
    return result;
}

function printBinaryImage(image, width, height, context) {
    var imageData = context.getImageData(0, 0, width, height),
        length = imageData.data.length;
    for (var i = 0; i < length; i += 4) {
        var rowIndex = Math.floor(i / 4 / width);
        imageData.data[i + 3] = 255;
        imageData.data[i + 1] = image.data[rowIndex][((i / 4) - rowIndex * width) % width] ? 255 : 0;
        imageData.data[i + 0] = image.data[rowIndex][((i / 4) - rowIndex * width) % width] ? 0 : 255;
    }
    context.putImageData(imageData, 0, 0);
}


function backgroundThreshold(threshold, backgroundPixel, imagePixel) {
    //return true if the selected pixel is FOREGROUND
    if (Math.abs(backgroundPixel.red - imagePixel.red) < threshold) return false;
    if (Math.abs(backgroundPixel.blue - imagePixel.blue) < threshold) return false;
    if (Math.abs(backgroundPixel.green - imagePixel.green) < threshold) return false;
    return true;
}

function isValueInRange(value, range) {
    for (var i = 0; i < range.length; i++) {
        if (value >= range[i].MIN && value <= range[i].MAX) {
            return true;
        }
    }
    return false;
}

function cybThreshold(cybPixel) {
    if (isValueInRange(cybPixel.cb, CYB_THRESHOLD.CB) && isValueInRange(cybPixel.cr, CYB_THRESHOLD.CR)) {
        return true;
    }
    return false;
}

function rbLikelihood(rbPixel) {
    var mean = 0.5 * (rbPixel.r + rbPixel.b),
        cov = (rbPixel.r - mean) * (rbPixel.r - mean) + (rbPixel.b - mean) * (rbPixel.b - mean),
        likelihood = undefined;
    if (cov === 0) {
        cov = 0.0001;
    }
    var rTemp = ((rbPixel.r - mean) / 2) / cov,
        bTemp = ((rbPixel.b - mean) / 2) / cov;

    likelihood = Math.pow(Math.E, rTemp * (rbPixel.r - mean) + bTemp * (rbPixel.b - mean));
    return likelihood;
}

function rgbMax(pixel) {
    return Math.max(pixel.red, pixel.green, pixel.blue);
}

function rgbMin(pixel) {
    return Math.min(pixel.red, pixel.green, pixel.blue);
}

function computeBinaryLookupValue(n, m, value, table) {
    var result = 0;

    result += table.get(n - 1, m) || 0;
    result += table.get(n, m - 1) || 0;
    result -= table.get(n - 1, m - 1) || 0;
    result += (value === true) ? 1 : 0;
    if (result < table.get(n - 1, m) || result < table.get(n, m - 1) || result < table.get(n - 1, m - 1)) {
        var wtf = 2;
        wtf++;
    }
    return result;
}

function getAreaValue(point1, point2, table) {
    if (point1.x > point2.x || point1.y > point2.y) {
        throw new Error("The points are not in the right order!")
    };

    result = table.data[point2.y][point2.x] + table.data[point1.y][point1.x] - table.data[point1.y][point2.x] - table.data[point2.y][point1.x];
    return result;
}

function printRectangle(width, height, point, secondPoint, context) {
    if (point.x > secondPoint.x || point.y > secondPoint.y) {
        throw new Error("The points are not in the right order!")
    };

    var imageData = context.getImageData(0, 0, width, height),
        rowStart = point.y,
        rowEnd = secondPoint.y,
        colStart = point.x,
        colEnd = secondPoint.x;

    for (var i = rowStart; i <= rowEnd; i++) {
        for (var j = colStart; j <= colEnd; j++) {
            imageData.data[i * width * 4 + j * 4 + 0] = 0;
            imageData.data[i * width * 4 + j * 4 + 1] = 0;
            imageData.data[i * width * 4 + j * 4 + 2] = 255;
            imageData.data[i * width * 4 + j * 4 + 3] = 255;
        }
    }
    context.putImageData(imageData, 0, 0);
}
