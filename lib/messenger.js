/**
* @module Messenger
*/

var coalescent = require('coalescent');
var glob = require('glob');
var merge = require('merge');
var events = require('events');
var util = require('util');
var fs = require('fs');
var pid = process.pid;

/**
* Creates an IPC messenger
* @constructor
* @param {string} namespace - prefix for unix socket file descriptors
* @param {object} options - messenger configuration
*/
function Messenger(namespace, options) {
  if (!(this instanceof Messenger)) {
    return new Messenger(namespace, options);
  }

  if (!namespace) {
    throw new Error('Cannot create Messenger without a namespace');
  }

  events.EventEmitter.call(this);

  this.namespace = namespace;
  this.options = merge(Object.create(Messenger.DEFAULTS), options || {});
  this.socketPath = this._getFileDescriptorPath(this.options.uid);

  this._init();
};

util.inherits(Messenger, events.EventEmitter);

Messenger.DEFAULTS = {
  path: '/tmp',
  debug: false,
  uid: process.pid
};

/**
* Connects to the unix socket under this namespace by UID
* #subscribe
*/
Messenger.prototype.subscribe = function(uid) {
  var self = this;

  if (uid) {
    return this.channel.connect(this._getFileDescriptorPath(uid));
  }

  glob(this._getFileDescriptorPath('*'), function(err, filenames) {
    if (err) {
      return self.emit('error', err);
    }

    filenames.filter(function(filename) {
      return filename !== self.socketPath;
    }).forEach(function(socketPath) {
      self.channel.connect(socketPath);
    });
  });

  return this;
};

/**
* Broadcasts message to connected sockets
* #send
*/
Messenger.prototype.send = function(event, data) {
  data = (typeof data === 'object') ? data : {};
  data._fromUID = this.options.uid;

  this.channel.broadcast(event, data);

  return this;
};

/**
* Closes the given instance
* #close
*/
Messenger.prototype.close = function() {
  var self = this;

  fs.unlink(this.socketPath, function(err) {
    if (err) {
      self.emit('error', err);
    }

    self.channel.peers(function(sock) {
      sock.end();
    });

    self.emit('close');
  });
};

/**
* Returns path to unix socket by the supplied UID
* #_getFileDescriptor
*/
Messenger.prototype._getFileDescriptorPath = function(uid) {
  return this.options.path + '/' + this.namespace + '-' + uid + '.sock';
};

/**
* Sets up IPC channel
* #_init
*/
Messenger.prototype._init = function() {
  var self = this;

  this.channel = coalescent({
    minPeers: 0,
    logger: null
  });

  this.channel.use(coalescent.courier());
  this.channel.use(coalescent.router());

  this.channel.route('*', function(sock, message) {
    self.emit(message.type, message.body);
  });

  this.channel.listen(this.socketPath, function() {
    self.emit('ready');
  });

  process.on('exit', function() {
    if (fs.existsSync(self.socketPath)) {
      fs.unlinkSync(self.socketPath);
    }
  });
};

module.exports = Messenger;
