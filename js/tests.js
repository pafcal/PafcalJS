function filterTest() {
    var image = {
        data: [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
            11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11
        ]
    }
    console.log(applyFilter(4, 4, image, LOW_PASS_FILTER));
}

function testFilterApplication(initialData, filteredData) {
    var count = 0;
    if (initialData.length !== filteredData.length) return true;
    for (var i = 0; i < initialData.length; i++) {
        if (initialData[i] !== filteredData[i]) count++;
    }
    return count;
}

/*function testRectanglePrint() {
    var point = new Point(0, 0),
        secondPoint = new Point(1280, 720),
        foregroundContext = document.getElementById('foregroundCanvas').getContext('2d');
    printRectangle(1280, 720, point, secondPoint, foregroundContext);
}*/

/*function testSlideWindow() {
    var foregroundContext = document.getElementById('foregroundCanvas').getContext('2d');
    slideWindow(100, 322, foregroundContext, HAND_RATIO)
}*/

/*function testTableCreation(width, height) {
    var table = new BinaryLookupTable(width, height);
    table.data[0].push(computeBinaryLookupValue(0, 0, true, table));
    table.data[0].push(computeBinaryLookupValue(0, 1, false, table));
    table.data[0].push(computeBinaryLookupValue(0, 2, true, table));
    table.data[0].push(computeBinaryLookupValue(0, 3, true, table));
    table.data[0].push(computeBinaryLookupValue(0, 4, true, table));

    table.data[1].push(computeBinaryLookupValue(1, 0, false, table));
    table.data[1].push(computeBinaryLookupValue(1, 1, true, table));
    table.data[1].push(computeBinaryLookupValue(1, 2, false, table));
    table.data[1].push(computeBinaryLookupValue(1, 3, false, table));
    table.data[1].push(computeBinaryLookupValue(1, 4, false, table));

    table.data[2].push(computeBinaryLookupValue(2, 0, false, table));
    table.data[2].push(computeBinaryLookupValue(2, 1, false, table));
    table.data[2].push(computeBinaryLookupValue(2, 2, true, table));
    table.data[2].push(computeBinaryLookupValue(2, 3, true, table));
    table.data[2].push(computeBinaryLookupValue(2, 4, false, table));
}*/

function testErosion() {
    var elem = new FullMorphoElement(3);
    var binaryImage = {
        n: 5,
        m: 5,
        data: [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1]
        ]
    }
    var table = new BinaryLookupTable(5, 5);
    table.data = [
        [1, 2, 3, 4, 5],
        [2, 4, 6, 8, 10],
        [3, 6, 9, 12, 15],
        [4, 8, 12, 16, 20],
        [5, 10, 15, 20, 25]
    ]
    console.log(erosion(elem, binaryImage, table));
}

function testCreationOfTableFromImage() {
    var binaryImage = {
        n: 5,
        m: 5,
        data: [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1]
        ]
    }
    console.log(new BinaryLookupTableFromImage(binaryImage));
}

function testResizeImage() {
    var image = new BinaryImage(3, 3);
    image.data = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1]
    ];
    console.log(resizeImage(image, 2));
}

function _binaryImageFromImage(width, height, imageData) {
    var binaryImage = new BinaryImage(width, height);
    for (var i = 0; i < imageData.length; i += 4) {
        var rowIndex = Math.floor((i / 4) / width),
            logic = (imageData[i] === 255) ? 0 : 1;
        binaryImage.data[rowIndex].push(logic);
    }
    return binaryImage;
}

function noiseReductionTest() {
    var foregroundContext = document.getElementById('foregroundCanvas').getContext('2d'),
        destinationContext = document.getElementById('resultCanvas').getContext('2d'),
        img = new Image(),
        width = 1280,
        height = 720;

    img.addEventListener("load", function() {
        destinationContext.drawImage(img, 0, 0);

        // var result = backgroundAndSkinDetection(width, height, { data: [] }, destinationContext.getImageData(0, 0, width, height));

        var binaryImage = _binaryImageFromImage(width, height, destinationContext.getImageData(0, 0, width, height).data),
            table = new BinaryLookupTableFromImage(binaryImage),
            erosionElement = new FullMorphoElement(5),
            dilationElement = new FullMorphoElement(5),
            filter = new Filter(3, LOW_PASS_FILTER);

        // var resultImage = medianFilter(binaryImage, table, 13);
        var resultImage = deleteConectedComponents(binaryImage, 3000);
        // var resultImage = binaryImageFilter(binaryImage, filter);

        printBinaryImage(resultImage, width, height, foregroundContext);
    }, false);
    img.src = '../images/test.png'; // Set source path
}

function testConectedComponentsDeletion() {
    var image = new BinaryImage(5, 5);
    image.data = [
        [1, 1, 1, 0, 1],
        [0, 0, 1, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 0, 0],
        [0, 0, 0, 0, 1]
    ];
    console.log(deleteConectedComponents(image, 4));
}

function testSparseBinaryImage() {
    var image = new SparseBinaryImage(3);
    image.add(0, 0);
    image.add(0, 2);
    image.add(0, 4);

    image.add(1, 1);
    image.add(1, 3);
    image.add(1, 5);

    image.add(2, 0);
    image.add(2, 1);
    image.add(2, 2);
    image.add(2, 3);
    image.add(2, 4);
    image.add(2, 5);

    console.log(deleteConectedComponents(6, 3, image, 0));
}

function testSparseImageTest() {
    var destinationContext = document.getElementById('resultCanvas').getContext('2d');
    var image = new SparseBinaryImage(3);
    image.add(0, 0);
    image.add(0, 1);
    image.add(0, 2);
    image.add(0, 3);
    image.add(0, 4);
    image.add(0, 5);

    image.add(1, 0);
    image.add(1, 1);
    image.add(1, 2);
    image.add(1, 3);
    image.add(1, 4);
    image.add(1, 5);

    image.add(2, 0);
    image.add(2, 1);
    image.add(2, 2);
    image.add(2, 3);
    image.add(2, 4);
    image.add(2, 5);
    printSparseImage(6, 3, image, destinationContext);
}

function testSequantialDeleteConectedComponents() {
    var image = new SparseBinaryImage(3);
    image.add(0, 0);
    image.add(0, 1);
    image.add(0, 4);
    image.add(0, 5);

    image.add(1, 1);
    image.add(1, 2);
    image.add(1, 3);
    image.add(1, 4);

    console.log(sequantialDeleteConectedComponents(6, 3, image, 5));
}

function testContrastStreching() {
    var foregroundContext = document.getElementById('foregroundCanvas').getContext('2d'),
        destinationContext = document.getElementById('resultCanvas').getContext('2d'),
        img = new Image(),
        width = 800,
        height = 600;

    img.addEventListener("load", function() {
        destinationContext.drawImage(img, 0, 0);
        var imageData = destinationContext.getImageData(0, 0, width, height);
        var newImageData = contrastStreching(width, height, imageData, foregroundContext);
        foregroundContext.putImageData(newImageData, 0, 0);
    }, false);
    img.src = '../images/contrast.jpg'; // Set source path
}

function testConvexHull() {
    // var binaryImage = new BinaryImage(3, 3);
    // binaryImage.data[0][0] = 1;
    // binaryImage.data[2][0] = 1;
    // binaryImage.data[1][2] = 1;
    // binaryImage.data[1][1] = 1;
    var destinationContext = document.getElementById("resultCanvas").getContext('2d');
    destinationContext.beginPath();
    destinationContext.lineWidth = "6";
    destinationContext.strokeStyle = "red";

    var result = convexHull(resizeImage(BINARY_HAND_SHAPE, 9));
    printConvexHull(result, destinationContext);
}
