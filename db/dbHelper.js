/**
 * Created by Sean Carpenter on 4/30/2017.
 */
var fs = require('fs');
var path = require('path');
var async = require('async');

function DatabaseHelper(opts) {
    this.db = opts.db;
}


//FUNCTIONS DEDICATED TO
//POPULATING THE TUTORING CENTERS BUTTONS ON
//THE "TUTORING CENTERS" PAGE FOR ADMINISTRATORS
DatabaseHelper.prototype.getTutorCenters = function getTutorCenters(cb) {
    var self = this;

    self.db.query("SELECT id, description FROM centers;", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var centerNames = [];
        results.forEach(function(result){
           centerNames.push(result.description);
        });
        cb(null, centerNames);
    });
};

//FUNCTIONS DEDICATED TO
//POPULATING THE SIGNED-IN STUDENTS LIST ON
//THE FRONT-FACING TUTOR CENTER PAGES
DatabaseHelper.prototype.getCenterStudents = function getCenterStudents(center, cb) {
    var self = this;
    var students = [];
    async.parallel({
        names: function (cb1) {
            self.getCenterStudentNames(center, function (err, result) {
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
            for(var i = 0; i < results["names"].length; i++) {
                students.push({
                    name: results["names"][i],
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

    self.db.query("SELECT nickName FROM students, users, centers WHERE centers.description = \'"
        + center + "\' AND students.centerId = centers.id", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var studentNames = [];
        console.log(results);
        results.forEach(function(result) {
            studentNames.push(result.nickName);
        });
        cb(null, studentNames);
    });
};

DatabaseHelper.prototype.getCenterStudentClasses = function getCenterStudentClasses(center, cb) {
    var self = this;

    self.db.query("SELECT code FROM centers, students, registrations, classes, classTypes WHERE students.centerId = centers.id AND centers.description = \'" + center +
    "\' AND students.registrationId = registrations.id AND registrations.classId = classes.id AND classes.typeId = classTypes.id ORDER BY registration.id;", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var classNames = [];
        console.log(results);
        results.forEach(function(result) {
            classNames.push(result.code);
        });
        cb(null, classNames);
    });
};

DatabaseHelper.prototype.getCenterStudentLocations = function getCenterStudentLocations(center, cb) {
    var self = this;

    self.db.query("SELECT locations.description FROM students, locations, centers WHERE students.locationId = locations.id AND students.centerId = centers.id AND centers.description = \'" + center +
        ";", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var locations = [];
        console.log(results);
        results.forEach(function(result) {
            locations.push(result.description);
        });
        cb(null, locations);
    });
};

//FUNCTIONS DEDICATED TO
//POPULATING THE ON-THE-CLOCK TUTORS LIST ON
//THE FRONT-FACING TUTOR CENTER PAGES
DatabaseHelper.prototype.getCenterTutors = function getCenterTutors(center, cb) {
    var self = this;

    self.db.query("SELECT nickname FROM tutors, users, centers WHERE tutors.id = users.id AND tutors.centerId = centers.id AND centers.description = \'"
        + center + "\';", function (err, results){
       if(err) {
           cb(err, null);
       }
       var tutorNames = [];
       console.log(results);
       results.forEach(function(result) {
           tutorNames.push(result.nickName);
       });
        cb(null, tutorNames);
    });
};

DatabaseHelper.prototype.getClockinTime = function getClockinTime(center, cb) {
    var self = this;

    self.db.query("SELECT loginTime FROM tutors, centers WHERE tutors.centerId = centers.centerId AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
        }
        var clockinTimes = [];
        console.log(results);
        results.forEach(function(result) {
            clockinTimes.push(result.loginTime);
        });
        cb(null, clockinTimes);
    });
};

//FUNCTIONS DEDICATED TO
//POPULATING THE TUTORING REQUESTS LIST ON
//THE FRONT-FACING TUTOR CENTER PAGES
DatabaseHelper.prototype.getRequestedTutors = function getRequestedTutors(center, cb) {
    var self = this;

    self.db.query("SELECT nickName FROM users, tutoringRequests WHERE users.id = tutoringRequests.tutorRequestedId AND tutoringRequests.centerId = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
        }
        var tutorNames = [];
        console.log(results);
        results.forEach(function(result) {
            tutorNames.push(result.nickName);
        });
        cb(null, tutorNames);
    });
};

DatabaseHelper.prototype.getRequestingStudents = function getRequestingStudents(center, cb) {
    var self = this;

    self.db.query("SELECT nickName FROM users, tutoringRequests, centers WHERE users.id = tutoringRequests.tutorRequestedId AND tutoringRequests.centerId = centers.centerId AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
        }
        var studentNames = [];
        console.log(results);
        results.forEach(function(result) {
            studentNames.push(result.nickName);
        });
        cb(null, studentNames);
    });
};

DatabaseHelper.prototype.getAssignedTutors = function getAssignedTutors(center, cb) {
    var self = this;

    self.db.query("SELECT nickName FROM users, tutoringRequests, centers WHERE users.id = tutoringRequests.tutorAssignedId AND tutoringRequests.centerId = centers.centerId AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
        }
        var tutorNames = [];
        console.log(results);
        results.forEach(function(result) {
            tutorNames.push(result.nickName);
        });
        cb(null, tutorNames);
    });
};

DatabaseHelper.prototype.getRequestTime = function getRequestTime(center, cb) {
    var self = this;

    self.db.query("SELECT requestTime FROM tutoringRequests, centers WHERE tutoringRequests.centerId = centers.centerId AND centers.description = \'"
        + center + "\' ORDER BY tutoringRequests.id;", function (err, results){
        if(err) {
            cb(err, null);
        }
        var requestTimes = [];
        console.log(results);
        results.forEach(function(result) {
            requestTimes.push(result.requestTime);
        });
        cb(null, requestTimes);
    });
};

//FUNCTIONS DEDICATED TO
//UPDATING THE SIGN-IN FORM FOR
//A STUDENT SIGNING INTO ON
//THE FRONT-FACING TUTOR CENTER PAGES
DatabaseHelper.prototype.getStudentsClasses = function getStudentsClasses(studentID, cb) {
    var self = this;

    self.db.query("SELECT DISTINCT code FROM registrations, users, classes, classTypes WHERE users.id =\'" + studentID + "\' AND users.id = registrations.userId AND registrations.classId =" +
        "classes.id AND classes.typeId = classTypes.id ORDER BY registrations.classId;", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var studentsClasses = [];
        console.log(results);
        results.forEach(function(result) {
            studentsClasses.push(result.code);
        });
        cb(null, studentsClasses);
    });
};

DatabaseHelper.prototype.getStudentsRegistrationIDs = function getStudentsRegistrationIDs(center, cb) {
    var self = this;

    self.db.query("SELECT registrations.id FROM centers, students, registrations, classes, classTypes WHERE students.centerId = centers.id AND centers.description = \'" + center +
        "\' AND students.registrationId = registrations.id AND registrations.classId = classes.id AND classes.typeId = classTypes.id ORDER BY registration.id;", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var regIDs = [];
        console.log(results);
        results.forEach(function(result) {
            regIDs.push(result.id);
        });
        cb(null, regIDs);
    });
};

DatabaseHelper.prototype.getCenterLocationNames = function getCenterLocationNames(center, cb) {
    var self = this;

    self.db.query("SELECT locations.description FROM locations, centers WHERE centers.description = \'" + center + "\' AND centers.id = locations.centerId;", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var centerLocationNames = [];
        console.log(results);
        results.forEach(function(result) {
            centerLocationNames.push(result.description);
        });
        cb(null, centerLocationNames);
    });
};

DatabaseHelper.prototype.getCenterLocationIDs = function getCenterLocationIDs(center, cb) {
    var self = this;

    self.db.query("SELECT locations.id FROM locations, centers WHERE centers.description = \'" + center + "\' AND centers.id = locations.centerId;", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var centerLocationIDs = [];
        console.log(results);
        results.forEach(function(result) {
            centerLocationIDs.push(result.id);
        });
        cb(null, centerLocationIDs);
    });
};

//FUNCTIONS DEDICATED TO
//POPULATING THE SIGNED-IN STUDENTS TABLE AND
//POPULATING THE CLOCKED-IN TUTORS TABLE AND
//POPULATING THE TUTORING REQUEST TABLE IN
//THE BACK-END DATABASE
DatabaseHelper.prototype.loginStudent = function studentLogin(studentID, regID, locationID, center, cb) {
    var self = this;
    var centerID = 0;
    self.db.query("SELECT id FROM centers WHERE center.description = " + center + ";", function (err1, results) {
       if (err1) {
            cb(err1, null);
       }
       else {
           console.log(results);
           centerID = results;
       }
    });

    if(centerID != 0) {
        self.db.query("INSERT INTO students VALUES(" + studentID + ", " + regID + ", convert_tz(current_timestamp(), '+00:00', '-07:00'), convert_tz(current_timestamp(), '+00:00', '-07:00'), " +
            "convert_tz(current_timestamp(), '+00:00', '-07:00'), " + (studentID + 1) + ", " + centerID + ";", function (err2) {
            if (err2) {
                cb(err2, null);
            }
        });
    }
};


//OTHER FUNCTIONS RELEVANT TO
//MAKING VALID UPDATES TO TABLES
DatabaseHelper.prototype.existingUserCheck = function existingUserCheck(userID, cb) {
    var self = this;

    self.db.query("SELECT * FROM users WHERE id = \'" + userID + "\';", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var validUser = false;
        console.log(results);
        results.forEach(function(result) {
            if(result) {
                validUser = true;
            }
        });
        cb(null, validUser);
    });
};


module.exports = DatabaseHelper;