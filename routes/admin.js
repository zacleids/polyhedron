var express = require('express');


function createAdminRouter(opts) {
    var router = express.Router();

    /* GET home page. */
    router.get('/', function (req, res, next) {
        res.render('admin/admin', {title: 'admin'});
    });

    router.get('/reports', function (req, res, next) {
        res.render('admin/reports', {title: 'reports'});
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
