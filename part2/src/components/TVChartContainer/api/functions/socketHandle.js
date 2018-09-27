function lastBar(data) {
    // let lastBarArray = {};
    let ticks = [];

    data.forEach(element => {
        let key = Object.keys(element);

        if (key[0] !== 'bitflyer') {
            if (element[key[0]].ticks) {
                element[key[0]].ticks.forEach(el => {
                    el.exchange = key[0];
                    ticks.push(el);
                });
            }
        }

    });

    let sortedTicks = sortTime(ticks);
    // console.log('Ticks', sortedTicks)
    // save ticks to DB
    return sortedTicks;
}

function sortTime(array) {

    var sortedArray = array.sort((b, a) => parseFloat(b.Time) - parseFloat(a.Time));

    //console.log(sortedArray)
    return sortedArray;
}

export default lastBar