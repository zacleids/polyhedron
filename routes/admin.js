var express = require('express');
var path = require('path');
var fs = require('fs');
var excelBuilder = require('msexcel-builder');

function ClassWithOccurrence(courseName, occurrence) {
    this.course = courseName || '';
    this.count = occurrence || '';
}

function createAdminRouter(opts) {
    var router = express.Router();
    
    router.get('/', function (req, res, next) {
        res.render('admin/admin', {title: 'admin'});
    });

    // *************** reports page ***************

    router.get('/reports', function (req, res, next) {
        fs.readdir(path.join(__dirname, '..', 'fakeData', 'excelGeneration'), function(err, files){
            if (err) {
                console.log('An unknown error occurred: ', err);
                return;
            }
            res.render('admin/reports', {
                title: 'reports',
                files: files
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
        var filename = req.body.fileSelector;
        var file = path.join(__dirname, '..', 'fakeData', 'excelGeneration', filename);
        fs.access(file, function(err){
            if(err){
                console.log('file not there: ', err);
                return;
            }
            res.download(file, filename);
        });
    });

    // *************** configurations page ***************

    router.get('/options', function (req, res, next) {
        res.render('admin/options', {
            title: 'options',
            tutorTable: opts.tutorTable,
            requestsTable: opts.requestsTable,
            scrollingText: opts.scrollingText
        });
    });

    router.post('/options', function (req, res, next) {
        opts.requestsTable = !!req.body.requestsTable;
        opts.tutorTable = !!req.body.tutorTable;
        opts.scrollingText = !!req.body.scrollingText;

        res.render('admin/options', {
            title: 'options',
            tutorTable: opts.tutorTable,
            requestsTable: opts.requestsTable,
            scrollingText: opts.scrollingText,
            done: true
        });
    });

    // *************** statistics page ***************

    router.get('/statistics', function (req, res, next) {
        var classWithOccurrences = {};
        var file = path.join(__dirname, '..', 'fakeData', 'students.txt');
        fs.readFile(file, renderResponse);

        function renderResponse(err, data) {
            if (err) {
                console.log('An unknown error occurred: ', err);
                return;
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

            console.log(classWithOccurrences);
            res.render('admin/statistics', {title: 'statistics', classWithOccurrences: classWithOccurrences});
        }

    });

    return router;
}

module.exports = createAdminRouter;
