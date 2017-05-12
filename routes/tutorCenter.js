var fs = require('fs');
var path = require('path');
var express = require('express');
var async = require('async');


var redirectBase = 'http://localhost:3000/tutorCenter';

function student(name, course, location) {
    this.name = name || '';
    this.course = course || '';
    this.location = location || '';
}

function makeStudent(line) {
    var parts = line.split(',');
    return new student(parts[0], parts[1], parts[2]);
}

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

function tutor(name, loginTime) {
    this.name = name || '';
    this.loginTime = loginTime || '';
}

function makeTutor(line) {
    var parts = line.split(',');
    return new tutor(parts[0], parts[1]);
}

function createTutorCenterRouter(opts) {
    var router = express.Router();

    router.get('/', function (req, res, next) {
        opts.dbHelper.getTutorCenters(sendCenters);
        function sendCenters(err, centers) {
            if(err){
                console.error("Whoopsy daisy, something went wrong!" + err.message);
                return;
            }
            centers.sort();
            res.render('centerList', {
                tableLen: Math.ceil(Math.sqrt(centers.length)),
                centers: centers,
                redirectBase: redirectBase
            });
        }
    });

    router.get('/:center', function (req, res, next) {
        var center = req.params.center;
        if(!(center in opts.tutorCenters)){
            res.redirect(redirectBase);
            return;
        }
        async.parallel({
            students: function (cb) {
                opts.dbHelper.getCenterStudents(center, function (err, result) {
                    // console.log("srudents from db: ");
                    // console.log(result);
                    cb(err, result);
                });
            },
            requests: function (cb) {
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
                    cb(null, requests);
                }
            },
            tutors: function (cb) {
                var tutors = [];
                var file = path.join(__dirname, '..', 'fakeData', 'tutors.txt');
                fs.readFile(file, readtutorsData);

                function readtutorsData(err, data) {
                    if (err) {
                        console.log('An unknown error occurred: ', err);
                        cb(err, null);
                    }

                    var lines = data.toString().split('\n');
                    lines.forEach(function (line) {
                        tutors.push(makeTutor(line));
                    });
                    cb(null, tutors);
                }
            },
            requestsTable: function (cb) {
                cb(null, opts.tutorCenters[center].requestsTable);
            },
            tutorTable: function (cb) {
                cb(null, opts.tutorCenters[center].tutorTable);
            },
            scrollingText: function(cb) {
                cb(null, opts.tutorCenters[center].scrollingText);
            },
            centerLocation: function(cb) {
                cb(null, opts.tutorCenters[center].centerLocation);
            },
            locations: function (cb) {
                cb(null, opts.tutorCenters[center].locations);
            }
        }, function (err, result) {
            res.render('tutorCenter', result);
        });
    });

    // getting date and time of student sign in
    function getDateTime() {
        var currentdate = new Date();
        var datetime = "Sign in time: " + (currentdate.getMonth() + 1) + "-"
            + currentdate.getDate() + "-"
            + currentdate.getFullYear() + " @ "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();
        return datetime;
    }

    router.post('/REST/studentSignIn', function (req, res, next) {
        var center = req.body.center;
        var studentId = req.body.studentId;
        var locationId = req.body.selectLocation;
        var subjectId = req.body.selectSubject;
        opts.dbHelper.loginStudent(studentId, subjectId, locationId, center, function(err){
            if(err){
                console.error("an error occurred logging a student in. info: ", {
                    err: err,
                    studentId:studentId,
                    subjectId:subjectId,
                    locationId: locationId,
                    center: center
                })
            }
        });
        var datetime = getDateTime();
        console.log(datetime);
        var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');

        opts.centerSockets[centerNoSpace].broadcast.emit('getStudents');
        opts.centerSockets[centerNoSpace].emit('getStudents');
        res.status(200)
        //res.redirect(redirectBase + '/' + center);
    });

    router.get('/REST/getStudents', function (req, res, next) {
        var center = req.query.center;
        opts.dbHelper.getCenterStudents(center, function(err, result){
            if(err){
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            res.send({students:result});
        });
    });

    router.get('/REST/getRequests', function (req, res, next) {
        var requests = [];
        var file = path.join(__dirname, '..', 'fakeData', 'requests.txt');
        fs.readFile(file, readRequestData);

        function readRequestData(err, data) {
            if (err) {
                console.log('An unknown error occurred: ', err);
                return;
            }

            var lines = data.toString().split('\n');
            lines.forEach(function (line) {
                requests.push(makeRequest(line));
            });

            res.send({requests:requests});
        }
    });

    router.get('/REST/getTutors', function (req, res, next) {
        var tutors = [];
        var file = path.join(__dirname, '..', 'fakeData', 'tutors.txt');
        fs.readFile(file, readTutorsData);

        function readTutorsData(err, data) {
            if (err) {
                console.log('An unknown error occurred: ', err);
                return;
            }

            var lines = data.toString().split('\n');
            lines.forEach(function (line) {
                tutors.push(makeTutor(line));
            });

            res.send({tutors:tutors});
        }
    });

    router.get('/REST/userExists', function (req, res, next){
        var center = req.query.center;
        var studentId = req.query.studentId;
        console.log("request to see if " + studentId + " exists");
        opts.dbHelper.existingUserCheck(studentId, function(err, doesExist){
            if(err){
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            res.send({exists: doesExist});
        });
    });

    router.get('/REST/getClasses', function (req, res, next){
        console.log("request for classes from " + req.query.studentId);
        var studentId = req.query.studentId;
        opts.dbHelper.getStudentsClassInfo(studentId, function(err, classes){
            if(err){
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            res.send({classes: classes});
        });
    });

    return router;
}


module.exports = createTutorCenterRouter;
