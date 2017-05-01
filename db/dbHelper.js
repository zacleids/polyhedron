/**
 * Created by Sean Carpenter on 4/30/2017.
 */
var fs = require('fs');
var path = require('path');

// function createDBHelper(opts) {
//     var db = opts.db;
//
//     return {
//         getTutorCenters: function getTutorCenters() {
//             db.query("SELECT id, description FROM centers;", function (err, results) {
//                 if (err) {
//                     console.error("Whoopsy daisy, something went wrong!" + err.message);
//                     return;
//                 }
//                 var centerNames= [];
//                 results.forEach(function(result){
//                    centerNames.push(result.description);
//                 });
//                 return centerNames;
//             });
//         }
//     }
// }

function DatabaseHelper(opts) {
    this.db = opts.db;
}

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

DatabaseHelper.prototype.getCenterStudents = function getCenterStudents(center, cb) {
    var self = this;

    self.db.query("SELECT nickName FROM students, users, centers WHERE centers.description = \'" + center + "\' AND students.centerId = centers.id", function (err, results) {
        if (err) {
            cb(err, null);
        }
        var studentNames = [];
        console.log(results);
        results.forEach(function(result) {
            studetnNames.push(result.nickName);
        });
        cb(null, studentNames);
    });
};


module.exports = DatabaseHelper;