/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path');

// templating library + custom extension
var Twig = require('twig'),
	twig_fn = require('twig_fn');
Twig.extend(twig_fn);


var app = express();


// all environments
app.set('port', process.env.PORT || 80);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

// cookies!
app.use(express.cookieParser());
app.use(express.session({
	secret: 'henryissupercool'
}));

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


////////////
// routes //
////////////

// loads the homepage
app.get('/', routes.home);

// loads the login page
app.get('/login', routes.login);
// allows for the password to be checked and subsequently logging in the user
app.post('/login', routes.posts.login);

// An overview of major grade changes in a given time
// has yet to be implemented
app.get('/overview', routes.overview);

// the page in which you can view your enrolled classes and their grades
app.get('/classes', routes.classes);


app.get('/signout',function(req,res){
	req.session = {};
	res.redirect('/login');
});

///////////////
// endroutes //
///////////////

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});