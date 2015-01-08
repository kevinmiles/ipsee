/**
* @module Messenger
*/

var coalescent = require('coalescent');
var glob = require('glob');
var merge = require('merge');
var events = require('events');
var util = require('util');
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
  this.options = merge(Messenger.DEFAULTS, options || {});
  this.fd = this._getFileDescriptor(this.options.uid);
  
  this._init();
};

util.inherits(Messenger, events.EventEmitter);

Messenger.DEFAULTS = {
  path: '/tmp',
  debug: false,
  scanInterval: 500,
  uid: process.pid,
  relayMessages: false
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
  
  if (this.options.relayMessages) {
    this.channel.use(coalescent.tattletale());
  }
  
  this.channel.use(coalescent.courier());
  this.channel.use(coalescent.router());
  
  this.channel.route('*', function(sock, message) {
    self.emit(message.type, message.body);
  });
  
  this.channel.listen(this.fd, function() {
    self.emit('ready');
  });
  
  process.on('exit', this.channel.server.close.bind(this.channel.server));
};

/**
* Connects to the unix socket under this namespace by UID
* #subscribe
*/
Messenger.prototype.subscribe = function(uid) {
  this.channel.connect(this._getFileDescriptor(uid));
};

/**
* Broadcasts message to connected sockets
* #send
*/
Messenger.prototype.send = function(event, data) {
  this.channel.broadcast(event, data);
};

/**
* Returns path to unix socket by the supplied UID
* #_getFileDescriptor
*/
Messenger.prototype._getFileDescriptor = function(uid) {
  return this.options.path + '/' + this.namespace + '-' + uid + '.sock';
};

module.exports = Messenger;
