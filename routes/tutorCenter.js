var fs = require('fs');
var path = require('path');
var express = require('express');
var async = require('async');
var crypto = require('crypto');


var redirectBase = 'http://localhost:3000/tutorCenter';

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
                console.error("an error occurred rendering the tutor center selector page: ", {
                    err: err
                });
                res.status(500).send({error: 'Something failed!'});
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
                    cb(err, result);
                });
            },
            requests: function (cb) {
                opts.dbHelper.getCenterReqests(center, function (err, result) {
                    cb(err, result);
                });
            },
            tutors: function (cb) {
                opts.dbHelper.getCenterTutors(center, function (err, result) {
                    cb(err, result);
                });
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
            if(err){
                console.error("an error occurred rendering the tutoring center after a GET request: ", {
                    err: err,
                    center: center
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            res.render('tutorCenter', result);
        });
    });

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
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');

            opts.centerSockets[centerNoSpace].broadcast.emit('getStudents');
            opts.centerSockets[centerNoSpace].emit('getStudents');
        });

        res.redirect(redirectBase + '/' + center);
    });

    router.post('/REST/studentSignOut', function (req, res, next){
        var center = req.body.center;
        var studentId = req.body.studentId;
        console.log("request to sign out student: " + studentId);
        opts.dbHelper.logoutStudent(studentId, center, function(err){
            if(err){
                console.error("an error occurred logging a student out. info: ", {
                    err: err,
                    studentId:studentId,
                    center: center
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');
            opts.centerSockets[centerNoSpace].broadcast.emit('getStudents');
            opts.centerSockets[centerNoSpace].emit('getStudents');
        });
    });

    router.get('/REST/getStudents', function (req, res, next) {
        var center = req.query.center;
        opts.dbHelper.getCenterStudents(center, function(err, result){
            if(err){
                console.error("an error occurred getting the students of a center:", {
                    err:err,
                    center: center
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            res.send({students:result});
        });
    });

    router.get('/REST/getRequests', function (req, res, next) {
        var center = req.query.center;
        opts.dbHelper.getCenterReqests(center, function(err, result){
            if(err){
                console.error("an error occurred getting the requests of a center:", {
                    err:err,
                    center: center
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            res.send({requests:result});
        });
    });

    router.post('/:center', function (req, res, next) {
        var center = req.body.center;
        var userId = req.body.tutorId;
        var pass = req.body.tutorPassword;
        var passHash = crypto.createHash('sha1').update(pass).digest("hex");
        opts.dbHelper.validPasswordCheck(userId, passHash, function(err1, isValidPassword){
            if(err1){
                console.error("an error occurred checking a tutor password:", {
                    err:err1,
                    userId: userId,
                    center: center
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }

            if(isValidPassword) {
                opts.dbHelper.loginTutor(userId, center, function (err2) {
                    if (err2) {
                        console.error("an error occurred logging a tutor in. info: ", {
                            err: err2,
                            userId: userId,
                            center: center
                        });
                        res.status(500).send({error: 'Something failed!'});
                        return;
                    }
                    var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');

                    opts.centerSockets[centerNoSpace].broadcast.emit('getTutors');
                    opts.centerSockets[centerNoSpace].emit('getTutors');
                    res.redirect(redirectBase + '/' + center);
                });
            }else{
                rerenderPage(isValidPassword);
            }
        });


        function rerenderPage(isValidPassword){
            async.parallel({
                students: function (cb) {
                    opts.dbHelper.getCenterStudents(center, function (err, result) {
                        // console.log("srudents from db: ");
                        // console.log(result);
                        cb(err, result);
                    });
                },
                requests: function (cb) {
                    opts.dbHelper.getCenterReqests(center, function (err, result) {
                        cb(err, result);
                    });
                },
                tutors: function (cb) {
                    opts.dbHelper.getCenterTutors(center, function (err, result) {
                        cb(err, result);
                    });
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
                },
                showTutorError: function(cb){
                    cb(null, !isValidPassword);
                }
            }, function (err, result) {
                if(err){
                    console.error("an error occurred rendering the tutoring center after a POST request: ", {
                        err: err,
                        userId: userId,
                        center: center
                    });
                    res.status(500).send({error: 'Something failed!'});
                    return;
                }
                res.render('tutorCenter', result);
            });
        }
    });

    router.post('/REST/tutorSignOut', function (req, res, next){
        var center = req.body.center;
        var userId = req.body.userId;
        opts.dbHelper.logoutTutor(userId, center, function(err){
            if(err){
                console.error("an error occurred logging a tutor out. info: ", {
                    err: err,
                    userId:userId,
                    center: center
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');
            opts.centerSockets[centerNoSpace].broadcast.emit('getTutors');
            opts.centerSockets[centerNoSpace].emit('getTutors');
        });
    });

    router.get('/REST/getTutors', function (req, res, next) {
        var center = req.query.center;
        opts.dbHelper.getCenterTutors(center, function(err, result){
            if(err){
                console.error("An error occurred getting the tutors of a center",{
                    error: err,
                    center:center
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            res.send({tutors:result});
        });
    });

    router.get('/REST/userExists', function (req, res, next){
        var studentId = req.query.studentId;
        console.log("request to see if " + studentId + " exists");
        opts.dbHelper.existingUserCheck(studentId, function(err, doesExist){
            if(err){
                console.error("An error occurred checking if a user exists",{
                    error: err,
                    studentId:studentId
                });
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
                console.error("An error occurred getting the classes of a student",{
                    error: err,
                    studentId:studentId
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            res.send({classes: classes});
        });
    });

    router.get('/REST/changeLocation', function (req, res, next){
        var center = req.query.center;
        var studentId = req.query.studentId;
        var newLocId = req.query.locationId;
        opts.dbHelper.updateStudentLocation(studentId, newLocId, center, function(err){
            if(err){
                console.error("An error occurred changing the location of a student",{
                    error: err,
                    center:center,
                    studentId:studentId,
                    newLocId:newLocId
                });
                res.status(500).send({error: 'Something failed!'});
            }
            var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');
            opts.centerSockets[centerNoSpace].broadcast.emit('getStudents');
            opts.centerSockets[centerNoSpace].emit('getStudents');
        });
    });

    router.get('/REST/changeCourse', function (req, res, next){
        var center = req.query.center;
        var studentId = req.query.studentId;
        var courseId = req.query.courseId;
        opts.dbHelper.updateStudentCourse(studentId, courseId, center, function(err){
            if(err){
                console.error("An error occurred changing the course of a student",{
                    error: err,
                    center:center,
                    studentId:studentId,
                    courseId:courseId
                });
                res.status(500).send({error: 'Something failed!'});
            }
            var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');
            opts.centerSockets[centerNoSpace].broadcast.emit('getStudents');
            opts.centerSockets[centerNoSpace].emit('getStudents');
        });
    });

    router.get('/REST/requestTutor', function (req, res, next){
        var center = req.query.center;
        var studentId = req.query.studentId;
        var tutorId = req.query.tutorId;
        opts.dbHelper.addTutoringRequest(studentId, tutorId, center, function(err){
            if(err){
                console.error("An error occurred processing a request for a tutor",{
                    error: err,
                    center:center,
                    studentId:studentId,
                    tutorId:tutorId
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');
            opts.centerSockets[centerNoSpace].broadcast.emit('getRequests');
            opts.centerSockets[centerNoSpace].emit('getRequests');
        });
    });

    router.get('/REST/deleteRequest', function (req, res, next){
        var center = req.query.center;
        var requestId = req.query.requestId;
        opts.dbHelper.removeTutoringRequest(requestId, center, function(err){
            if(err){
                console.error("An error occurred removing a request for a tutor",{
                    error: err,
                    center:center,
                    requestId:requestId
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');
            opts.centerSockets[centerNoSpace].broadcast.emit('getRequests');
            opts.centerSockets[centerNoSpace].emit('getRequests');
        });
    });

    router.get('/REST/updateRequest', function (req, res, next){
        var center = req.query.center;
        var tutorId = req.query.tutorId;
        var requestId = req.query.requestId;
        console.log("update request info", {
            center:center,
            tutorId:tutorId,
            requestId:requestId
        });
        opts.dbHelper.updateTutoringRequest(requestId, tutorId, center, function(err){
            if(err){
                console.error("An error occurred removing a request for a tutor",{
                    error: err,
                    center:center,
                    tutorId:tutorId,
                    requestId:requestId
                });
                res.status(500).send({error: 'Something failed!'});
                return;
            }
            var centerNoSpace = center.replace(new RegExp(' ', 'g'), '');
            opts.centerSockets[centerNoSpace].broadcast.emit('getRequests');
            opts.centerSockets[centerNoSpace].emit('getRequests');
        });
    });

    return router;
}


module.exports = createTutorCenterRouter;
