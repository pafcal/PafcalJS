function binaryImageMultiplication(firstImage, secondImage) {
    if (firstImage.n !== secondImage.n || firstImage.m !== secondImage.m) {
        throw new Error("Matrixes are not the same size!")
    }
    var result = new BinaryImage(firstImage.m, firstImage.n);
    for (var i = 0; i < firstImage.n; i++) {
        for (var j = 0; j < firstImage.m; j++) {
            result.data[i][j] = firstImage.data[i][j] * secondImage.data[i][j];
        }
    }
    return result;
}

function printBinaryImage(width, height, image, context) {
    var imageData = context.createImageData(width, height);

    image.data.forEach(function(arr, arrIndex) {
        arr.forEach(function(value, valueIndex) {
            if (value === 1) {
                var sum = arrIndex * width * 4 + valueIndex * 4;
                imageData.data[sum + 3] = 255;
                imageData.data[sum + 1] = 255;
            }
        });
    });
    context.putImageData(imageData, 0, 0);
}

function printSparseImage(width, height, image, context) {
    var imageData = context.createImageData(width, height),
        length = imageData.data.length;
    for (var i = 0; i < image.col.length; i++) {
        var point = image.getPointBasedOnIndex(i);
        imageData.data[point.y * 4 * width + point.x * 4 + 3] = 255;
        imageData.data[point.y * 4 * width + point.x * 4 + 1] = 255;
    }

    context.putImageData(imageData, 0, 0);
    console.log("print");
}

function _backgroundThreshold(threshold, backgroundPixel, imagePixel) {

    if (Math.abs(backgroundPixel.red - imagePixel.red) > threshold || Math.abs(backgroundPixel.blue - imagePixel.blue) > threshold || Math.abs(backgroundPixel.green - imagePixel.green) > threshold) {
        return true
    };
    return false;
};

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

    result += table.get(n - 1, m);
    result += table.get(n, m - 1);
    result -= table.get(n - 1, m - 1);
    result += (value) ? 1 : 0;

    return result;
}

function getAreaValue(point1, point2, table) {
    if (point1.x > point2.x || point1.y > point2.y) {
        throw new Error("The points are not in the right order!")
    };

    result = table.get(point2.y, point2.x) + table.get(point1.y - 1, point1.x - 1) - table.get(point1.y - 1, point2.x) - table.get(point2.y, point1.x - 1);
    return result;
}

function compare(image, handShape) {
    var detected = 0,
        total = image.m * image.n;
    if (image.n !== handShape.n || image.m !== handShape.m) {
        throw new Error("Shape and hand don't have the same size!");
    }
    for (var i = 0; i < image.n; i++) {
        for (var j = 0; j < image.m; j++) {
            if (image.data[i][j] === handShape.data[i][j]) detected++;
        }
    }
    if (detected / total > 0.75) {
        return true;
    }
    return false;
}

function getNeighbours(image, point, testFunction) {
    var neighbours = [];

    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            var neighbour = new Point(point.x + j, point.y + i);
            if (image.fits(neighbour) && testFunction(neighbour)) {
                neighbours.push(neighbour);
            }
        }
    }
    return neighbours;
}

function setUpTracker() {
    var tracker = document.createElement("div");
    tracker.id = "PAFCAL_TRACKER";
    tracker.style.display = "none";
    tracker.style.position = "fixed";
    tracker.style.borderRadius = "50%";
    tracker.style.width = TRACKER_SIZE + "px";
    tracker.style.height = TRACKER_SIZE + "px";
    tracker.style.background = TRACKER_COLOR;
    tracker.style.zIndex = "11";


    document.body.appendChild(tracker);
}

function reMap(v, min, max) {
    return (v - min) * 1 / (max - min);
}

function neighbour_8(point, secondPoint) {
    if (Math.abs(point.x - secondPoint.x) > 1) return false;
    if (Math.abs(point.y - secondPoint.y) > 1) return false;
    return true;
}

function pointDist(point, secondPoint) {
    var aa = (secondPoint.x - point.x),
        bb = (secondPoint.y - point.y);
    return Math.sqrt(aa * aa + bb * bb);
}
