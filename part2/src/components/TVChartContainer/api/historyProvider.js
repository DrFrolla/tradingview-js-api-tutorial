var rp = require('request-promise');
const api_root = 'http://localhost:3333/api/request_data_from_db';

const history = {}

async function getBars(symbolInfo, resolution, from, to, first, limit) {
    var split_symbol = symbolInfo.name.split(/[:/]/)
    //const url = resolution === 'D' ? '/data/histoday' : resolution >= 60 ? '/data/histohour' : '/data/histominute'

    const requestData = await rp.post({
        url: api_root,
        form: {
            e: split_symbol[0], //Coinbase
            coin: split_symbol[1], //BTC
            tsym: split_symbol[2], //USD
            toTs: to ? to : '', //Timestamp
            limit: limit ? limit : 2000,
            // aggregate: 1//resolution 
        }
    });

    const reqData = JSON.parse(requestData);
    const data = reqData.candlesTV;
    if (data.Response && data.Response === 'Error') {
        console.log('CryptoCompare API error:', data.Message)
        return []
    }

    if (data.length) {
        console.log(`Actually returned: ${data[0].time} - ${data[data.length - 1].time}`)
        var bars = data.map(el => {
            return {
                time: el.time,// * 1000, //TradingView requires bar time in ms
                low: el.low,
                high: el.high,
                open: el.open,
                close: el.close,
                volume: el.volume
            }
        })
        if (first) {
            var lastBar = bars[bars.length - 1]
            history[symbolInfo.name] = { lastBar: lastBar }
        }

        return bars
    } else {
        return []
    }


}

export default { history, getBars }