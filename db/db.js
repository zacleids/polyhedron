var mysql = require('mysql');
var fs = require('fs');
var path = require('path');

function createDBconnection(opts) {

    var dbInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'secret', 'mysql.json'), 'UTF-8'));

    var connection = mysql.createConnection({
        host     : dbInfo.host,
        port     : dbInfo.port,
        user     : dbInfo.user,
        password : dbInfo.password,
        database : dbInfo.database
    });

    connection.connect(function(err) {
        if (err) {
            console.error('error connecting to db: ' + err.stack);
            return;
        }
        console.log('connected to db as id ' + connection.threadId);
    });

    return connection
}


module.exports = createDBconnection;
