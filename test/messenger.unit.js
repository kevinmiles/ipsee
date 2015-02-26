var expect = require('chai').expect;
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

  var ipc1, ipc2, ipc3, ipc4, ipc5;

  describe('@constructor', function() {

    it('should not create an instance without a namespace', function(done) {
      expect(ipsee).to.throw;
      done();
    });

    it('should create the instance and setup socket with pid', function(done) {
      ipc1 = ipsee('ipsee_test').on('ready', function() {
        expect(fs.existsSync(ipc1.socketPath)).to.equal(true);
        expect(ipc1.options.uid).to.equal(process.pid);
        done();
      });
    });

    it('should setup socket with ovewritten uid', function(done) {
      ipc2 = ipsee('ipsee_test', { uid: 2 }).on('ready', function() {
        expect(ipc2.options.uid).to.equal(2);
        done();
      });
    });

  });

  describe('#subscribe', function() {

    it('should subscribe to the socket with the given uid', function(done) {
      ipc3 = ipsee('ipsee_test', { uid: 3 }).on('ready', function() {
        ipc3.subscribe(2);
        ipc2.channel.once('peerConnected', function() {
          done();
        });
      });
    });

    it('should subscribe to all existing sockets', function(done) {
      var conns = 0;
      ipc4 = ipsee('ipsee_test', { uid: 4 }).subscribe();
      ipc1.channel.once('peerConnected', check);
      ipc2.channel.once('peerConnected', check);
      ipc3.channel.once('peerConnected', check);
      function check() {
        conns++;
        if (conns === 3) done();
      };
    });

  });

  describe('#send', function() {

    it('should send the message and have it received', function(done) {
      ipc3.on('event1', function(data) {
        expect(data.beep).to.equal('boop');
        done();
      });
      ipc2.send('event1', { beep: 'boop' });
    });

    it('should include the sender uid in the data', function(done) {
      ipc3.on('event2', function(data) {
        expect(data._fromUID).to.equal(2);
        done();
      });
      ipc2.send('event2');
    });

  });

  describe('#close', function() {

    it('should close the file descriptor when destroyed', function(done) {
      ipc5 = ipsee('ipsee_test', { uid: 5 }).on('ready', function(data) {
        ipc5.close();
      }).on('close', function() {
        expect(fs.existsSync(ipc5.socketPath)).to.equal(false);
        done();
      });
    });

    it('should get peerDisconnected event on peer destroy', function(done) {
      ipc4.channel.once('peerDisconnected', function() {
        done();
      });
      ipsee('ipsee_test', { uid: 5 }).on('ready', function(data) {
        this.close();
      }).subscribe(4);
    });

  });

});
