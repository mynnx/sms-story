'use strict';

var express = require('express');
var fs = require('fs');
var path = require('path');
var gv = require('../lib/gv');

var server = express();
var keys = fs.readFileSync('./keys.json'),
    vizData;

try {
  keys = JSON.parse(keys);
}
catch (err) {
  console.log('There has been an error parsing your JSON.');
}


server.configure(function () {
  server.use(express.static(path.join(__dirname, '..', 'public')));
});

server.get('/api/sms', function (req, res){
  if (vizData) { console.log('cached!'); return res.send(vizData); }
  gv.getData(keys, function (err, sms, contacts) {
    if (err) { res.send(500, err); }

    vizData = gv.processMessages(sms, contacts, 2009, 2014);
    res.send(vizData);
  });
});

if (process.argv[2] === 'cache') { processMessages(require('./data.json')); }

server.listen(3000);
console.log('Listening on port 3000');

