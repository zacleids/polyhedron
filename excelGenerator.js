'use strinct';
var path = require('path');
var fs = require('fs');
var excelBuilder = require('msexcel-builder');

String.prototype.sprintf = function()
{
    //copied from https://github.com/ildar-shaimordanov/jsxt/blob/master/js/String.js#L623
    var args = arguments;
    var index = 0;

    var x;
    var ins;
    var fn;

    /*
     * The callback function accepts the following properties
     *	x.index contains the substring position found at the origin string
     *	x[0] contains the found substring
     *	x[1] contains the index specifier (as \d+\$ or \d+#)
     *	x[2] contains the alignment specifier ("+" or "-" or empty)
     *	x[3] contains the padding specifier (space char, "0" or defined as '.)
     *	x[4] contains the width specifier (as \d*)
     *	x[5] contains the floating-point precision specifier (as \.\d*)
     *	x[6] contains the type specifier (as [bcdfosuxX])
     */
    return this.replace(String.prototype.sprintf.re, function()
    {
        if ( arguments[0] == "%%" ) {
            return "%";
        }

        x = [];
        for (var i = 0; i < arguments.length; i++) {
            x[i] = arguments[i] || '';
        }
        x[3] = x[3].slice(-1) || ' ';

        ins = args[+x[1] ? x[1] - 1 : index++];
//		index++;

        return String.prototype.sprintf[x[6]](ins, x);
    });
};

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function ExcelWorkbookGenerator(options){
    var date = new Date();
    // var dateString = 'sample-%04d-%02d-%02dT%02d-%02d-%02d.xlsx'.sprintf(
    //     date.getFullYear(),
    //     (date.getMonth()+1),
    //     date.getDate(),
    //     date.getHours(),
    //     date.getMinutes(),
    //     date.getSeconds()
    // );
    var name = options.name ? "-" + options.name : '';
    var dateString = 'sample-' + pad(date.getFullYear(),4) + "-" + pad(date.getMonth()+1, 2)  + "-" + pad(date.getDate(),2) + "T" +
        pad(date.getHours(),2) + "-" + pad(date.getMinutes(),2) + '-' + pad(date.getSeconds(),2) + name + '.xlsx';
    this.name = dateString;
    this.query = options.query || '';
    this.textFile = options.textFile;
    this.filePath = '';

}

ExcelWorkbookGenerator.prototype.generate = function generate(cb){
    var self = this;
    var workbook = excelBuilder.createWorkbook(path.join(__dirname, 'fakeData', 'excelGeneration'), this.name);
    if(self.textFile){
        var sheet1 = workbook.createSheet('sheet1', 100, 100);
        sheet1.set(1, 1, 'Name');
        sheet1.set(2, 1, 'Course');
        //var studentFile = path.join(__dirname, 'fakeData', 'students.txt');
        fs.readFile(self.textFile, transformData);

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
                var file = path.join(__dirname, 'fakeData', 'excelGeneration', self.name);
                fs.access(file, function(err){
                    if(err){
                        console.log('file was not created: ', err);
                        cb(err, null);
                    }
                    self.filePath = file;
                    cb(null, self.filePath);
                });
            });
        }
    }
};


module.exports = ExcelWorkbookGenerator;



