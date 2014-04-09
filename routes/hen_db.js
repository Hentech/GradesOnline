/*
	hen_db
	Interacts with the CouchDB database through the use of the module: nano
	@author Henry Troutman, henguin1001@gmail.com, henrytroutman.com

*/


/*
	The object that handles the interaction
	@constructor
	@this {Hen_db}
*/
function Hen_db() {
	this.nano = require('nano')('http://localhost:5984');
}


/*
	Gets the document by its id
	@this {Hen_db}
	@method
	@param database_name{string} name of the database
	@param document_id {string} the identifier for the document 
	@param callback{function<err,body>} the function called with the results of the request
		@err the errors resulting from the request
		@body the results had there been no error
*/
Hen_db.prototype.getEntryById = function(database_name, document_id, callback) {
	var db = this.nano.db.use(database_name);
	db.get(document_id, {
		revs_info: false
	}, function(err, body) {
		callback(err, body, db);
	});
};

/*
	Updates the data in a document
	@this {Hen_db}
	@method
	@param database_name{string} name of the database
	@param document_id {string} the identifier for the document
	@param data{object} the object holding the attributes to be transferred to the document
	@param callback{function<err,body>} the function called with the results of the request
		@err the errors resulting from the request
		@body the results had there been no error
*/


Hen_db.prototype.updateById = function(database_name, document_id, cumulate, data, callback) {
	this.getEntryById(database_name, document_id, function(err, body, db) {
		if (err)
			callback(err, body);
		else db.insert(merge_objects({
			_rev: body._rev
		}, cumulate ? merge_objects(body, data) : data), document_id, function(err, body) {
			callback(err, body);
		});
	});
};

Hen_db.prototype.createById = function(database_name, document_id, data, callback) {
	var db = this.nano.db.use(database_name);
	db.insert(data, document_id, function(err, body) {
		callback(err, body);
	});
};
Hen_db.prototype.deleteById = function(database_name, document_id, callback) {
	this.getEntryById(database_name, document_id, function(err, body, db) {
		if (err)
			callback(err, body);
		else db.destroy(document_id, body._rev, function(err, body) {
			callback(err, body);
		});
	});
};


Hen_db.prototype.listByView = function(database_name, design_name, view_name, callback) {
	var db = this.nano.db.use(database_name);
	db.view(design_name, view_name, function(err, data) {
		callback(err, data);
	});
};

Hen_db.prototype.selectByView = function(database_name, design_name, view_name, args, callback) {
	var db = this.nano.db.use(database_name);
	db.view(design_name, view_name, {
		key: args
	}, function(err, data) {
		callback(err, data);
	});
};



/*
	Combines the attributes of two objects
	@method
	@param obj1 the first object
	@param obj2 the second object
	@returns the object holding the attributes of obj1 and obj2
*/
function merge_objects(obj1, obj2) {
	var obj3 = {};
	for (var attrname in obj1) {
		obj3[attrname] = obj1[attrname];
	}
	for (var attrname in obj2) {
		obj3[attrname] = obj2[attrname];
	}
	return obj3;
}

// gives the application access to the Hen_db constructor
module.exports = new Hen_db();