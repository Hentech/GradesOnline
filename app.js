/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var Twig = require('twig');
var twig_fn = require('twig_fn.js');

var app = express();

Twig.extend(twig_fn);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(express.cookieParser());
app.use(express.session({secret: 'henryissupercool'}));

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', routes.home);

app.get('/login', routes.login);
app.post('/login', routes.posts.login);

app.get('/overview',routes.overview);

app.get('/classes',routes.classes);


http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});