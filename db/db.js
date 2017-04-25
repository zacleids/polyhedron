var mysql = require('mysql');
var fs = require('fs');
var path = require('path');

function createDBconnection(opts) {
    // var connection = mysql.createConnection({
    //     host     : 'localhost',
    //     user     : 'root',
    //     password : '',
    //     database : 'students'
    // });

    var dbInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'secret', 'sql.json'), 'UTF-8'));

    var connection = mysql.createConnection({
        host     : dbInfo.host,
        port     : dbInfo.port,
        user     : dbInfo.user,
        password : dbInfo.password,
        database : dbInfo.database
    });

    connection.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }
        console.log('connected to db as id ' + connection.threadId);

        connection.query('SELECT * FROM students', function (error, results, fields) {
            if (error) throw error;
            console.log("Results: ");
            console.log(results);
        });
    });



    return connection
}


module.exports = createDBconnection;
