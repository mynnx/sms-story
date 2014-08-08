'use strict';

var voicejs = require('voice.js');
var fs = require('fs');
var _ = require('underscore');

/*
 * Takes a message and puts it into an index of
 *   <phone number> -> <month> -> <# messages>,
 *   populating messageIdx.
 *
 * @param {Object} message SMS message from voice.js
 * @param {Object} messageIdx Index of messages - initially {}, eventually
 *   {
 *     "<phone number>": { "<year>-<month>": <number-of-messages> },
 *     ...
 *   }
 */
function processMessage(message, messageIdx) {
  var date = new Date(message.start_time);
  var month = date.getUTCFullYear() + ' ' + date.getUTCMonth();

  if (!(message.phone_number in messageIdx)) {
    messageIdx[message.phone_number] = {};
  }
  if (!(month in messageIdx[message.phone_number])) {
    messageIdx[message.phone_number][month] = 0;
  }
  messageIdx[message.phone_number][month] += 1;
}

/*
 * Look up a number in the GV 'contacts' response.
 *
 * @param {string} number Phone number to look up
 * @param {Object} contacts Contacts object from voice.js
 * @return {string} the name for a given contact number
 */
function contactNameForNumber(number, contacts) {
  if (number in contacts.contactPhones) {
    if ('name' in contacts.contactPhones[number]) {
      return contacts.contactPhones[number].name;
    }
  }
}

/*
 * Takes a GV "inbox" response and turns it into a format ready for a
 * d3.layout.stack.
 *
 * @param {Object} sms SMS response from voice.js
 * @param {Object} contacts Contacts response from voice.js
 * @param {number} minYear Beginning year for data
 * @param {number} maxYear End year for data
 * @return {Object} Data for a d3.layout.stack, specifically:
 * {
 *   "number": <phone number>,
 *   "name": <contact name>,
 *   "values": [
 *     {"x": <year>-<month>",
 *      "y": <number of messages in that month>}
 *   ]
 * }
 *
 */
function processMessages(sms, contacts, minYear, maxYear) {
  // Flatten the data returned by GV, which is grouped by 'conversation'
  var responseBucket = sms.conversations_response.conversationgroup,
    messageIndex = {},
    values = [],
    sortedNumbers;

  _.each(responseBucket, function(group) {
    _.each(group.call, function(call) {
        processMessage(call, messageIndex);
    });
  });

  // Make a sorted list of phone numbers, ordered by the number of total
  // months we've been in touch with this person
  sortedNumbers = _.keys(messageIndex).sort(function (number1, number2) {
    return _.keys(messageIndex[number2]).length -
           _.keys(messageIndex[number1]).length;
  });

  // Remove numbers we've sent fewer than 5 messages to, to declutter
  sortedNumbers = sortedNumbers.filter(function (number) {
    var counts = _.values(messageIndex[number]),
        totalMessages = _.reduce(counts, function(sum, count) {
          return sum + count;
        });
    return totalMessages > 5;
  });

  _.each(sortedNumbers, function(number) {
    var counts = messageIndex[number],
        value = { 'number': number, 'values': [] };

    value.name = contactNameForNumber(number, contacts);
    // Iterate across all months (except the current one) and insert zeroes
    // for months where no contact was made (d3.layout.stack doesn't handle
    // missing data well)
    _.each(_.range(minYear, maxYear + 1), function(year) {
      var months = new Date().getUTCFullYear() === year ?
        new Date().getUTCMonth() + 1 : 12;

      _.each(_.range(months), function(month) {
        var date = year + " " + month,
            count = (date in counts) ? counts[date] : 0;
        value.values.push({ 'x': date, 'y': count});
      });
    });
    values.push(value);
  });
  return values;
}

/*
 * Executes callback with inbox data from the GV API.
 *
 * @param {Object} client Voice.js client
 * @param {function(string, Object)} callback to execute
 */
function getMessagesFromAPI(client, callback) {
  client.get('sms', {start:1, limit: Infinity}, function(err, response, data) {
    callback(err, data);
  });
}

/*
 * Executes callback with contacts data from the GV API.
 *
 * @param {Object} client Voice.js client
 * @param {function(string, Object)} callback Callback to execute
 */
function getContactsFromAPI(client, callback) {
  client.contacts('get', function(err, response, data) {
    callback(err, data);
  });
}

/*
 * Fetches SMS and contact data from the GV API.
 *
 * @param {Object} keys Google credentials to be passed to voice.js
 * @param {function(Object, Object)} callback Callback to execute
 */
function getData(keys, callback) {
  var client = new voicejs.Client(keys),
    smsData,
    contactsData;

  getMessagesFromAPI(client, function (err, smsData) {
    if (err) { return callback(err); }
    getContactsFromAPI(client, function (err, contactsData) {
      if (err) { return callback(err); }
      callback(null, smsData, contactsData);
    });
  });
}


module.exports = {
  'getData': getData,
  'processMessages': processMessages
};
