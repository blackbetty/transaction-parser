var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

var routes = require('./routes/index');
var users = require('./routes/users');
var cronJob = require('cron').CronJob;
var moment = require('moment');
var tokens = require('./private/tokens.json');

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

//main functions
var doc1 = new GoogleSpreadsheet(JSON.stringify(tokens.googleSheet1Token));
var sheet1;

async.series([
    function setAuth(step) {
        // see notes below for authentication instructions!
        var creds = require('./private/transactionParserAppEngineKey.json');
        doc1.useServiceAccountAuth(creds, step);
    },
    function startCron(step) {
        console.log('HIT THE CRON');
        var stationInformationJob = new cronJob("*/20 * * * * *", function() {
                console.log('//////////////////////////////');
                var currentTime = moment().format('YYYY MMMM DD HH:mm:ss');
                console.log('data extract job STARTED at ' + currentTime);
                async.series([
                    function getInfoAndWorksheets(step) {
                        doc1.getInfo(function(err, info) {
                            console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
                            sheet = info.worksheets[0];
                            console.log('sheet 1: ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
                            cb();
                        });
                    }
                ]);










            },
            function() {
                /* this function  is run  when the is stopped*/
            },
            //start immediately
            true,
            //timezone
            'America/New_York');
    }
]);






















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

module.exports = app;
