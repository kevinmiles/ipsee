Ipsee
=====

[![Build Status](https://travis-ci.org/gordonwritescode/ipsee.svg)](https://travis-ci.org/gordonwritescode/ipsee)

Ipsee facilitates IPC (Inter Process Communication) in Node.js via UNIX sockets.

## Getting Started

Install using NPM:

```
npm install ipsee --save
```

Give Ipsee a namespace for your application and subscribe:

```js
var ipsee = require('ipsee');
var ipc   = ipsee('my_app_namespace').subscribe();
```

Now you can send and receive messages with your other processes and programs:

```js
ipc.on('ping', function(data) {
  console.log('received ping from pid %d, sending pong...', data._fromUID);
  ipc.send('pong');
});
```

---

## ipsee(namespace, [options])

Creates a new UNIX socket server and connects to other sockets in the given namespace.

### Methods

#### i.subscribe([uid])

If a `uid` is supplied, then subscribe to the socket server referenced, otherwise subscribe to all in the namespace.

#### i.send(event, [data])

Broadcast an event to other connected sockets containing optional data.

#### i.close()

End connections with all sockets and unlink the underlying file descriptor.

### Options

The `ipsee()` function's second argument is an *optional* `options` dictionary.

#### path

Directory path where UNIX socket file descriptor should be created. Default: `/tmp`.

#### debug

Print verbose debug messages to the console. Default: `false`.

#### uid

Unique identifier other ipsee instances use to refer to this one. Default: `process.pid`.

### Events

Aside from your custom event listeners, there are a few built in events.

#### ready

Emitted when this socket server is listening on the newly minted file descriptor.

#### close

Emitted when this socket server has been closed and the underlying file descriptor unlinked.

#### error

Emitted when something unexpected happens. Failure to handle this event will result in a `throw`.
