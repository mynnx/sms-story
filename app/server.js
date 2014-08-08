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

    fs.writeFileSync('./contacts.json', JSON.stringify(contacts, undefined, 2));
    fs.writeFileSync('./sms.json', JSON.stringify(sms, undefined, 2));
    vizData = gv.processMessages(sms, contacts, 2009, 2015);
    res.send(vizData);
  });
});

if (process.argv[2] === 'cache') {
    gv.processMessages(require('./sms.json'),
                       require('./contacts.json'),
                       2009, 2015);
}

server.listen(3000);
console.log('Listening on port 3000');

