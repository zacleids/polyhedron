/**
 * Created by Sean Carpenter on 4/30/2017.
 */
var fs = require('fs');
var path = require('path');
var async = require('async');

function DatabaseHelper(opts) {
    this.db = opts.db;
}


//FUNCTIONS DEDICATED TO                            =======================================================================================================================================
//POPULATING THE TUTORING CENTERS BUTTONS ON        =======================================================================================================================================
//THE "TUTORING CENTERS" PAGE FOR ADMINISTRATORS    =======================================================================================================================================

DatabaseHelper.prototype.getTutorCenters = function getTutorCenters(cb) {
    var self = this;

    self.db.query("SELECT id, description FROM centers;", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var centerNames = [];
        console.log("getTutorCenters: " + JSON.stringify(results));
        results.forEach(function(result){
           centerNames.push(result.description);
        });
        cb(null, centerNames);
    });
};


//FUNCTIONS DEDICATED TO                        =======================================================================================================================================
//POPULATING THE SIGNED-IN STUDENTS LIST ON     =======================================================================================================================================
//THE FRONT-FACING TUTOR CENTER PAGES           =======================================================================================================================================

DatabaseHelper.prototype.getCenterStudents = function getCenterStudents(center, cb) {
    var self = this;
    var students = [];
    async.parallel({
        names: function (cb1) {
            self.getCenterStudentNames(center, function (err, result) {
                cb1(err, result);
            })
        },
        ids: function (cb1) {
            self.getCenterStudentIDs(center, function (err, result) {
                cb1(err, result);
            })
        },
        classes: function (cb1) {
            self.getCenterStudentClasses(center, function (err, result) {
                cb1(err, result);
            })
        },
        locations: function (cb1) {
            self.getCenterStudentLocations(center, function (err, result) {
                cb1(err, result);
            })
        }
    }, function (err, results) {
        console.log("getCenterStudents: " + JSON.stringify(results));
        for(var i = 0; i < results["names"].length; i++) {
            students.push({
                name: results["names"][i],
                id: results["ids"][i],
                course: results["classes"][i],
                location: results["locations"][i]
            });
        }
        cb(err, students);
        }
    );
};

DatabaseHelper.prototype.getCenterStudentNames = function getCenterStudentNames(center, cb) {
    var self = this;

    self.db.query("SELECT users.nickName FROM students, users, centers WHERE centers.description = \'"
        + center + "\' AND students.centerId = centers.id AND students.id = users.id;", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var studentNames = [];
        console.log("getCenterStudentNames: " + JSON.stringify(results));
        results.forEach(function(result) {
            studentNames.push(result.nickName);
        });
        cb(null, studentNames);
    });
};

DatabaseHelper.prototype.getCenterStudentIDs = function getCenterStudentIDs(center, cb) {
    var self = this;

    self.db.query("SELECT students.id FROM students, centers WHERE centers.id = students.centerId AND centers.description = \'"
        + center + "\';", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var studentIDs = [];
        console.log("getCenterStudentIDs: " + JSON.stringify(results));
        results.forEach(function(result) {
            studentIDs.push(result.id);
        });
        cb(null, studentIDs);
    });
};

DatabaseHelper.prototype.getCenterStudentClasses = function getCenterStudentClasses(center, cb) {
    var self = this;

    self.db.query("SELECT code FROM centers, students, registrations, classes, classTypes WHERE students.centerId = centers.id AND centers.description = \'" + center +
    "\' AND students.registrationId = registrations.id AND registrations.classId = classes.id AND classes.typeId = classTypes.id;", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var classNames = [];
        console.log("getCenterStudentClasses: " + JSON.stringify(results));
        results.forEach(function(result) {
            classNames.push(result.code);
        });
        cb(null, classNames);
    });
};

DatabaseHelper.prototype.getCenterStudentLocations = function getCenterStudentLocations(center, cb) {
    var self = this;

    self.db.query("SELECT locations.description FROM students, locations, centers WHERE students.locationId = locations.id AND students.centerId = centers.id AND centers.description = \'" + center +
        "\';", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var locations = [];
        console.log("getCenterStudentLocations: " + JSON.stringify(results));
        results.forEach(function(result) {
            locations.push(result.description);
        });
        cb(null, locations);
    });
};


//FUNCTIONS DEDICATED TO                        =======================================================================================================================================
//POPULATING THE ON-THE-CLOCK TUTORS LIST ON    =======================================================================================================================================
//THE FRONT-FACING TUTOR CENTER PAGES           =======================================================================================================================================

DatabaseHelper.prototype.getCenterTutors = function getCenterTutors(center, cb) {
    var self = this;

    self.db.query("SELECT users.nickName, tutors.loginTime, tutors.tutorId FROM tutors, users, centers WHERE tutors.tutorId = users.id AND tutors.centerId = centers.id AND centers.description = \'" + center + "\';", function (err, results){
       if(err) {
           cb(err, null);
       }
       var centerTutors = [];
       console.log("getCenterTutors: " + JSON.stringify(results));
       if(results) {
           for (var i = 0; i < results.length; i++) {
               centerTutors.push({
                   name: results[i].nickName,
                   loginTime: results[i].loginTime,
                   id: results[i].tutorId
               });
           }
       }
        cb(null, centerTutors);
    });
};


//FUNCTIONS DEDICATED TO                    =======================================================================================================================================
//POPULATING THE TUTORING REQUESTS LIST ON  =======================================================================================================================================
//THE FRONT-FACING TUTOR CENTER PAGES       =======================================================================================================================================

DatabaseHelper.prototype.getCenterReqests = function getCenterRequests(center, cb) {
    var self = this;
    var requests = [];
    async.parallel({
            requestedTutors: function (cb1) {
                self.getRequestedTutors(center, function (err, result) {
                    cb1(err, result);
                })
            },
            requestingStudents: function (cb1) {
                self.getRequestingStudents(center, function (err, result) {
                    cb1(err, result);
                })
            },
            requestedCourses: function (cb1) {
                self.getRequestedCourses(center, function (err, result) {
                    cb1(err, result);
                })
            },
            requestedLocations: function (cb1) {
                self.getRequestLocations(center, function (err, result) {
                    cb1(err, result);
                })
            },
            assignedTutors: function (cb1) {
                self.getAssignedTutors(center, function (err, result) {
                    cb1(err, result);
                })
            },
            requestTimes: function (cb1) {
                self.getRequestTime(center, function (err, result) {
                    cb1(err, result);
                })
            },
            requestIDs: function (cb1) {
                self.getRequestID(center, function (err, result) {
                    cb1(err, result);
                })
            }
        }, function (err, results) {
            console.log("getCenterStudents: " + JSON.stringify(results));
            for(var i = 0; i < results["requestedTutors"].length; i++) {
                requests.push({
                    requestedTutor: results["requestedTutors"][i],
                    requestingStudent: results["requestingStudents"][i],
                    requestedCourse: results["requestedCourses"][i],
                    requestedLocation: results["requestedLocations"][i],
                    assignedTutor: results["assignedTutors"][i],
                    requestTime: results["requestTimes"][i],
                    id: results["requestIDs"][i]
                });
            }
            cb(err, requests);
        }
    );
};


DatabaseHelper.prototype.getRequestedTutors = function getRequestedTutors(center, cb) {
    var self = this;

    self.db.query("SELECT nickName FROM users, tutors, centers, tutoringRequests WHERE users.id = tutors.tutorId AND tutors.id = tutoringRequests.tutorRequestedId AND tutoringRequests.centerId = centers.id AND " +
    "centers.description = \'" + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
            return;
        }
        var tutorNames = [];
        console.log("getRequestedTutors: " + JSON.stringify(results));
        if(results) {
            results.forEach(function (result) {
                tutorNames.push(result.nickName);
            });
        }
        cb(null, tutorNames);
    });
};

DatabaseHelper.prototype.getRequestingStudents = function getRequestingStudents(center, cb) {
    var self = this;

    self.db.query("SELECT nickName FROM users, tutoringRequests, centers WHERE users.id = tutoringRequests.studentId AND tutoringRequests.centerId = centers.id AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
            console.error(err);
            return;
        }
        var studentNames = [];
        console.log("getRequestingStudents: " + JSON.stringify(results));
        if(results) {
            results.forEach(function (result) {
                studentNames.push(result.nickName);
            });
        }
        cb(null, studentNames);
    });
};

DatabaseHelper.prototype.getRequestedCourses = function getRequestedCourses(center, cb) {
    var self = this;

    self.db.query("SELECT code FROM students, tutoringRequests, centers, registrations, classes, classTypes WHERE students.id = tutoringRequests.studentId AND students.registrationId = registrations.id  " +
        " AND registrations.classId = classes.id AND classes.typeId = classTypes.id AND tutoringRequests.centerId = centers.id AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
            console.error(err);
            return;
        }
        var courses = [];
        console.log("getRequestedCourses: " + JSON.stringify(results));
        if(results) {
            results.forEach(function (result) {
                courses.push(result.code);
            });
        }
        cb(null, courses);
    });
};

DatabaseHelper.prototype.getRequestLocations = function getRequestLocations(center, cb) {
    var self = this;

    self.db.query("SELECT locations.description FROM students, locations, centers, tutoringRequests WHERE tutoringRequests.studentId = students.id AND students.locationId = locations.id AND "
    + "students.centerId = centers.id AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
            console.error(err);
            return;
        }
        var locations = [];
        console.log("getRequestLocations: " + JSON.stringify(results));
        if(results) {
            results.forEach(function (result) {
                locations.push(result.description);
            });
        }
        cb(null, locations);
    });
};

DatabaseHelper.prototype.getAssignedTutors = function getAssignedTutors(center, cb) {
    var self = this;

    self.db.query("SELECT nickName FROM users, tutors, tutoringRequests, centers WHERE users.id = tutors.tutorId AND tutors.id = tutoringRequests.tutorAssignedId AND tutoringRequests.centerId = centers.id AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
            console.error(err);
            return;
        }
        var tutorNames = [];
        console.log("getAssignedTutors" + JSON.stringify(results));
        if(results) {
            results.forEach(function (result) {
                tutorNames.push(result.nickName);
            });
        }
        cb(null, tutorNames);
    });
};

DatabaseHelper.prototype.getRequestTime = function getRequestTime(center, cb) {
    var self = this;

    self.db.query("SELECT requestTime FROM tutoringRequests, centers WHERE tutoringRequests.centerId = centers.id AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
            console.error(err);
            return;
        }
        var requestTimes = [];
        console.log("getRequestTime: " + JSON.stringify(results));
        if(results) {
            results.forEach(function (result) {
                requestTimes.push(result.requestTime);
            });
        }
        cb(null, requestTimes);
    });
};

DatabaseHelper.prototype.getRequestID = function getRequestID(center, cb) {
    var self = this;

    self.db.query("SELECT tutoringRequests.id FROM tutoringRequests, centers WHERE tutoringRequests.centerId = centers.id AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
            console.error(err);
            return;
        }
        var requestIDs = [];
        console.log("getRequestTime: " + JSON.stringify(results));
        if(results) {
            results.forEach(function (result) {
                requestIDs.push(result.id);
            });
        }
        cb(null, requestIDs);
    });
};


//FUNCTIONS DEDICATED TO                =======================================================================================================================================
//UPDATING THE SIGN-IN FORM FOR         =======================================================================================================================================
//A STUDENT SIGNING INTO ON             =======================================================================================================================================
//THE FRONT-FACING TUTOR CENTER PAGES   =======================================================================================================================================

DatabaseHelper.prototype.getStudentsClassInfo = function getStudentsClassInfo(studentID, cb) {
    var self = this;

    self.db.query("SELECT classTypes.code, registrations.id from registrations, classes, classTypes WHERE registrations.userId = \'" + studentID +
    "\' AND registrations.classId = classes.id AND classTypes.id = classes.typeId;", function (err, results) {
        if (err) {
            cb(err, null);
            return;
        }
        var studentClassInfo = [];
        console.log("getStudentsClassInfo: " + JSON.stringify(results));
        var classNames = [];
        results.forEach(function(result) {
            if(classNames.indexOf(result.code) === -1) {
                studentClassInfo.push({
                    name: result.code,
                    id: result.id
                });
                classNames.push(result.code)
            }
        });
        studentClassInfo.sort(function (a, b) {
            var ah = a.name;
            var bh = b.name;
            var reA = /[^a-zA-Z]/g;
            var reN = /[^0-9]/g;
            var aA = ah.replace(reA, '');
            var bA = bh.replace(reA, '');
            if (aA === bA) {
                var aN = parseInt(ah.replace(reN, ''), 10);
                var bN = parseInt(bh.replace(reN, ''), 10);
                return aN === bN ? 0 : aN > bN ? 1 : -1;
            } else {
                return aA > bA ? 1 : -1;
            }
        });

        cb(null, studentClassInfo);
    });
};

DatabaseHelper.prototype.getCenterLocations = function getCenterLocations(center, cb) {
    var self = this;

    self.db.query("SELECT locations.id, locations.description FROM locations, centers WHERE centers.description = \'" + center + "\' AND centers.id = locations.centerId;", function (err, results) {
        if (err) {
            cb(err, null);
            return;
        }
        var centerLocations = [];
        console.log("getCenterLocations: " + JSON.stringify(results));
        results.forEach(function(result) {
            centerLocations.push({
                id: result.id,
                name: result.description
            });
        });
        cb(null, centerLocations);
    });
};


//FUNCTIONS DEDICATED TO                                                            =======================================================================================================================================
//MODIFYING THE SIGNED-IN STUDENTS TABLE (login/logout) AND                         =======================================================================================================================================
//MODIFYING THE CLOCKED-IN TUTORS TABLE (login/logout) AND                          =======================================================================================================================================
//MODIFYING THE TUTORING REQUEST TABLE (request/accept request/cancel request) IN   =======================================================================================================================================
//THE BACK-END DATABASE                                                             =======================================================================================================================================

DatabaseHelper.prototype.loginStudent = function loginStudent(studentID, regID, locationID, center, cb) {
    var self = this;
    var centerID = 0;
    self.db.query("SELECT id FROM centers WHERE centers.description = \'" + center + "\';", function (err1, results) {
       if (err1) {
            cb(err1);
       }
       else {
           console.log("loginStudent: " + JSON.stringify(results));
           centerID = results[0].id;
           self.db.query("INSERT INTO students VALUES(" + parseInt(studentID) + ", " + parseInt(regID) + ", " + parseInt(locationID) + ", convert_tz(current_timestamp(), '+00:00', '-07:00'), convert_tz(current_timestamp(), '+00:00', '-07:00'), convert_tz(current_timestamp(), '+00:00', '-07:00'), null, " + parseInt(centerID) + ");", function (err2) {
               if (err2) {
                   cb(err2);
               }
               else {
                   self.db.query("INSERT INTO studentsLog VALUES(null, " + parseInt(regID) + ", " + parseInt(centerID) + ");", function (err3) {
                       if (err3) {
                           cb(err3);
                       }
                       else {
                           cb(null);
                       }
                   });
               }
           });
       }
    });
};

DatabaseHelper.prototype.logoutStudent = function logoutStudent(studentID, center, cb) {
    var self = this;
    var centerID = 0;
    self.db.query("SELECT id FROM centers WHERE centers.description = \'" + center + "\';", function (err1, results) {
        if (err1) {
            cb(err1);
        }
        else {
            console.log("logoutStudent: " + JSON.stringify(results));
            centerID = results[0].id;
            self.db.query("DELETE FROM students WHERE id = " + parseInt(studentID) + " AND centerId = " + parseInt(centerID) + ";", function (err2) {
                if (err2) {
                    cb(err2);
                }
                cb(null);
            });
        }
    });
};

DatabaseHelper.prototype.loginTutor = function loginTutor(studentID, center, cb) {
    var self = this;
    var centerID = 0;
    var requestable = 1;
    self.db.query("SELECT id FROM centers WHERE centers.description = \'" + center + "\';", function (err1, results) {
        if (err1) {
            cb(err1);
        }
        else {
            console.log(results);
            centerID = results[0].id;
            self.db.query("INSERT INTO tutors VALUES(null, " + parseInt(studentID) + ", " + parseInt(requestable) + ", convert_tz(current_timestamp(), '+00:00', '-07:00'), convert_tz(current_timestamp(), '+00:00', '-07:00'), " + centerID + ");", function (err2) {
                if (err2) {
                    cb(err2);
                }
                cb(null);
            });
        }
    });
};

DatabaseHelper.prototype.logoutTutor = function logoutTutor(studentID, center, cb) {
    var self = this;
    var centerID = 0;
    var loginTime;
    var id;
    self.db.query("SELECT id FROM centers WHERE centers.description = \'" + center + "\';", function (err1, results1) {
        if (err1) {
            cb(err1);
        }
        else {
            self.db.query("SELECT loginTime, id FROM tutors WHERE tutorId = \'" + studentID + "\';", function (err2, results2) {
                if (err2) {
                    cb(err2);
                }
                else {
                    console.log("logoutTutor: " + JSON.stringify(results2));
                    centerID = results1[0].id;
                    loginTime = results2[0].loginTime;
                    id = results2[0].id;
                    self.db.query("DELETE FROM tutors WHERE tutorId = " + parseInt(studentID) + " AND centerId = " + parseInt(centerID) + ";", function (err3) {
                        if (err3) {
                            cb(err3);
                        }
                        // else {
                        //     self.db.query("INSERT INTO tutorsLog VALUES(" + parseInt(id) + ", " + parseInt(studentID) + ", \'" + loginTime + "\', convert_tz(current_timestamp(), '+00:00', '-07:00'), " + parseInt(centerID) + ";", function (err4) {
                        //         if (err4) {
                        //             cb(err4);
                        //         }
                        //         cb(null);
                        //     });
                        // }
                        cb(null);
                    });
                }
            });
        }
    });
};

DatabaseHelper.prototype.addTutoringRequest = function addTutoringRequest(studentID, tutorID, center, cb) {
    var self = this;
    var centerID = 0;
    var refID = 0;
    self.db.query("SELECT id FROM centers WHERE centers.description = \'" + center + "\';", function (err1, results1) {
        if (err1) {
            cb(err1);
        }
        else {
            self.db.query("SELECT id FROM tutors WHERE tutorId = " + tutorID + ";", function (err2, results2) {
                if (err2) {
                    cb(err2);
                }
                else {
                    console.log(results2);
                    centerID = results1[0].id;
                    refID = results2[0].id;
                    self.db.query("INSERT INTO tutoringRequests VALUES(null, " + parseInt(studentID) + ", convert_tz(current_timestamp(), '+00:00', '-07:00'), null, null, " + refID + ", null, null, " + centerID + ");", function (err3) {
                        if (err3) {
                            cb(err3);
                        }
                        cb(null);
                    });
                }
            });
        }
    });
};

DatabaseHelper.prototype.updateTutoringRequest = function updateTutoringRequest(requestId, tutorID, center, cb) {
    var self = this;
    var centerID = 0;
    var refID = 0;
    self.db.query("SELECT id FROM centers WHERE centers.description = \'" + center + "\';", function (err1, results1) {
        if (err1) {
            cb(err1);
        }
        else {
            self.db.query("SELECT id FROM tutors WHERE tutorId = " + tutorID + ";", function (err2, results2) {
                if (err2) {
                    cb(err2);
                }
                else {
                    console.log(results2);
                    centerID = results1[0].id;
                    refID = results2[0].id;
                    self.db.query("UPDATE tutoringRequests SET assignedTutorId = " + refID + ", tutoringStarted = convert_tz(current_timestamp(), '+00:00', '-07:00') WHERE id = " + requestId + ");", function (err3) {
                        if (err3) {
                            cb(err3);
                        }
                        cb(null);
                    });
                }
            });
        }
    });
};

DatabaseHelper.prototype.removeTutoringRequest = function removeTutoringRequest(studentID, tutorID, center, cb) {
    var self = this;
    var centerID = 0;
    var refID = 0;
    self.db.query("SELECT id FROM centers WHERE centers.description = \'" + center + "\';", function (err1, results1) {
        if (err1) {
            cb(err1);
        }
        else {
            self.db.query("SELECT id FROM tutors WHERE tutorId = " + tutorID + ";", function (err2, results2) {
                if (err2) {
                    cb(err2);
                }
                else {
                    console.log(results2);
                    centerID = results1[0].id;
                    refID = results2[0].id;
                    self.db.query("DELETE FROM tutoringRequests WHERE studentId = " + parseInt(studentID) + " AND tutorRequestedId = " + refID + " AND centerId =  " + centerID + ");", function (err3) {
                        if (err3) {
                            cb(err3);
                        }
                        cb(null);
                    });
                }
            });
        }
    });
};


//OTHER FUNCTIONS RELEVANT TO   =======================================================================================================================================
//MAKING VALID MySQL QUERIES    =======================================================================================================================================

DatabaseHelper.prototype.validAdminCheck = function validAdminCheck(userID, password, cb) {
    var self = this;

    self.db.query("SELECT roleId FROM usersRolesRef WHERE userId = " + userID + ";", function (err1, results1) {
        if (err1) {
            cb(err1, null);
        }
        console.log("validAdminCheck: " + JSON.stringify(results1));
        if(results1[0].roleId === 1) {
            self.db.query("SELECT userPassword FROM users WHERE id = " + userID + ";", function (err2, results2) {
                if (err2) {
                    cb(err2, null);
                }
                var validPassword = false;
                console.log("validUserPasswordCheck: " + JSON.stringify(results2));
                if(results2[0] && results2[0].userPassword === password) {
                    validPassword = true;
                }
                cb(null, validPassword);
            });
        }else{
            cb(null, false);
        }
    });
};

DatabaseHelper.prototype.existingUserCheck = function existingUserCheck(userID, cb) {
    var self = this;

    self.db.query("SELECT userName FROM users WHERE id = " + userID + ";", function (err, results) {
        if (err) {
            cb(err, null);
            return;
        }
        var validUser = false;
        console.log("existingUserCheck: " + JSON.stringify(results));
        if(results[0]) {
            validUser = true;
        }
        cb(null, validUser);
    });
};

DatabaseHelper.prototype.validTutorCheck = function validTutorCheck(userID, cb) {
    var self = this;

    self.db.query("SELECT roleId FROM usersRolesRef WHERE id = " + userID + ";", function (err, results) {
        if (err) {
            cb(err, null);
            return;
        }
        var validTutor = false;
        console.log("existingUserCheck: " + JSON.stringify(results));
        if(results[0] && results[0].roleId === 4) {
            validTutor = true;
        }
        cb(null, validTutor);
    });
};

DatabaseHelper.prototype.validPasswordCheck = function validPasswordCheck(userID, password, cb) {
    var self = this;

    self.db.query("SELECT userPassword FROM users WHERE id = " + userID + ";", function (err, results) {
        if (err) {
            cb(err, null);
            return;
        }
        var validPassword = false;
        console.log("validUserPasswordCheck: " + JSON.stringify(results));
        if(results[0] && results[0].userPassword === password) {
            validPassword = true;
        }
        cb(null, validPassword);
    });
};


//FINAL LINE EXPORTS DBHELPER TO OTHER PORTIONS     =======================================================================================================================================
//OF POLYHEDRAL/DRON APPLICATION                    =======================================================================================================================================

module.exports = DatabaseHelper;