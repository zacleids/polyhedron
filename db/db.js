var mysql = require('mysql');

function createDBconnection(opts) {
    var connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'students'
    });

    connection.connect();

    return connection
}


module.exports = createDBconnection;
