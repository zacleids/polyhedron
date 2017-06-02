var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var crypto = require('crypto');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
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

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.

passport.use(new Strategy({
        usernameField: 'adminID',
        passwordField: 'adminPass',
        passReqToCallback: true,
        session: false
    },
    function(req, username, password, cb) {
        console.log("in passport.use function", {
            username:username,
            password:password,
            user:req.user
        });
        var passHash = crypto.createHash('sha1').update(password).digest("hex");
        opts.dbHelper.validAdminCheck(username, passHash, function(err, isValidPassword) {
            if (err) {
                return cb(err);
            }
            if (!isValidPassword) {
                return cb(null, false);
            }
            var user = {
                username: username,
                password: password
            };
            return cb(null, user);
        });
    }
));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.

passport.serializeUser(function(user, cb) {
    console.log("in passport.serializeUser function", {user:user});
    cb(null, user.username);
});

passport.deserializeUser(function(id, cb) {
    console.log("in passport.deserializeUser function", {id:id});
    opts.dbHelper.existingUserCheck(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

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
