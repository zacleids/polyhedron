var fs = require('fs');
var path = require('path');
var express = require('express');


function student(name, course) {
    this.name = name || '';
    this.course = course || '';
}

function makeStudent(line) {
    var parts = line.split(',');
    return new student(parts[0], parts[1]);
}

function createTutorCenterRouter(opts) {
    var router = express.Router();

    router.get('/', function (req, res, next) {
        var students = [];
        var file = path.join(__dirname, '..', 'fakeData', 'students.txt');
        fs.readFile(file, renderResponse);

        function renderResponse(err, data) {
            if (err) {
                console.log('An unknown error occurred: ', err);
                return;
            }

            var lines = data.toString().split('\n');
            lines.forEach(function (line) {
                students.push(makeStudent(line));
            });
            res.render('tutorCenter', {students: students});
        }

    });

    return router;
}


module.exports = createTutorCenterRouter;
