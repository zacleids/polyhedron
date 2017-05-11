var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var io = require('./socket/io');

var createIndexRouter = require('./routes/index');
var createTutorCenterRouter = require('./routes/tutorCenter');
var createAdminRouter = require('./routes/admin');

//var opts = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'options.json'), 'UTF-8'));
var opts = {tutorCenters:{}, centerSockets:{}};

var createDBconnection = require('./db/db');
var db = createDBconnection();
opts.db = db;
var DatabaseHelper = require('./db/dbHelper.js');
var dbHelper = new DatabaseHelper(opts);
opts.dbHelper = dbHelper;
dbHelper.getTutorCenters(function(err, centers){
    centers.sort();
    centers.forEach(function(center){
        dbHelper.getCenterLocations(center, function(err, locs){
            opts.tutorCenters[center] = {
                "centerLocation": center,
                "requestsTable": true,
                "tutorTable": true,
                "scrollingText": {
                    "enabled": true,
                    "text": "Welcome to " + center + ". Message of the day, announcements, center hours... etc."
                },
                "locations": locs
            };
        });

        var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');
        var temp = io.of('/' + centerNoSpace);
        temp.on('connection', function(socket){
            opts.centerSockets[centerNoSpace] = socket;
            console.log('Someone connected to the ' + centerNoSpace + ' socket.');
        });
    });
});

var index = createIndexRouter(opts);
var tutorCenter = createTutorCenterRouter(opts);
var admin = createAdminRouter(opts);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/tutorCenter', tutorCenter);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    // res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
