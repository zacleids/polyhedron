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
        console.log(opts);
        opts.dbHelper.getTutorCenters(sendCenters);
        function sendCenters(err, centers) {
            if(err){
                console.error("Whoopsy daisy, something went wrong!" + err.message);
                return;
            }
            console.log(centers);
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
                var students = [];
                var file = path.join(__dirname, '..', 'fakeData', 'students.txt');
                fs.readFile(file, readStudentData);

                function readStudentData(err, data) {
                    if (err) {
                        console.log('An unknown error occurred: ', err);
                        cb(err, null);
                    }

                    var lines = data.toString().split('\n');
                    lines.forEach(function (line) {
                        students.push(makeStudent(line));
                    });
                    cb(null, students);
                }
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
            }
        }, function (err, result) {
            res.render('tutorCenter', result);
        });
    });

    return router;
}


module.exports = createTutorCenterRouter;
