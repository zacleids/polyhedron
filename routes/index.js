var express = require('express');

function createIndexRouter() {
    var router = express.Router();

    router.get('/', function (req, res, next) {
        res.render('index', {title: 'Express', user: req.user});
    });

    return router;
}


module.exports = createIndexRouter;
