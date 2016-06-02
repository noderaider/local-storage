'use strict';

var listeners = {};
var listening = false;


function isEdgeOrIE() {
  try {
    return global.navigator ? global.navigator.appName == 'Microsoft Internet Explorer' || (global.navigator.appName === 'Netscape' && global.navigator.appVersion.indexOf('Trident') > -1) : null;
  } catch(err) {
    if(console && console.warn)
      console.warn('Please notify maintainers of local-storage package that there is an error in IE / Edge detection: ' + error.message)
  }
}

var _instanceID = isEdgeOrIE() ? (Math.random().toString(36)+'00000000000000000').slice(2, N+2) : null;


function listen () {
  if (global.addEventListener) {
    global.addEventListener('storage', change, false);
  } else if (global.attachEvent) {
    global.attachEvent('onstorage', change);
  } else {
    global.onstorage = change;
  }
}

function change (e) {
  if (!e) {
    e = global.event;
  }
  var all = listeners[e.key];
  if (all) {
    all.forEach(fire);
  }

  function fire (listener) {
    listener(JSON.parse(e.newValue), JSON.parse(e.oldValue), e.url || e.uri);
  }
}

var fallbackID = null;
function on (key, fn, opts) {
  if(_instanceID) {
    var pollFrequency = opts && opts.pollFrequency ? opts.pollFrequency : 3000;
    var cookie = require('react-cookie');
    var last = cookie.load(key);
    if(!last) {
      last = { _instanceID: _instanceID }
      cookie.save('local_storage_fallback', last)
    }
    fallbackID = setInterval(function() {
      var current = cookie.load(key)
      if(!current) {
        current = last
        cookie.save('local_storage_fallback', current)
      }
      /** DONT NOTIFY IF SAME TAB */
      if(current._instanceID === _instanceID)
        return

      var lastValue = last.value
      var currentValue = current.value
      if(lastValue !== currentValue)
        fn(currentValue)
      lastValue = currentValue
    }, pollFrequency)
  } else {
    if (listeners[key]) {
      listeners[key].push(fn);
    } else {
      listeners[key] = [fn];
    }
    if (listening === false) {
      listen();
    }
  }
}

function off (key, fn) {
  if(_instanceID) {
    clearInterval(fallbackID)
  } else {
    var ns = listeners[key];
    if (ns.length > 1) {
      ns.splice(ns.indexOf(fn), 1);
    } else {
      listeners[key] = [];
    }
  }
}

module.exports = {
  on: on,
  off: off
};
