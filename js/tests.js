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
