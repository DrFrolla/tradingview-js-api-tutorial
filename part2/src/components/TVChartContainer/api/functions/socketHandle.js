function lastBar(data) {
    let lastBarArray = {};
    let ticks = [];

    data.forEach(element => {
        let key = Object.keys(element);
        console.log('ohKey', key);
        if (key != 'bitflyer') {
            if (element[key].ticks) {
                element[key].ticks.forEach(el => {
                    ticks.push(el);
                });
            }
        }

    });

    let sortedTicks = sortTime(ticks);

    return sortedTicks;
}

function sortTime(array) {

    var sortedArray = array.sort((b, a) => parseFloat(b.Time) - parseFloat(a.Time));

    //console.log(sortedArray)
    return sortedArray;
}

export default lastBar