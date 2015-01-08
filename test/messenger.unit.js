var should = require('should');
var ipsee = require('../lib/messenger');
var fs = require('fs');
var glob = require('glob');

before(function(done) {
  done();
});

after(function(done) {
  glob('/tmp/ipsee_test-*.sock', function(err, files) {
    files.forEach(fs.unlinkSync);
    done();
  });
});

describe('Messenger', function() {
  
  var ipc1, ipc2, ipc3;
  
  describe('@constructor', function() {
    
    it('should create the instance and setup a unix socket', function(done) {
      ipc1 = ipsee('ipsee_test', { uid: 1 }).on('ready', function() {
        should(fs.existsSync(ipc1.fd)).equal(true);
        done();
      });
    });
    
  });
  
  describe('#subscribe', function() {
    
    it('should create the instance and connect to socket', function(done) {
      ipc2 = ipsee('ipsee_test', { uid: 2 }).on('ready', function() {      
        ipc2.subscribe(1);
        ipc2.channel.on('peerConnected', function() {
          done();
        });
      });
    });
    
  });
  
  describe('#send', function() {
    
    it('should send the message and have it received', function(done) {
      ipc1.once('test_event', function(data) {
        should(data.beep).equal('boop');
        done();
      });
      ipc2.send('test_event', { beep: 'boop' });
    });
    
  });

});
