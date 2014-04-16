var hen_db = require('./hen_db.js'),
	USER_DB = 'gradebook-users',
	crypto = require('crypto'),
	Gradebook = require('gradebook'),
	moment = require('moment');

var views = {
	home: 'home',
	login: 'login',
	overview: 'overview',
	classes: 'classes'
};

// renders the homepage, nothing special
exports.home = function(req, res) {
	// we will be passing the logged in user's id to label the navbar correctly
	res.render(views.home, {
		title: 'Gradeviewer',
		username: req.session.user_id
	});
};
// once again just rendering the login page
exports.login = function(req, res) {
	// no need to login more than twice in one session
	if (req.session.user_id) res.redirect('/overview');
	res.render(views.login, {
		title: 'Sign in'
	});
};

// for more organization post route will be stored in a posts object
exports.posts = {};

// when the user submits the login form
var LOGIN_SUCCESS_REDIRECT = '/classes',
	LOGIN_FAILURE_REDIRECT = '/login';
exports.posts.login = function(req, res) {
	// the data sent by the form
	var loginInfo = req.body;
	// get the data held in the local database (gradeviewer) for the user
	hen_db.getEntryById(USER_DB, loginInfo.user_id, function(err, hen_db_results) {
		// check if the user exists in the database
		if (err && err.reason == 'missing') {
			// if it isn't then check if it is a valid login for the bsd site 
			var gradebook = new Gradebook(loginInfo.user_id, loginInfo.user_password);
			gradebook.startSession(function(err) {
				if (!err) {
					// it is valid, add the account to the database
					createAccount(loginInfo.user_id, loginInfo.user_password);
					// keep the user data in the session so it can be used to access
					// the gradebook for the duration of the session
					req.session.user_id = loginInfo.user_id;
					req.session.user_password = loginInfo.user_password;
					// redirect to the path of success
					res.redirect(LOGIN_SUCCESS_REDIRECT);
				} else {
					// no account exists on bsd grades
					res.redirect(LOGIN_FAILURE_REDIRECT);
				}
			});
		} else {
			// the user exists in database
			// check if the credentials are valid
			if (hen_db_results.user_password_hash == hash(loginInfo.user_password)) {
				// keep the user data in the session so it can be used to access
				// the gradebook for the duration of the session
				req.session.user_id = loginInfo.user_id;
				req.session.user_password = loginInfo.user_password;
				// redirect to the path of success
				res.redirect(LOGIN_SUCCESS_REDIRECT);
			} else {
				// not the correct password
				res.redirect(LOGIN_FAILURE_REDIRECT);
			}
		}
	});
};


var NOT_AUTHORIZED_REDIRECT = '/login';

exports.overview = function(req, res) {
	// for now redirect to classes
	res.redirect('/classes');

	////////////////////////////////
	// classy commented out code //
	////////////////////////////////

	// if (!req.session.user_id) {
	// 	res.redirect(NOT_AUTHORIZED_REDIRECT);
	// 	return;
	// }
	// manageSessionData(req.session, function(err) {
	// 	res.render(views.overview, {
	// 		title: 'Overview',
	// 		username: req.session.user_id
	// 	});
	// });
};

// gets the users class data from database and passes it to the template to render
exports.classes = function(req, res) {
	// check if the user belongs here
	if (!req.session.user_id) {
		res.redirect(NOT_AUTHORIZED_REDIRECT);
		return;
	}
	// refresh data in database if neccessary
	manageSessionData(req.session, function(err) {
		if (!err) {
			// get class data from database
			hen_db.getEntryById(USER_DB, req.session.user_id, function(err, user_data) {
				if (!err) {
					var currentSemester;
					if (user_data.courses[0].secondSemester.url || user_data.courses[1].secondSemester.url) {
						currentSemester = 'secondSemester';
					} else {
						currentSemester = 'firstSemester';
					}
					user_data.courses = user_data.courses.map(function(element) {
						element.currentSemester = element[currentSemester];
						return element;
					});
					res.render(views.classes, {
						title: 'Classes',
						username: req.session.user_id,
						classes: user_data.courses,
						currentSemester: currentSemester
					});
				}
			});
		} else {
			// oops, something went wrong
			// get out

			req.session.user_id = undefined;
			req.session.user_password = undefined;
			res.redirect(NOT_AUTHORIZED_REDIRECT);
			return;
		}
	});

};

// pretty self-explainitory, hashs a string with sha1
// might use salt in future
function hash(string) {
	return crypto.createHash('sha1').update(string).digest("hex");
}

// creates an account base on user credentials 
function createAccount(user_id, user_password) {
	hen_db.createById(USER_DB, user_id, {
		user_password_hash: hash(user_password)
	}, function() {

	});
}

// refresh data in database if the grade data is stale
function manageSessionData(session, manageSessionDataCallback) {


	// update data if it has been zero time, they just logged in probably
	if (!session.time) {
		updateData(session.user_id, session.user_password, manageSessionDataCallback);
		session.time = moment();
		return;
	}
	// find the time since the last update
	var difference = moment().diff(session.time, 'minutes');
	// if its longer than refresh time in minutes, update the data
	if (difference > 30) {
		updateData(session.user_id, session.user_password, manageSessionDataCallback);
		session.time = moment();
		return;
	} else manageSessionDataCallback(undefined);

}

// gathers all of the information about the users grades and puts them in the respective document
function updateData(user_id, user_password, updateDataCallback) {

	var gradebook = new Gradebook(user_id, user_password);
	// I might add this sort of sequence to the gradebook module, that is to gather class data and assignment data in one go
	gradebook.startSession(function(err) {
		// and error, better send that back to the callback
		if (err) updateDataCallback(err);
		else {
			gradebook.getGrades(function(err, courses_original) {
				if (!err) {
					gradebook.getAssignments(courses_original, function(err, grades_assignments_data) {
						if (!err) {
							// all this new data, combine it into one object for storage
							var courses = courses_original.map(function(element, index) {
								element.firstSemester.assignments = grades_assignments_data[index].firstSemester;
								element.secondSemester.assignments = grades_assignments_data[index].secondSemester;
								return element;
							});
							// add the new data to the database
							// by the way the 'true' allows for only the fields defined to be changed
							// as to not delete everything else not defined
							hen_db.updateById(USER_DB, user_id, true, {
								courses: courses,
								time: moment()
							}, function(err) {
								updateDataCallback(err);
							});
						} else updateDataCallback(err);
					});
				} else updateDataCallback(err);
			});
		}

	});
};