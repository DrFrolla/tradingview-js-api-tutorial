function dataAverage(array) {

    var sumOpen = 0;
    var sumHigh = 0;
    var sumLow = 0;
    var sumClose = 0;
    var sumVolume = 0;
    var n = 0;

    for (var el in array) {

        var val = array[el];
        var timestamp = val.timestamp;

        if (!isNaN(val.close) && val.close !== 0) {
            sumOpen += val.open;
            sumHigh += val.high;
            sumLow += val.low;
            sumClose += val.close;
            sumVolume += val.volume;
            n++;
        }

        var openAverage = sumOpen / n;
        var highAverage = sumHigh / n;
        var lowAverage = sumLow / n;
        var closeAverage = sumClose / n;

        //array = { timestamp: el, close: closeAverage }

    }

    const newArray = {
        time: timestamp,
        open: openAverage,
        high: highAverage,
        low: lowAverage,
        close: closeAverage,
        volume: sumVolume
    };

    console.log('average', newArray);
    return newArray;
}

function lastBar(data) {

    let exchangesData = [];

    data.forEach(element => {
        let key = Object.keys(element);

        if (key[0] !== 'bitflyer') {
            const exchange = key[0];
            const el = element[exchange];
            var timestamp = Number(el.timestamp);
            var open = Number(el.open);
            var high = Number(el.high);
            var low = Number(el.low);
            var close = Number(el.close);
            var volume = Number(el.volume);

            exchangesData.push({ exchange, timestamp, open, high, low, close, volume });
        }

    });

    let averagedData = dataAverage(exchangesData);

    return averagedData;
}

export default lastBar