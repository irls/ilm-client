import io from 'socket.io-client';
let socket;


class liveDB {
  constructor(onConnectCallback) {
    this.start(onConnectCallback);
    this.start(onConnectCallback);
  }
  stop() {
    socket.close();
  }
  start(onConnectCallback) {
    if(socket){
      socket.close();
    }

    socket = new io(
      process.env.LIVE_QUERY_URL,
      {
        timeout: 1000,
        autoConnect: true,
        reconnection: true,
      });

    socket.on('reconnect_error', () => {
      console.log('[liveDB]:reconnect_error');
      onConnectCallback.call(this, socket.connected);
    });
    socket.on("connect", () => {
      console.log('[liveDB]:connect');
      onConnectCallback.call(this, socket.connected);
    });
    socket.on("reconnect_failed", () => {
      console.log('[liveDB]:reconnect_failed');
      onConnectCallback.call(this, socket.connected);
    });
    socket.on("error", (data) => {
      console.log('[liveDB]:error',data);
    });
    socket.on('connect_error', (data) => {
      console.log('[liveDB]:error',data);
    });

    this.keys = {};
    this.subscriber_id = null;
  }

  setSubscriberId(subscriber_id) {
    this.subscriber_id = subscriber_id;
  }

  startWatch(key, className, params, callback) {
    if (this.keys[className] && this.keys[className] != key) {
      this.stopWatch(className);
    }
    if (!this.keys[className] || this.keys[className] !== key) {
      this.keys[className] = key;
      //this.className = className;

      socket.emit('start-watch', {class: className, params: params, key: key, subscriber: this.subscriber_id});

      socket.on('data-change-' + key, (data) => {
        //console.log('data-change-' + key, data);
        callback.call(this, data);
      });
      socket.on('stop-watch-all-' + key, (data) => {
        this.stopWatch(data.class);
      });
    }
  }

  stopWatch(className) {
    if (this.keys[className]) {
      //console.log(socket)
      socket.emit('stop-watch', {class: className, key: this.keys[className], subscriber: this.subscriber_id});
      delete this.keys[className];
      //socket.close();
    }
  }

  stopWatchAll() {
    for (var k in this.keys) {
      socket.emit('stop-watch', {class: k, key: this.keys[k], subscriber: this.subscriber_id});
    }
  }

  onBookReimport() {
    let key = this.keys['blockV'];
    if (key) {
      socket.emit('stop-watch-all', {class: 'blockV', key});
      this.stopWatch('blockV');
    }
  }
}

export {
  liveDB
}
