//my modules
var async = require('async');
var moment = require('moment');
var bodyParser = require('body-parser');
var google = require('googleapis');
var googleSheets = require('google-spreadsheet');
var VerEx = require('verbal-expressions');


//auth files
var tokens = require('./private/tokens.json');
const keys = require('./private/transactionParserServiceAccountKeys.json');

var doc2 = new googleSheets(tokens.googleSheet2Token);
var sheet2;
var months = {
    'JAN': 0,
    'FEB': 1,
    'MAR': 2,
    'APR': 3,
    'MAY': 4,
    'JUN': 5,
    'JUL': 6,
    'AUG': 7,
    'SEP': 8,
    'OCT': 9,
    'NOV': 10,
    'DEC': 11
}

function filterComparison(txn) {
    var date = new Date();
    var key = process.argv[4];
    var firstDay = new Date(date.getFullYear(), months[key.toUpperCase()], 1);
    var lastDay = new Date(date.getFullYear(), months[key.toUpperCase()] + 1, 0);
    var txnDate = new Date(txn.date.split('at')[0]);
    return (txnDate >= firstDay && txnDate <= lastDay);
}

var inserter = {
    insertIntoDestinationSheet: function(transactionObjectArray) {
        if (!process.argv[4]) {
            throw new Error("You didn't set a month!");
        } else if (!months[process.argv[4].toUpperCase()]) {
            throw new Error("You didn't set a VALID month!");
        }

        console.log("MONTH INPUT:" + months[process.argv[4].toUpperCase()]); //log

        //filter out old transactions
        var thisMonthsTransactions = transactionObjectArray.filter(filterComparison);
        thisMonthsTransactions.forEach(function(tran) {
            tran.date = new Date(tran.date.split('at')[0]).toLocaleDateString();
        });
        async.series([
            function setAuthTwo(step) {
                var creds_json = {
                    client_email: keys.client_email,
                    private_key: keys.private_key
                }

                doc2.useServiceAccountAuth(creds_json, step);
            },
            function getInfoAndWorksheets(step) {

                doc2.getInfo(function(err, info) {
                    console.log('Loaded doc: ' + info.title + ' by ' + info.author.email); //log
                    sheet2 = info.worksheets[0];
                    console.log('Doc 2 Sheet 1: ' + sheet2.title + ' ' + sheet2.rowCount + 'x' + sheet2.colCount); //log
                    step();
                });
            },
            function workingWithCells(step) {
                sheet2.getRows({
                    offset: 1,
                    limit: 2000,
                    orderby: 'col2'
                }, function(err, rows) {
                    for (var i = 0; i < thisMonthsTransactions.length; i++) {
                        console.log('Row ' + i + ', Vendor: ' + thisMonthsTransactions[i].vendor + ', ' + thisMonthsTransactions[i].amount + ' on ' + thisMonthsTransactions[i].date); //log
                        rows[i].vendor = thisMonthsTransactions[i].vendor;
                        var amt = thisMonthsTransactions[i].amount.split('$')[1];
                        rows[i].debitamount = amt;
                        rows[i].debitdate = thisMonthsTransactions[i].date;
                        rows[i].save();
                    }
                    step();
                });
            }
        ]);
    }
}


module.exports = inserter;
