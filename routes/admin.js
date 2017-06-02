var express = require('express');
var path = require('path');
var fs = require('fs');
var async = require('async');
var excelBuilder = require('msexcel-builder');
var ExcelWorkbookGenerator = require('../excelGenerator.js');
var crypto = require('crypto');
var passport = require('passport');


var redirectBase = 'http://localhost:3000/admin';

function request(name, course, location, waitTime, request, tutor) {
    this.name = name || '';
    this.course = course || '';
    this.location = location || '';
    this.waitTime = waitTime + " mins" || "0 mins";
    this.request = request || '';
    this.tutor = tutor || '';
}

function makeRequest(line) {
    var parts = line.split(',');
    return new request(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]);
}

function createAdminRouter(opts) {
    var router = express.Router();

    // router.use(passport.initialize());
    // router.use(passport.session());
    // Configure the local strategy for use by Passport.
    //
    // The local strategy require a `verify` function which receives the credentials
    // (`username` and `password`) submitted by the user.  The function must verify
    // that the password is correct and then invoke `cb` with a user object, which
    // will be set at `req.user` in route handlers after authentication.

    /*passport.use(new Strategy({
            usernameField: 'adminID',
            passwordField: 'adminPass',
            passReqToCallback: true,
            session: false
        },
        function(req, username, password, cb) {
            // console.log("in passport.use function", {
            //     username:username,
            //     password:password,
            //     user:req.user
            // });
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
    ));*/


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
/*    passport.serializeUser(function(user, cb) {
        // console.log("in passport.serializeUser function", {user:user});
        cb(null, user.username);
    });

    passport.deserializeUser(function(id, cb) {
        // console.log("in passport.deserializeUser function", {id:id});
        opts.dbHelper.existingUserCheck(id, function (err, user) {
            if (err) { return cb(err); }
            cb(null, user);
        });
    });*/


    
    router.get('/', function (req, res, next) {
        // console.log("in admin / GET method", {user:req.user});
        res.render('admin/admin', {
            title: 'Admin',
            user: req.user
        });
    });

    router.get('/*', function (req, res, next) {
        // console.log("in admin /* GET method", {user:req.user});
        //next();
        if(req.user){
            next();
            return;
        }
        res.redirect(redirectBase);
    });

    router.post('/*', function (req, res, next) {
        //console.log("in admin /* POST method", {user:req.user});
        if(req.originalUrl === '/admin' || req.user){
            next();
            return;
        }
        res.redirect(redirectBase);
    });

    router.post('/', passport.authenticate('local', { failureRedirect: redirectBase,  successRedirect: redirectBase + '/options'}), function (req, res, next) {
        //console.log("in admin / POST method");
    });

    router.get('/logout', function(req, res){
        req.logout();
        res.redirect(req.headers.referer);
    });

    // *************** reports page ***************

    router.get('/reports', function (req, res, next) {
        fs.readdir(path.join(__dirname, '..', 'fakeData', 'excelGeneration'), function(err, files){
            if (err) {
                console.log('An unknown error occurred: ', err);
                return;
            }
            finalFiles = [];
            files.forEach(function(file){
                if(path.extname(file) === '.xlsx'){
                    finalFiles.push(file);
                }
            });
            res.render('admin/reports', {
                title: 'Reports',
                centerLocation: opts.centerLocation,
                files: finalFiles,
                user: req.user
            });
        });
    });

    router.post('/generateReport', function (req, res, next) {
        var date = new Date();
        var dateString = (date.getMonth()+1)  + "-" + date.getDate() + "-" + date.getFullYear() + "T" +
            date.getHours() + "-" + date.getMinutes() + '-' + date.getSeconds();
        var newFile = 'sample-' + dateString + '.xlsx';
        var workbook = excelBuilder.createWorkbook(path.join(__dirname, '..', 'fakeData', 'excelGeneration'), newFile);

        var sheet1 = workbook.createSheet('sheet1', 100, 100);
        sheet1.set(1, 1, 'Name');
        sheet1.set(2, 1, 'Course');
        var studentFile = path.join(__dirname, '..', 'fakeData', 'students.txt');
        fs.readFile(studentFile, transformData);

        function transformData(err, data) {
            if (err) {
                console.log('An unknown error occurred: ', err);
                return;
            }
            var lines = data.toString().split('\n');
            for(var i = 0; i < lines.length; i++){
                var line = lines[i];
                var parts = line.split(',');
                for(var j = 0; j < parts.length; j++){
                    sheet1.set(j+1, i+2, parts[j]);
                }

            }
            workbook.save(function(ok){
                var file = path.join(__dirname, '..', 'fakeData', 'excelGeneration', newFile);
                fs.access(file, function(err){
                    if(err){
                        console.log('file was not created: ', err);
                        return;
                    }
                    res.download(file, newFile);
                });
            });
        }
    });

    router.post('/downloadReport', function (req, res, next) {
        var fileSelector = req.body.fileSelector;
        var useSavedReportCheckbox = !!req.body.useSavedReportCheckbox;
        var name = req.body.inputFilename;
        var file;
        if(useSavedReportCheckbox){
            file = path.join(__dirname, '..', 'fakeData', 'excelGeneration', fileSelector);
            sendFile(file);
        }
        else{
            var excelGenerator = new ExcelWorkbookGenerator({
                name: name,
                textFile: path.join(__dirname, '..', 'fakeData', 'students.txt')
            });
            excelGenerator.generate(function(err, file){
                if(err){
                    console.log('an error occurred generating the excel workbook: ', err);
                    return;
                }
                sendFile(file);
            });
        }

        function sendFile(file){
            fs.access(file, function(err){
                if(err){
                    console.log('file not there: ', err);
                    return;
                }
                res.download(file, path.basename(file));
            });
        }

    });

    // *************** configurations page ***************

    router.get('/options', function (req, res, next) {
        var centers = Object.keys(opts.tutorCenters);
        centers.sort();
        var center = centers[0];
        res.render('admin/options', {
            title: 'Options',
            centers: centers,
            tutorTable: opts.tutorCenters[center].tutorTable,
            requestsTable: opts.tutorCenters[center].requestsTable,
            scrollingText: opts.tutorCenters[center].scrollingText,
            user: req.user
        });
    });

    router.post('/options', function (req, res, next) {
        var center = req.body.centerSelector;
        opts.tutorCenters[center].requestsTable = !!req.body.requestsTable;
        opts.tutorCenters[center].tutorTable = !!req.body.tutorTable;
        opts.tutorCenters[center].scrollingText.enabled = !!req.body.scrollingText;
        if(!!req.body.scrollingText){
            opts.tutorCenters[center].scrollingText.text = req.body.message;
        }
        var centers = Object.keys(opts.tutorCenters);
        centers.sort();

        var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');
        if(opts.centerSockets[centerNoSpace]){
            opts.centerSockets[centerNoSpace].broadcast.emit('reload');
            opts.centerSockets[centerNoSpace].emit('reload');
        }

        res.render('admin/options', {
            title: 'Options',
            centers: centers,
            curCenter: center,
            tutorTable: opts.tutorCenters[center].tutorTable,
            requestsTable: opts.tutorCenters[center].requestsTable,
            scrollingText: opts.tutorCenters[center].scrollingText,
            done: true,
            user: req.user
        });
    });

    router.get('/getCenterInfo', function (req, res, next) {
        var center = req.query.center;

        res.send({
            requestsTable: opts.tutorCenters[center].requestsTable,
            tutorTable: opts.tutorCenters[center].tutorTable,
            scrollingText: opts.tutorCenters[center].scrollingText
        });
    });

    // *************** statistics page ***************

    router.get('/statistics', function (req, res, next) {
        async.parallel({
            classWithOccurrences: function (cb) {
                var classWithOccurrences = {};
                var file = path.join(__dirname, '..', 'fakeData', 'students.txt');
                fs.readFile(file, renderResponse);

                function renderResponse(err, data) {
                    if (err) {
                        console.log('An unknown error occurred: ', err);
                        cb(err, null);
                    }

                    // finding the number of occurrences of each class.
                    // normally this would be done in an SQL query.

                    var lines = data.toString().split('\n');
                    var distinctClasses = [];
                    var courseName = '';
                    var len = lines.length;

                    for(var i = 0; i < len; i++) {
                        courseName = lines[i].split(',')[1];
                        if (!distinctClasses.indexOf(courseName) > -1) {
                            distinctClasses.push(courseName);
                        }
                    }

                    for(i = 0; i < distinctClasses.length; i++) {
                        classWithOccurrences[distinctClasses[i]] = 0;
                    }

                    for(i = 0; i < len; i++) {
                        courseName = lines[i].split(',')[1];
                        classWithOccurrences[courseName]++;
                    }
                    cb(null, classWithOccurrences);
                }
            },
            title: function(cb){
                cb(null, 'Statistics');
            },
            numTutorsInCenter: function (cb) {
                var tutors = [];
                var file = path.join(__dirname, '..', 'fakeData', 'tutors.txt');
                fs.readFile(file, readtutorsData);

                function readtutorsData(err, data) {
                    if (err) {
                        console.log('An unknown error occurred: ', err);
                        cb(err, null);
                    }

                    var lines = data.toString().split('\n');
                    cb(null, lines.length);
                }
            },
            numTutorsTutoring: function (cb) {
                var requests = [];
                var file = path.join(__dirname, '..', 'fakeData', 'requests.txt');
                fs.readFile(file, readrequestsData);

                function readrequestsData(err, data) {
                    if (err) {
                        console.log('An unknown error occurred: ', err);
                        cb(err, null);
                    }

                    var lines = data.toString().split('\n');
                    lines.forEach(function (line) {
                        requests.push(makeRequest(line));
                    });
                    var numPeopleBeingTutored = 0;
                    requests.forEach(function(request){
                        if(request.tutor){
                            numPeopleBeingTutored++;
                        }
                    });
                    cb(null, numPeopleBeingTutored);
                }
            },
            centerLocation: function(cb) {
                cb(null, opts.centerLocation);
            }
        }, function (err, result) {
            result['user'] = req.user;
            res.render('admin/statistics', result);
        });

    });

    return router;
}

module.exports = createAdminRouter;
