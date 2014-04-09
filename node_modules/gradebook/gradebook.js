/////////////////////////////////////////////////////////////////////
//@author Henry Troutman, henguin1001@gmail.com, henrytroutman.com //
/////////////////////////////////////////////////////////////////////

/**
 * constructs the object used to make requests to the gradebook
 * @constructor
 * @param {string} username - the name of the user
 * @param {string} password - and their password
 *
 */
function GradeBook(username, password) {
	// using the request module for http requests
	this.request = require('request');
	// using the async module for reasons
	this.async = require('async');
	// telling it to keep the cookies
	// without it a login would be prompted at each request
	this.jar = this.request.jar();
	// grab our dom parser?
	this.cheerio = require('cheerio');

	// no need for explanation
	this.username = username;
	this.password = password;

	/**
	 * removes all ties of an array to cheerio
	 * @param  {object} cheerio_object - an object resulting from using $()
	 * @return {array} - an array with all the cheerio fields removed
	 */
	this.cheerio.seperate = function(cheerio_object) {
		var output = [];
		for (var key in cheerio_object) {
			if (parseInt(key) >= 0) output.push(cheerio_object[key]);
		}
		return output;
	};
}

/**
 * Starts the communication with the gradebook
 * @param  {Function} callback - called after the request is made
 *
 */
GradeBook.prototype.startSession = function(callback) {

	var cheerio = this.cheerio,
		request = this.request,
		fields = {}, username = this.username,
		password = this.password,
		jar = this.jar;
	request.get('https://grades.bsd405.org/Pinnacle/Gradebook/Logon.aspx?ReturnUrl=%2fpinnacle%2fgradebook%2fDefault.aspx', {
		jar: jar
	}, function(err, response) {
		var $ = cheerio.load(response.body);
		// these are the hidden fields of the login page
		$('input[name]').each(function() {
			fields[$(this).attr('name')] = $(this).val();
		});
		// add the proper username and password to these fields
		fields['ctl00$ContentPlaceHolder$Username'] = username;
		fields['ctl00$ContentPlaceHolder$Password'] = password;

		// make a request to the login page with the form data stored as fields
		request.post('https://grades.bsd405.org/Pinnacle/Gradebook/Logon.aspx?ReturnUrl=%2fpinnacle%2fgradebook%2fDefault.aspx', {
			jar: jar
		}, function(err, response) {
			if (!err) {
				// check if there was a problem with logging in
				// if it was correct then it will say object moved
				if (response.body.indexOf("Object moved") != -1) {
					callback(undefined);
				} else {
					callback(new Error("Username or password was incorrect."));
				}
			} else {
				callback(err);
			}
		}).form(fields);

	});

}

/**
 * Gets the "Default" page of the gradebook
 * it store the assignments that are overdue, due, and soon to be due
 * @param  {Function} callback
 */
GradeBook.prototype.getDefault = function(callback) {
	// preserve cheerio
	var cheerio = this.cheerio;
	this.request.get('https://grades.bsd405.org/Pinnacle/Gradebook/InternetViewer/Default.aspx', {
		jar: this.jar
	}, function(err, response) {
		// was there an error in the request
		if (!err) {
			// the response is the html page
			// its time to parse

			// cheerio acts like jQuery but for node
			var $ = cheerio.load(response.body),
				// a group of tables
				tables = $('.reportTable'),
				// before just means it is still in dom form
				// the first table - overdue assignments
				overdue_before = tables[0],
				// the second - currently due
				due_before = tables[1],
				// and the third - future due
				future_before = tables[2],
				// the arrays that will store the pure form of each of said tables
				overdue = [],
				due = [],
				future = [];
			/**
			 * A function that takes the necessary information from a table
			 * @param  {object} table - the table to draw the info from
			 * @return {array} - an array of each assignment in the given table
			 */
			var parseTable = function(table) {
				// for some reason the "tbody" tag is converted to "table" 
				var output = $(table).children('table tr').map(function(index, value) {
					// each element that holds info
					var date = $(value).children()[0],
						assignment = $(value).children()[1],
						course = $(value).children()[2];
					// lets store that info
					var date_text = $(date).text(),
						assignment_text = $(assignment).text(),
						course_text = $(course).text();
					// return it all with the respective field names
					return {
						"date": date_text,
						"assignment": assignment_text,
						"course": course_text
					};
				});
				// there are a bunch of unnecessary fields from cheerio, this will remove them
				return cheerio.seperate(output);

			};

			// utilize parseTable for each of the three tables
			overdue = parseTable(overdue_before);
			due = parseTable(due_before);
			future = parseTable(future_before);

			// now call the callback with each table and its field
			callback(undefined, {
				"overdue": overdue,
				"due": due,
				"future": future
			});
		} else {
			// retreat!
			callback(err);
		}

	});
}

/**
 * Gets The enrolled classes, their grades, and where to access the assignments
 * @param  {Function} callback
 */
GradeBook.prototype.getGrades = function(callback) {
	// preserve cheerio
	var cheerio = this.cheerio;
	// make the request to the GradeSummary page
	this.request.get('https://grades.bsd405.org/Pinnacle/Gradebook/InternetViewer/GradeSummary.aspx', {
		jar: this.jar
	}, function(err, response) {
		// was their an error in the request
		if (!err) {
			// again cheerio is like jQuery, passing it the html
			var $ = cheerio.load(response.body);

			/**
			 * A function that takes the necessary information from a table
			 * @param  {object} table - the table to draw the info from
			 * @return {array} - an array of each assignment in the given table
			 */
			var parseTable = function(table) {
				// this one retains the "tbody" tag?
				var output = $(table).children('tbody').children().map(function(index, value) {
					// get the elements holding the data
					var course = $(value).children()[0],
						period = $(value).children()[1],
						firstSemester = $(value).children()[2],
						secondSemester = $(value).children()[3];
					// extract and store the data
					var course_text = $(course).text(),
						period_text = $(period).text(),
						firstSemester_text = $(firstSemester).text(),
						secondSemester_text = $(secondSemester).text();
					// return it all with the respective field names
					return {
						"course": course_text,
						"period": period_text,
						"firstSemester": {
							"grade": firstSemester_text,
							"url": $(firstSemester).children('a').attr('href')
						},
						"secondSemester": {
							"grade": secondSemester_text,
							"url": $(secondSemester).children('a').attr('href')
						}
					};
				});
				// once again remove the fields from cheerio
				return cheerio.seperate(output);
			};


			// we have are table element
			var grades_before = $('.reportTable')[0],
				// and now all the data from it
				grades = parseTable(grades_before);
			// lets send the result back
			callback(undefined, grades);
		} else {
			// retreat!
			callback(err);
		}
	});
}

/**
 * gets the assignments for each class
 * @param  {json}   grades_data the previously captured grade data
 * @see  Gradebook.getGrades
 * @param  {Function} callback    called when the actions is completed passing the modified grades data
 */
GradeBook.prototype.getAssignments = function(grades_data, callback) {
	// preserve member variables, request etc
	var request = this.request,
		jar = this.jar,
		cheerio = this.cheerio;
	// using the async library to iterate through courses and make the appropriate requests
	this.async.map(grades_data,
		function(value, callback) {
			// define a function parse the html output and then format it
			var parseTable = function(data) {
				// again using cheerio
				var $ = cheerio.load(data),
					// the table still as a dom element
					assignments_cheerio = $('table.reportTable')[0],
					categories_cheerio = $('table.reportTable')[1];


				var assignments = $(assignments_cheerio).children('tbody').children().map(function(index, value) {
					// get the elements holding the data, lots of fields
					var number = $(value).children()[0],
						name = $(value).children()[1],
						date = $(value).children()[2],
						category = $(value).children()[3],
						grade = $(value).children()[4],
						max = $(value).children()[5],
						letter = $(value).children()[6],
						comments = $(value).children()[7];
					// extract and store the data (text)
					var number_text = $(number).text(),
						name_text = $(name).text(),
						date_text = $(date).text(),
						category_text = $(category).text()
						grade_text = $(grade).text(),
						max_text = $(max).text(),
						letter_text = $(letter).text(),
						comments_text = $(comments).text();
					// return it all with the respective field names
					return {
						"number": number_text,
						"name": name_text,
						"date": date_text,
						"category": category_text,
						"grade": grade_text,
						"max": max_text,
						"letter": letter_text,
						"comments": comments_text
					};
				});

				var categories = $(categories_cheerio).children('tbody').children().map(function(index, value) {
					var name = $(value).children()[0],
						weight = $(value).children()[1],
						points = $(value).children()[2],
						percent = $(value).children()[3],
						letter = $(value).children()[4];

					// extract and store the data (text)
					var name_text = $(name).text(),
						weight_text = $(weight).text(),
						points_text = $(points).text(),
						percent_text = $(percent).text()
						letter_text = $(letter).text();
					// return it all with the respective field names
					return {
						"name": name_text,
						"weight": weight_text,
						"points": points_text,
						"percent": percent_text,
						"letter": grade_text
					};
				});

				// once again remove the fields from cheerio
				return { assignments:cheerio.seperate(assignments), categories:cheerio.seperate(categories)};
			};


			// get whichever semester is defined
			if (value.firstSemester.url) {

				// make the request with that url
				request.get('https://grades.bsd405.org/Pinnacle/Gradebook/InternetViewer/' + value.firstSemester.url, {
					jar: jar
				}, function(err, first_response) {
					if (value.secondSemester.url) {
						request.get('https://grades.bsd405.org/Pinnacle/Gradebook/InternetViewer/' + value.secondSemester.url, {
							jar: jar
						}, function(err, second_response) {
							callback(err, {
								firstSemester: parseTable(first_response.body),
								secondSemester: parseTable(second_response.body)
							});
						});
					} else {
						callback(err, {
							firstSemester: parseTable(first_response.body),
							secondSemester: undefined
						});
					}

				});
			} else if (value.secondSemester.url) {
				request.get('https://grades.bsd405.org/Pinnacle/Gradebook/InternetViewer/' + value.secondSemester.url, {
					jar: jar
				}, function(err, second_response) {
					if (value.firstSemester.url) {
						request.get('https://grades.bsd405.org/Pinnacle/Gradebook/InternetViewer/' + value.firstSemester.url, {
							jar: jar
						}, function(err, first_response) {
							callback(err, {
								firstSemester: parseTable(first_response.body),
								secondSemester: parseTable(second_response.body)
							});
						});
					} else {
						callback(err, {
							firstSemester: undefined,
							secondSemester: parseTable(second_response.body)
						});
					}
				});
			} else callback(null, {
				firstSemester: undefined,
				secondSemester: undefined
			});



		},
		// when its done with all that
		function(err, results) {
			// append to the original array and pass it to the callback
			callback(null, results);
		});
}


/**
 * refreshes the cookie jar
 */
GradeBook.prototype.endSession = function() {
	// reset that cookie
	this.jar = this.request.jar();
};


/**
 * pass the constructor
 * @type {function}
 */
module.exports = GradeBook;