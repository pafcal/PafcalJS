self.importScripts('./pafcal.jsfeat.js');
self.importScripts('./pafcal.structures.js');

var pafcal = {};
pafcal.constants = {
    WIDTH: 640,
    HEIGHT: 480,
    BACKGROUND_THRESHOLD: 15,
    BACKGROUND_FRAMES: 15,
    SIZE_THRESHOLD: 200,
    ADAPTIVE_SIZE: {
        WIDTH: 150,
        HEIGHT: 100
    },
    HSV_THRESHOLD: {
        HUE: [{
            MIN: 0,
            MAX: 25
        }, {
            MIN: 230,
            MAX: 360
        }],
        SATURATION: [{
            MIN: 0,
            MAX: 100
        }],
        VALUE: [{
            MIN: 0,
            MAX: 100
        }]
    },

    BACKGROUND_SUBSTRACTION_SETTING: true,
    BACKGROUND_SUBSTRACTION_DECISION: null,
    COMPLETE_INFO: true,
    BACKGROUND_DATA: [],

    JS_FEAT: {
        OPTONS: {
            min_scale: 2,
            scale_factor: 1.15,
            use_canny: false,
            edges_density: 0.13,
            equalize_histogram: true
        },
        CLASSIFIER: jsfeat.haar.frontalface,
        MAX_WORK_SIZE: 160
    },
};
pafcal._frameInfo = {
    FRAME_NUMBER: 0
};

var _diffPixels = 0,
    _center = null,
    _state = 'MISS';

pafcal.configure = function(object) {
    for (var property in object) {
        if (object.hasOwnProperty(property) && pafcal.constants.hasOwnProperty(property)) {
            pafcal.constants[property] = object[property];
        }
    }
};

pafcal.showFrameInfo = function() {
    console.log(pafcal._frameInfo);
    pafcal._frameInfo = { FRAME_NUMBER: pafcal._frameInfo.FRAME_NUMBER + 1 };

}

pafcal.modelBackground = function(imageData, count) {
    var backgroundData = pafcal.constants.BACKGROUND_DATA;
    if (pafcal.constants.BACKGROUND_SUBSTRACTION_DECISION == false) return;

    for (var i = 0; i < imageData.data.length; i++) {
        if (backgroundData[i] === undefined) {
            backgroundData[i] = 0;
        }

        pafcal.constants.BACKGROUND_DATA[i] += imageData.data[i];
        var avg = backgroundData[i] / count;
        if (Math.abs(avg - imageData.data[i]) > pafcal.constants.BACKGROUND_THRESHOLD * 2) _diffPixels++;
    }

    if (_diffPixels >= pafcal.constants.WIDTH * pafcal.constants.HEIGHT * 3 * (pafcal.constants.BACKGROUND_FRAMES / 6)) {
        pafcal.constants.BACKGROUND_SUBSTRACTION_DECISION = false;
    }
};

pafcal.createBackgroundReference = function(image, count) {
    var temp = new Uint8ClampedArray(pafcal.constants.WIDTH * pafcal.constants.HEIGHT * 4);
    pafcal.modelBackground(image, count);
    for (var i = 0; i < pafcal.constants.BACKGROUND_DATA.length; i++) {
        temp[i] = pafcal.constants.BACKGROUND_DATA[i] / pafcal.constants.BACKGROUND_FRAMES;
    }
    pafcal.constants.BACKGROUND_DATA = temp;
    if (pafcal.constants.BACKGROUND_SUBSTRACTION_DECISION === null) {
        pafcal.constants.BACKGROUND_SUBSTRACTION_DECISION = true;
    } else {
        console.log("BACKGROUND_EXTRACTION: DROPPED");
    }

    postMessage({ type: 'IMAGE', data: null });
}
pafcal.step = function(image, haarData) {
    var faceResult = null,
        filterResult = null,
        morphoResult = null,
        deleteResult = null,
        scale = Math.min(pafcal.constants.JS_FEAT.MAX_WORK_SIZE / pafcal.constants.WIDTH, pafcal.constants.JS_FEAT.MAX_WORK_SIZE / pafcal.constants.HEIGHT),
        haarWidth = (pafcal.constants.WIDTH * scale) | 0,
        haarHeight = (pafcal.constants.HEIGHT * scale) | 0,
        width = pafcal.constants.WIDTH,
        height = pafcal.constants.HEIGHT,
        optimizedData = null,
        topLeft = new Point(0, 0);
    if (self._center) {
        var botRight = new Point(Math.min(self._center.x + (pafcal.constants.ADAPTIVE_SIZE.WIDTH * 1.5), pafcal.constants.WIDTH), Math.min(self._center.y + (pafcal.constants.ADAPTIVE_SIZE.HEIGHT * 1.5), pafcal.constants.HEIGHT));
        topLeft = new Point(Math.max(self._center.x - (pafcal.constants.ADAPTIVE_SIZE.WIDTH * 1.5), 0), Math.max(self._center.y - (pafcal.constants.ADAPTIVE_SIZE.HEIGHT * 1.5), 0));

        topLeft.x = Math.floor(topLeft.x);
        topLeft.y = Math.floor(topLeft.y);
        botRight.x = Math.floor(botRight.x);
        botRight.y = Math.floor(botRight.y);

        width = botRight.x - topLeft.x + 1;
        height = botRight.y - topLeft.y + 1;
        if (width === 0 || height === 0) {
            self._center = null;
            pafcal.step(image, haarData);
        }
        optimizedData = new ImageData(width, height);
        for (var i = topLeft.y; i <= botRight.y; i++) {
            for (var j = topLeft.x; j <= botRight.x; j++) {
                optimizedData.data[((i - topLeft.y) * width + (j - topLeft.x)) * 4] = image.data[(i * pafcal.constants.WIDTH + j) * 4];
                optimizedData.data[((i - topLeft.y) * width + (j - topLeft.x)) * 4 + 1] = image.data[(i * pafcal.constants.WIDTH + j) * 4 + 1];
                optimizedData.data[((i - topLeft.y) * width + (j - topLeft.x)) * 4 + 2] = image.data[(i * pafcal.constants.WIDTH + j) * 4 + 2];
                optimizedData.data[((i - topLeft.y) * width + (j - topLeft.x)) * 4 + 3] = image.data[(i * pafcal.constants.WIDTH + j) * 4 + 3];
            }
        }
    } else {
        optimizedData = image;
    }

    faceResult = pafcal.faceDetection(haarWidth, haarHeight, haarData, pafcal.constants.JS_FEAT.CLASSIFIER, pafcal.constants.JS_FEAT.OPTONS);
    filterResult = pafcal.filter(width, height, topLeft, optimizedData, faceResult);
    // morphoResult = pafcal.morpho(width, height, filterResult.sparse, filterResult.table);
    deleteResult = pafcal.delete(filterResult.sparse, pafcal.constants.SIZE_THRESHOLD);
    pafcal._frameInfo.SURFACE_OPTIMIZATION_SUCCESS = true;
    if (deleteResult.size === 0) {
        if (self._center) {
            self._center = null;
            pafcal._frameInfo.SURFACE_OPTIMIZATION_SUCCESS = false;
            pafcal.step(image, haarData)
        } else {
            self._state = 'MISS';
            pafcal._frameInfo.DETECTION_STATUS = "NONE";
            postMessage({ type: 'MISS', data: null });
        }
    } else {
        var convexHull = pafcal.convexHull(deleteResult);
        var center = pafcal.centroid(convexHull);
        self._center = pafcal.centroid(convexHull);
        pafcal.decide(center, convexHull, topLeft);
        postMessage({ type: 'BINARY_DATA', data: { offset: topLeft, image: { size: deleteResult.size, rowCount: deleteResult.rowCount, row: deleteResult.row, col: deleteResult.col }, center: self._center } });
    }
    postMessage({ type: 'IMAGE', data: null });

};

pafcal.faceDetection = function(w, h, image, classifier, options) {
    var ii_sum = new Int32Array((w + 1) * (h + 1)),
        ii_sqsum = new Int32Array((w + 1) * (h + 1)),
        ii_tilted = new Int32Array((w + 1) * (h + 1)),
        ii_canny = new Int32Array((w + 1) * (h + 1)),
        rects = null;


    img_u8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
    jsfeat.imgproc.grayscale(image.data, w, h, img_u8);

    if (options.equalize_histogram) {
        jsfeat.imgproc.equalize_histogram(img_u8, img_u8);
    }

    jsfeat.imgproc.compute_integral_image(img_u8, ii_sum, ii_sqsum, classifier.tilted ? ii_tilted : null);
    jsfeat.haar.edges_density = options.edges_density;
    rects = jsfeat.haar.detect_multi_scale(ii_sum, ii_sqsum, ii_tilted, options.use_canny ? ii_canny : null, img_u8.cols, img_u8.rows, classifier, options.scale_factor, options.min_scale);
    rects = jsfeat.haar.group_rectangles(rects, 1);

    return _getBestRect(rects, pafcal.constants.WIDTH / img_u8.cols);
};


pafcal.filter = function(width, height, offset, image, faceRect) {
    var sparseImage = new SparseBinaryImage(height),
        binaryLookupTable = new BinaryLookupTable(width, height),
        background = pafcal.constants.BACKGROUND_DATA,
        length = image.data.length;

    for (var i = 0; i < length; i += 4) {
        var backgroundPixel = new RGBPixel(background[i], background[i + 1], background[i + 2]),
            imagePixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]),
            rowIndex = Math.floor((i / 4) / width),
            colIndex = Math.floor((i / 4) % width);
        logic = _rgbSkinDetection(imagePixel) && _hsvSkinDetection(rgbToHsv(imagePixel), pafcal.constants.HSV_THRESHOLD);
        if (faceRect) {
            faceRect.y -= height / 2;
            faceRect.height *= 2;
            logic = logic && !faceRect.contains(new Point(colIndex + offset.x, rowIndex + offset.y));
        }
        logic = logic && ((pafcal.constants.BACKGROUND_SUBSTRACTION_DECISION) ? _backgroundThreshold(pafcal.constants.BACKGROUND_THRESHOLD, backgroundPixel, imagePixel) : true);

        if (logic) {
            sparseImage.add(rowIndex, colIndex);
        }
        binaryLookupTable.data[rowIndex].push(_computeBinaryLookupValue(rowIndex, colIndex, logic, binaryLookupTable));
    }
    return { sparse: sparseImage, table: binaryLookupTable };
};

pafcal.morpho = function(width, height, sparseImage, lookupTable) {
    var morphoElement = new FullMorphoElement(11),
        dilationResult = null;

    dilationResult = _dilation(width, height, morphoElement, sparseImage, lookupTable);
    return dilationResult;
};

pafcal.delete = function(sparseImage, sizeThreshold) {
    var indexLabel = [],
        labels = [],
        labelMap = [],
        resultImage = new SparseBinaryImage(sparseImage.rowCount),
        l = 1;

    for (var i = 0; i < sparseImage.size; i++) {
        var currentPoint = sparseImage.getPointBasedOnIndex(i),
            top = indexLabel[sparseImage.getIndexBasedOnPoint(new Point(currentPoint.x, currentPoint.y - 1))],
            left = indexLabel[sparseImage.getIndexBasedOnPoint(new Point(currentPoint.x - 1, currentPoint.y))];

        if (left === undefined && top === undefined) {
            labels[l] = 1;
            labelMap[l] = [];
            indexLabel[i] = l;
            l++;
            continue;
        }

        if (top > 0 && (left === undefined || top === left)) {
            labels[top]++;
            indexLabel[i] = top;
            continue;
        }

        if (left > 0 && top === undefined) {
            labels[left]++;
            indexLabel[i] = left;
            continue;
        }

        if (top !== left) {
            labels[top]++;
            indexLabel[i] = top;
            if (labelMap[top].indexOf(left) === -1) labelMap[top].push(left);
            if (labelMap[left].indexOf(top) === -1) labelMap[left].push(top);
            continue;
        }
    }

    for (var i = 0; i < sparseImage.size; i++) {
        var sum = labels[indexLabel[i]];
        if (sum >= sizeThreshold) {
            var point = sparseImage.getPointBasedOnIndex(i);
            resultImage.add(point.y, point.x);
            continue;
        }
        labelMap[indexLabel[i]].some(function(mapIndex) {
            sum += labels[mapIndex];
            if (sum >= sizeThreshold) {
                var point = sparseImage.getPointBasedOnIndex(i);
                resultImage.add(point.y, point.x);
                return true;
            }
        })
    }
    return resultImage;
};

pafcal.convexHull = function(sparseImage) {
    var leftStack = new Stack(),
        rightStack = new Stack(),
        left = null,
        right = null,
        top = null,
        topTop = null,
        result = [],
        index = 0;

    for (var i = index; i < sparseImage.row.length - 1; i++) {
        if (sparseImage.row[i + 1] - sparseImage.row[i] === 0) {
            continue;
        }
        left = new Point(sparseImage.col[sparseImage.row[i]], i);
        right = new Point(sparseImage.col[sparseImage.row[i + 1] - 1], i);

        if (leftStack.size <= 1) {
            leftStack.push(left);
        } else {
            top = leftStack.top();
            topTop = leftStack.topTop();
            d = (left.x - top.x) * (topTop.y - top.y) - (left.y - top.y) * (topTop.x - top.x);

            if (d >= 0) {
                leftStack.pop();
                while (leftStack.size >= 2) {
                    top = leftStack.top();
                    topTop = leftStack.topTop();
                    d = (left.x - top.x) * (topTop.y - top.y) - (left.y - top.y) * (topTop.x - top.x);
                    if (d >= 0) {
                        leftStack.pop();
                    } else break;
                }
                leftStack.push(left);
            } else if (d < 0) {
                leftStack.push(left);
            }
        }

        if (rightStack.size <= 1) {
            rightStack.push(right);
        } else {
            top = rightStack.top();
            topTop = rightStack.topTop();
            d = (right.x - top.x) * (topTop.y - top.y) - (right.y - top.y) * (topTop.x - top.x);
            if (d <= 0) {
                rightStack.pop();
                while (rightStack.size >= 2) {
                    top = rightStack.top();
                    topTop = rightStack.topTop();
                    d = (right.x - top.x) * (topTop.y - top.y) - (right.y - top.y) * (topTop.x - top.x);
                    if (d <= 0) {
                        rightStack.pop();
                    } else break;
                }
                rightStack.push(right);
            } else if (d > 0) {
                rightStack.push(right);
            }
        }
    }

    var rightResult = [],
        leftResult = [];
    while (rightStack.top() !== null) {
        rightResult.push(rightStack.pop());
    }
    while (leftStack.top() !== null) {
        leftResult.push(leftStack.pop());
    }
    result = leftResult.concat(rightResult.reverse())
    return result;
};

pafcal.centroid = function(convexHull) {
    var cx = 0,
        cy = 0,
        signedArea = 0,
        temp = undefined;

    if (convexHull.length < 3) return null;
    for (var i = 0; i < convexHull.length - 2; i++) {
        temp = convexHull[i].x * convexHull[i + 1].y - convexHull[i + 1].x * convexHull[i].y;
        cx += (convexHull[i].x + convexHull[i + 1].x) * temp;
        cy += (convexHull[i].y + convexHull[i + 1].y) * temp;
        signedArea += temp;
    }
    temp = convexHull[i].x * convexHull[0].y - convexHull[0].x * convexHull[i].y;
    cx += (convexHull[i].x + convexHull[0].x) * temp;
    cy += (convexHull[i].y + convexHull[0].y) * temp;
    signedArea += temp;

    signedArea /= 2;
    cx = cx / (6 * signedArea);
    cy = cy / (6 * signedArea);

    return new Point(cx, cy);
};

pafcal.decide = function(center, convexHull, offset) {
    var minDist = Infinity,
        maxDist = -Infinity;
    if (center === null) {
        pafcal._frameInfo.DETECTION_STATUS = "NONE";
        postMessage({ type: 'MISS', data: null });
        return;
    }
    for (var i = 0; i < convexHull.length; i++) {
        var dist = _pointDist(center, convexHull[i]);
        if (dist < minDist) minDist = dist;
        if (dist > maxDist) maxDist = dist;
    }
    if (maxDist <= 2 * minDist) {
        self._state = 'MOVE';
        pafcal._frameInfo.DETECTION_STATUS = "FREE_HAND";
        postMessage({ type: 'MOVE', data: new Point(center.x + offset.x, center.y + offset.y) })
    } else {
        if (self._state !== 'CLICK') {
            self._state = 'CLICK';
            pafcal._frameInfo.DETECTION_STATUS = "CLOSED_HAND";
            postMessage({ type: 'CLICK', data: new Point(center.x + offset.x, center.y + offset.y) });
        } else {
            postMessage({ type: 'SECOND_CLICK', data: new Point(center.x + offset.x, center.y + offset.y) });
        }
    };
    pafcal._frameInfo.CENTER_POINT = center;

}

function _getBestRect(rects, scale) {
    var length = rects.length,
        max = -Infinity,
        best = undefined;

    if (length === 0) return null;
    for (var i = 0; i < length; i++) {
        if (rects[i].confidence > max) {
            max = rects[i].confidence;
            best = rects[i];
        }
    }

    var rect = new Rectangle(new Point(best.x * scale | 0, best.y * scale | 0), best.width * scale | 0, best.height * scale | 0);

    postMessage({ type: 'FACE', data: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } });

    return rect;
};

function _pointDist(point, secondPoint) {
    var aa = (secondPoint.x - point.x),
        bb = (secondPoint.y - point.y);
    return Math.sqrt(aa * aa + bb * bb);
};

function _erosion(element, sparseImage, lookupTable) {
    var resultImage = new SparseBinaryImage(sparseImage.rowCount),
        tempSize = Math.floor(element.size / 2);

    for (var i = 0; i < sparseImage.size; i++) {
        var currentPoint = sparseImage.getPointBasedOnIndex(i),
            sum = _getAreaValue(new Point(currentPoint.x - tempSize, currentPoint.y - tempSize), new Point(currentPoint.x + tempSize, currentPoint.y + tempSize), lookupTable)
        if (sum === element.size * element.size) {
            resultImage.add(currentPoint.y, currentPoint.x);
        }
    }
    return resultImage;
};

function _dilation(width, height, element, sparseImage, lookupTable) {
    var resultImage = new SparseBinaryImage(sparseImage.rowCount),
        binaryLookupTable = new BinaryLookupTable(width, height),
        tempSize = Math.floor(element.size / 2);


    for (var i = tempSize; i < height - tempSize - 1; i++) {
        for (var j = tempSize; j < width - tempSize - 1; j++) {
            var sum = _getAreaValue(new Point(j - tempSize, i - tempSize), new Point(j + tempSize, i + tempSize), lookupTable);
            if (sum > 0) {
                resultImage.add(i, j);
            }
        }
    }
    return resultImage;
};

function _backgroundThreshold(threshold, backgroundPixel, imagePixel) {

    if (Math.abs(backgroundPixel.red - imagePixel.red) > threshold && Math.abs(backgroundPixel.blue - imagePixel.blue) > threshold && Math.abs(backgroundPixel.green - imagePixel.green) > threshold) {
        return true
    };
    // if (Math.abs(backgroundPixel.blue - imagePixel.blue) < threshold) return false;
    // if (Math.abs(backgroundPixel.green - imagePixel.green) < threshold) return false;
    return false;
};

function _medianBackFilter(row, col, background, image, threshold) {
    var size = 1,
        width = pafcal.constants.WIDTH,
        height = pafcal.constants.HEIGHT,
        r = [],
        g = [],
        b = [],
        br = [],
        bg = [],
        bb = [];

    for (var i = row - size; i <= row + size; i++) {
        for (var j = col - size; j <= col + size; j++) {
            var temp = i * width * 4 + j * 4;
            if (background[temp] !== undefined) {
                br.push(background[temp]);
                bg.push(background[temp + 1]);
                bb.push(background[temp + 2]);
            }
            if (image.data[temp] !== undefined) {
                r.push(image.data[temp]);
                g.push(image.data[temp + 1]);
                b.push(image.data[temp + 2]);
            }
        }
    }

    r.sort();
    g.sort();
    b.sort();

    br.sort();
    bg.sort();
    bb.sort();

    var fore = new RGBPixel(r[Math.floor(r.length / 2)], g[Math.floor(g.length / 2)], b[Math.floor(b.length / 2)]);
    var back = new RGBPixel(br[Math.floor(r.length / 2)], bg[Math.floor(bg.length / 2)], bb[Math.floor(bb.length / 2)]);

    if (Math.abs(fore.red - back.red) > threshold && Math.abs(fore.blue - back.blue) > threshold && Math.abs(fore.green - back.green) > threshold) {
        return true
    };
    return false;
}


function _rgbSkinDetection(pixel) {
    var isSkin = false;

    if ((pixel.red > 95) && (pixel.green > 40) && (pixel.blue > 20) && (_rgbMax(pixel) - _rgbMin(pixel) > 15) &&
        (Math.abs(pixel.red - pixel.green) > 15) && (pixel.red > pixel.green) && (pixel.red > pixel.blue)) {
        isSkin = true;
    }

    if ((pixel.red > 220) && (pixel.green > 210) && (pixel.blue > 170) && (Math.abs(pixel.red - pixel.green) <= 15) &&
        (pixel.red > pixel.blue) && (pixel.green > pixel.blue)) {
        isSkin = true;
    }
    return isSkin;
};

function _isValueInRange(value, range) {
    for (var i = 0; i < range.length; i++) {
        if (value >= range[i].MIN && value <= range[i].MAX) {
            return true;
        }
    }
    return false;
};

function _hsvSkinDetection(pixel, threshold) {
    if (_isValueInRange(pixel.h, threshold.HUE) && _isValueInRange(pixel.s, threshold.SATURATION) && _isValueInRange(pixel.v, threshold.VALUE)) {
        return true;
    }
    return false;
};



function _computeBinaryLookupValue(n, m, value, table) {
    var result = 0;

    result += table.get(n - 1, m);
    result += table.get(n, m - 1);
    result -= table.get(n - 1, m - 1);
    result += (value) ? 1 : 0;

    return result;
};

function _rgbMax(pixel) {
    return Math.max(pixel.red, pixel.green, pixel.blue);
};

function _rgbMin(pixel) {
    return Math.min(pixel.red, pixel.green, pixel.blue);
};

function _getAreaValue(point1, point2, table) {
    if (point1.x > point2.x || point1.y > point2.y) {
        throw new Error("The points are not in the right order!")
    };

    result = table.get(point2.y, point2.x) + table.get(point1.y - 1, point1.x - 1) - table.get(point1.y - 1, point2.x) - table.get(point2.y, point1.x - 1);
    return result;
};

onmessage = function(e) {
    switch (e.data.type) {
        case 'CONFIG':
            pafcal.configure(e.data.data);
            break;
        case 'IMAGE':

            var start = (new Date).getTime();

            pafcal.step(e.data.data.image, e.data.data.jsfeat);
            var diff = (new Date).getTime() - start;

            if (pafcal.constants.COMPLETE_INFO) {
                pafcal._frameInfo.DETECTION_TIME_MILISECONDS = diff;
                pafcal.showFrameInfo();
            }
            break;
        case 'BACKGROUND_IMAGE':
            pafcal.modelBackground(e.data.data.image, e.data.data.count);
            break;
        case 'FINAL_BACKGROUND_IMAGE':
            pafcal.createBackgroundReference(e.data.data.image, e.data.data.count);
            break;
        default:
            break;
    }
}
