var express = require('express');
var path = require('path');
var fs = require('fs');
var excelbuilder = require('msexcel-builder');

function createAdminRouter(opts) {
    var router = express.Router();

    /* GET home page. */
    router.get('/', function (req, res, next) {
        res.render('admin/admin', {title: 'admin'});
    });

    router.get('/reports', function (req, res, next) {
        res.render('admin/reports', {title: 'reports'});
    });

    router.post('/downloadReport', function (req, res, next) {
        console.log('downloadReport entered');
        //var today = new Date().toISOString().replace(':','-').replace('.','-');
        //var today = '3-9-16';
        var date = new Date();
        var dateString = (date.getMonth()+1)  + "-" + date.getDate() + "-" + date.getFullYear() + "T" +
            date.getHours() + "-" + date.getMinutes() + '-' + date.getSeconds();
        var newFile = 'sample-' + dateString + '.xlsx';
        var workbook = excelbuilder.createWorkbook(path.join(__dirname, '..', 'fakeData', 'excelGeneration'), newFile);
        console.log('workbook created');

        // Create a new worksheet with 10 columns and 12 rows
        var sheet1 = workbook.createSheet('sheet1', 100, 100);
        console.log('sheet1 created');
        sheet1.set(1, 1, 'Name');
        sheet1.set(2, 1, 'Course');
        console.log('sheet1 header set');
        var studentFile = path.join(__dirname, '..', 'fakeData', 'students.txt');
        fs.readFile(studentFile, transformData);

        function transformData(err, data) {
            console.log('transformData callback entered');
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
            console.log('sheet filled');
            workbook.save(function(ok){
                var file = path.join(__dirname, '..', 'fakeData', 'excelGeneration', newFile);
                fs.access(file, function(err){
                    if(err){
                        console.log('file was not created: ', err);
                        return;
                    }
                    console.log('workbook created');
                    res.download(file, newFile);

                });

            });


        }

    });

    router.get('/options', function (req, res, next) {
        res.render('admin/options', {title: 'options'});
    });

    router.get('/statistics', function (req, res, next) {
        res.render('admin/statistics', {title: 'statistics'});
    });

    return router;
}


module.exports = createAdminRouter;
