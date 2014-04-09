var hen_db = require('./hen_db.js'),
	USER_DB = 'gradebook-users',
	crypto = require('crypto'),
	Gradebook = require('gradebook'),
	moment = require('moment');

exports.home = function(req, res) {
	res.render('home', {
		title: 'Gradeviewer',
		username: req.session.user_id
	});
};
exports.login = function(req, res) {
	if (req.session.user_id) res.redirect('/overview');
	res.render('login', {
		title: 'Sign in'
	});
};
exports.posts = {};
exports.posts.login = function(req, res) {
	var loginInfo = req.body;
	hen_db.getEntryById(USER_DB, loginInfo.user_id, function(err, hen_db_results) {
		if (err && err.reason == 'missing') {
			var gradebook = new Gradebook(loginInfo.user_id, loginInfo.user_password);
			gradebook.startSession(function(err) {
				if (!err) {
					createAccount(loginInfo.user_id, loginInfo.user_password);
					req.session.user_id = loginInfo.user_id;
					req.session.user_password = loginInfo.user_password;
					res.redirect('/overview');
				} else {
					res.redirect('/login');
				}
			});
		} else {
			if (hen_db_results.user_password_hash == hash(loginInfo.user_password)) {
				req.session.user_id = loginInfo.user_id;
				req.session.user_password = loginInfo.user_password;
				res.redirect('/overview');
			} else {
				res.redirect('/login');
			}
		}
	});
};

function hash(string) {
	return crypto.createHash('md5').update(string).digest("hex");
}

function createAccount(user_id, user_password) {
	hen_db.createById(USER_DB, user_id, {
		user_password_hash: hash(user_password)
	}, function() {

	});
}

exports.overview = function(req, res) {
	res.redirect('/classes');
	// if (!req.session.user_id) {
	// 	res.redirect('/login');
	// 	return;
	// }
	// manageSessionData(req.session, function(err) {
	// 	res.render('overview', {
	// 		title: 'Overview',
	// 		username: req.session.user_id
	// 	});
	// });
};
exports.classes = function(req, res) {
	if (!req.session.user_id) {
		res.redirect('/login');
		return;
	}
	manageSessionData(req.session, function(err) {
		if (!err) {
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
					res.render('classes', {
						title: 'Classes',
						username: req.session.user_id,
						classes: user_data.courses,
						currentSemester: currentSemester
					});
				}
			});
		} else {
			req.session.user_id = undefined;
			req.session.user_password = undefined;
			res.redirect('/login');
			return;
		}
	});

};


function manageSessionData(session, manageSessionDataCallback) {

	var updateData = function(user_id, user_password, updateDataCallback) {
		var gradebook = new Gradebook(user_id, user_password);
		gradebook.startSession(function(err) {
			if (err) updateDataCallback(err);
			else {
				gradebook.getGrades(function(err, courses_original) {
					if (!err) {
						gradebook.getAssignments(courses_original, function(err, grades_assignments_data) {
							if (!err) {
								var courses = courses_original.map(function(element, index) {
									element.firstSemester.assignments = grades_assignments_data[index].firstSemester;
									element.secondSemester.assignments = grades_assignments_data[index].secondSemester;
									return element;
								});
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
	if (!session.time) {
		session.time = moment();
		updateData(session.user_id, session.user_password, manageSessionDataCallback);
	}
	var difference = moment().diff(session.time, 'minutes');
	if (difference > 30) {
		session.time = moment();
		updateData(session.user_id, session.user_password, manageSessionDataCallback);
	} else manageSessionDataCallback(undefined);

}