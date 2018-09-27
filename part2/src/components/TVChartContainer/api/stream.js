// api/stream.js
import historyProvider from './historyProvider'
import socketHandle from './functions/socketHandle'
import socketHandleAvegare from './functions/socketHandleAvegare'
// we use Socket.io client to connect to cryptocompare's socket.io stream
var io = require('socket.io-client')
// var socket_url = 'wss://streamer.cryptocompare.com'
const socket_url = 'http://btc15secdatagathering-env.ydyfskc6er.eu-central-1.elasticbeanstalk.com/'
var socket = io(socket_url)
// keep track of subscriptions
var _subs = []

socket.on('connect', () => {
  console.log('===Socket connected')
})
socket.on('disconnect', (e) => {
  console.log('===Socket disconnected:', e)
})
socket.on('error', err => {
  console.log('====socket error', err)
})
socket.on('new data', dataSocketAverage); //dataSocket to all ticks

async function dataSocketAverage(e) {

  const newBar = await socketHandleAvegare(e.dati_da_API);

  const data = {
    origin: newBar.exchange,
    exchange: "Coinbase",
    from_sym: "USD",
    price: newBar.Price,
    sub_type: 0,
    to_sym: "BTC",
    trade_id: newBar.time,
    ts: newBar.time,
    volume: newBar.volume
  };

  const channelString = `${data.sub_type}~${data.exchange}~${data.to_sym}~${data.from_sym}`;
  const sub = _subs.find(e => e.channelString === channelString);

  var resolution = sub.resolution;
  if (resolution.includes('D')) {
    // 1 day in minutes === 1440
    resolution = 1440000;
  } else if (resolution.includes('W')) {
    // 1 week in minutes === 10080
    resolution = 10080000;
  }
  var coeff = resolution * 15000;
  // console.log({coeff})
  var rounded = Math.floor(data.ts / coeff) * coeff;

  newBar.time = rounded;

  const _lastBar = newBar;
  sub.listener(_lastBar);
  sub.lastBar = newBar;

}


async function dataSocket(e) {
  // here we get all events the CryptoCompare connection has subscribed to
  // we need to send this new data to our subscribed charts

  const lastTicks = await socketHandle(e.dati_da_API);
  console.log('lastTicks', lastTicks)

  let _lastBar = {};
  let sub;

  for (const element of lastTicks) {

    const data = {
      origin: element.exchange,
      exchange: "Coinbase",
      from_sym: "USD",
      price: element.Price,
      sub_type: 0,
      to_sym: "BTC",
      trade_id: element.TradeId,
      ts: element.Time,
      volume: element.Volume
    };

    const channelString = `${data.sub_type}~${data.exchange}~${data.to_sym}~${data.from_sym}`;
    sub = _subs.find(e => e.channelString === channelString);

    if (sub) {
      // disregard the initial catchup snapshot of trades for already closed candles
      if (data.ts < sub.lastBar.time) {
        return
      }

      _lastBar = updateBar(data, sub, _lastBar);
      // console.log('_lastBar', _lastBar);
      // send the most recent bar back to TV's realtimeUpdate callback
      sub.listener(_lastBar)

    };

  };
  // update our own record of lastBar
  sub.lastBar = _lastBar
};

// Take a single trade, and subscription record, return updated bar
function updateBar(data, sub, _lastBar) {
  var lastBar = sub.lastBar
  var resolution = sub.resolution
  if (resolution.includes('D')) {
    // 1 day in minutes === 1440
    resolution = 1440
  } else if (resolution.includes('W')) {
    // 1 week in minutes === 10080
    resolution = 10080
  }
  var coeff = resolution * 15000
  // console.log({coeff})
  var rounded = Math.floor(data.ts / coeff) * coeff
  // let rounded = data.ts;
  var lastBarSec = lastBar.time

  if (rounded > lastBarSec) {
    // create a new candle, use last close as open **PERSONAL CHOICE**
    let high, low;
    let volume;

    if (Object.keys(_lastBar).length > 0) {

      if (data.price < _lastBar.low) {
        low = data.price
      } else {
        low = _lastBar.low;
      }

      if (data.price > _lastBar.high) {
        high = data.price
      } else {
        high = _lastBar.high;
      }
      volume = _lastBar.volume;
      volume += data.volume;


    } else {
      // console.log('_lastBar', "non c'e keys")
      high = lastBar.close;
      low = lastBar.close;
      volume = 0;
    }

    // console.log('_lastBar', Object.keys(_lastBar))
    _lastBar = {
      time: rounded,
      open: lastBar.close,
      high,
      low,
      close: data.price,
      volume
    }


  } else {
    // update lastBar candle!
    if (data.price < lastBar.low) {
      lastBar.low = data.price
    } else if (data.price > lastBar.high) {
      lastBar.high = data.price
    }
    // console.log('_lastBar', 'update lastBar')
    lastBar.volume += data.volume
    lastBar.close = data.price
    _lastBar = lastBar
  }

  return _lastBar
}

// takes symbolInfo object as input and creates the subscription string to send to CryptoCompare
function createChannelString(symbolInfo) {
  var channel = symbolInfo.name.split(/[:/]/)
  const exchange = channel[0] === 'GDAX' ? 'Coinbase' : channel[0]
  const to = channel[2]
  const from = channel[1]
  // subscribe to the CryptoCompare trade channel for the pair and exchange
  return `0~${exchange}~${from}~${to}` //
}

function subscribeBars(symbolInfo, resolution, updateCb, uid, resetCache) {
  const channelString = createChannelString(symbolInfo)
  socket.emit('SubAdd', { subs: [channelString] })

  var newSub = {
    channelString,
    uid,
    resolution,
    symbolInfo,
    lastBar: historyProvider.history[symbolInfo.name].lastBar,
    listener: updateCb,
  }
  _subs.push(newSub)
}

function unsubscribeBars(uid) {
  var subIndex = _subs.findIndex(e => e.uid === uid)
  if (subIndex === -1) {
    //console.log("No subscription found for ",uid)
    return
  }
  var sub = _subs[subIndex]
  socket.emit('SubRemove', { subs: [sub.channelString] })
  _subs.splice(subIndex, 1)
}



export default {
  subscribeBars, unsubscribeBars
}