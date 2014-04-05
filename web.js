/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , path = require('path')
    , util = require('util')
    , ejs = require('ejs')
    , mvc = require('hive-mvc');

var app = express();
var PORT = process.env.PORT || 8080;

app.configure(function () {
    app.set('port', PORT);
    app.set('view engine', 'ejs');
    app.engine('html', ejs.renderFile);
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('because its what we are doing now'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    //app.use(express.errorHandler());
});

server = http.createServer(app);
server.on('close', function () {
    console.log('======== closing server');
});

var log_file = path.resolve(__dirname, 'actions.log');

var frame_path = path.resolve(__dirname, 'frames');
console.log('loading %s', frame_path);
server.listen(app.get('port'), function () {
    var apiary = mvc.Apiary({log_file: log_file, action_handler_failsafe_time: 3000}, frame_path);
    apiary.set_config('god_mode', true);
    apiary._config.setAll(require('./api_key.json'));

    console.log('initializing apiary for port %s', PORT);
    apiary.init(function () {
        console.log('serving');
        apiary.serve(app, server);
    });
});