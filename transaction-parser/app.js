var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var async = require('async');
var routes = require('./routes/index');
var users = require('./routes/users');


//my modules
var cronJob = require('cron').CronJob;
var moment = require('moment');
var bodyParser = require('body-parser');
var google = require('googleapis');
var googleSheets = require('google-spreadsheet');

//auth files
var tokens = require('./private/tokens.json');
const keys = require('./private/transactionParserServiceAccountKeys.json');

// Express default stuff
var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
//End Express Default Stuff
var doc1 = new googleSheets(tokens.googleSheet1Token);
var sheet;


var daily = new cronJob("*/20 * * * * *", function() {
        console.log('//////////////////////////////');
        var currentTime = moment().format('YYYY MMMM DD HH:mm:ss');
        console.log('Google API Auth Started:' + currentTime);
        async.series([
            function setAuth(step) {
                var creds_json = {
                    client_email: keys.client_email,
                    private_key: keys.private_key
                }

                doc1.useServiceAccountAuth(creds_json, step);
                console.log('hit');
            },
            function getInfoAndWorksheets(step) {
                doc1.getInfo(function(err, info) {
                    console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
                    sheet = info.worksheets[0];
                    console.log('sheet 1: ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
                    var lastParseTime = moment().format('YYYY MMMM DD HH:mm:ss');
                    step();
                });
            }
        ]);
    },
    function workingWithRows(step) {
        // google provides some query options
        sheet.getRows({
            offset: 1,
            limit: 20,
            orderby: 'col2'
        }, function(err, rows) {
            console.log('Read ' + rows.length + ' rows');

            // the row is an object with keys set by the column headers
            // rows[0].colname = 'new val';
            // rows[0].save(); // this is async

            // // deleting a row 
            // rows[0].del(); // this is async

            step();
        });
    },
    function() {
        /* this function  is run  when the is stopped*/
    },
    //start immediately
    true,
    //timezone
    'America/New_York');

module.exports = app;
