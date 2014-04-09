var Gradebook = require('../gradebook');
var login = require('./login.secret.json');
var assert = require('assert');

describe('Gradebook', function() {
	// sorry cant supply a test username and password
	var gradebook = new Gradebook(login.username, login.password);

	describe('#startSession', function() {
		it('should run with no error if login is correct', function(done) {
			this.timeout(0);
			gradebook.startSession(done);
		});
		describe('#getDefault', function() {
			it('should run with no error, passing student assignments to the callback', function(done) {
				this.timeout(0);
				gradebook.getDefault(done);
			});
		});
		describe('#getGrades', function() {
			it('should run with no error, passing student grades to the callback', function(done) {
				this.timeout(0);
				gradebook.getGrades(done);
			});
		});
		describe('#getAssignments',function(){
			it('should run with no error', function(done){
				this.timeout(0);
				gradebook.getGrades(function(err,grade_data){
					if(err) {
						throw err;
						done();
					} else {
						gradebook.getAssignments(grade_data,done);
					}

				})
			});
		});
		describe('#endSession', function() {
			it('should run with no error', function(done) {
				gradebook.endSession();
				done();
			});
		});
		

	});
});