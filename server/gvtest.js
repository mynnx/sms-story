'use strict';

var voicejs = require('voice.js');
var fs = require('fs');
var _ = require('underscore');

var data = {},
    messages = {},
    messages2 = {};

function processMessageForTopN(message) {
    var date = new Date(message.start_time);
    var key = date.getUTCMonth().toString() + '-' +
              date.getUTCFullYear().toString();

    if (!(key in messages)) { messages[key] = {}; }
    if (!(message.phone_number in messages[key])) {
        messages[key][message.phone_number] = {
            messages: []
        };
    }

    messages[key][message.phone_number].messages.push({
        'text': message.message_text,
        'incoming': message.type === 10
    });
}

function fetchTopN(num, month, year, data) {
    var messagesForMonth, sortedByCount, topN;

    messagesForMonth = data[month + '-' + year];
    if (!messagesForMonth) { return; }

    sortedByCount = _.sortBy(_.keys(messagesForMonth), function(number) {
        return messagesForMonth[number].messages.length;
    });

    topN = sortedByCount.slice(num * -1);
    _.each(topN, function(number) {
        console.log(number + ': ' + messagesForMonth[number].messages.length +
                    ' messages');
    });
}

function processMessageForStackedGraph(message) {
    var date = new Date(message.start_time);
    var month = date.getUTCFullYear() + ' ' + date.getUTCMonth();

    if (!(message.phone_number in messages2)) { messages2[message.phone_number] = {}; }
    if (!(month in messages2[message.phone_number])) {
        messages2[message.phone_number][month] = 0;
    }
    messages2[message.phone_number][month] += 1;
}

function processMessages(data) {
    var responseBucket = data.conversations_response.conversationgroup;
    _.each(responseBucket, function(group) {
        _.each(group.call, processMessageForTopN);
        _.each(group.call, processMessageForStackedGraph);
    });

    fs.writeFile('processed.json', JSON.stringify(messages, null, '\t'), null);
    fs.writeFile('processedForStackedGraph.json', JSON.stringify(messages2, null, '\t'), null);
    for (var i = 0; i < 12; i++) {
        console.log('Top 5 for ' + (i+1) + '-2012:');
        fetchTopN(5, i, 2012, messages);
     }

     for (i = 0; i < 12; i++) {
        console.log('Top 5 for ' + (i+1) + '-2013:');
        fetchTopN(5, i, 2013, messages);
    }

    var values = [];
    _.each(messages2, function(counts, number) {
        var value = { 'number': number, 'values': [] };
        _.each(counts, function(count, date) {
            value.values.push({ 'x': date, 'y': count});
        });

        values.push(value);
    });
    fs.writeFile('processedForStackedGraph.json', JSON.stringify(values, null, '\t'), null);
}

function getMessagesFromAPI(callback) {
    var keys, gv, apiData;

    keys = require('keys.js');
    gv = new voicejs.Client(keys);

    gv.get('sms', {start:1, limit: 50}, function(err, response, data) {
        if (err) { return console.log(err); }
        apiData = JSON.stringify(data, null, '\t');
        fs.writeFile('data.json', apiData, null);
        callback(data);
    });
}

function getContactsFromAPI(callback) {
    var keys, gv, apiData;

    keys = require('keys.js');
    gv = new voicejs.Client(keys);

    gv.get('contacts', {start:1, limit: 50}, function(err, response, data) {
    });
}

if (process.argv[2] === 'api') { getMessagesFromAPI(processMessages); }
else if (process.argv[2] === 'cache') { processMessages(require('./data.json')); }
