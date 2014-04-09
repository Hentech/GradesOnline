A node module allowing for access to the Bellevue School District gradebook
#Install it
Using npm just `npm install gradebook`
# How to use it
## Start a session
``` js
var Gradebook = require('gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	if(!err){
		// you've logged in
	}
});
```
## Access the default page
It holds the the overdue, due, and soon to be due assignments
``` js
var Gradebook = require('gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	if(!err){
		gradebook.getDefault(function(err,body){
			if(!err){
				console.log(body);
			}
		});
	}
});
```
would result in something like
``` json
{
	"due":[],
	"future":[],
	"overdue":[
		"assignment":"Foo Assignment",
		"course":"bar class",
		"date":"Feb 29"
	]
}
```
## Access the grades page
Of course it holds the user's grades
``` js
var Gradebook = require('gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	if(!err){
		gradebook.getGrades(function(err,body){
			if(!err){
				console.log(body);
			}
		});
	}
});
```
would result in something like
``` json
[
	{ 
		"course":"Ap bar b",
		"period":"3",
		"firstSemester":{
			"grade":"A+",
			"url":"lalal",
		},
		"secondSemester":undefined
	}
]
```
## Get the assignments for each course
``` js
var Gradebook = require('gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	if(!err){
		gradebook.getGrades(function(err,grades){
			if(!err){
				gradebook.getAssignments(grades,function(err,body){
					if(!err){
						console.log(body);
					}
				});
			}
		});
	}
});
```
would result in something like
``` json
[
	{ 
		"firstSemester":{
			"assignments":[
				{
					"name":"homework A",
					"grade":"40",
					"max":"44",
					"letter":"A",
					"category":"homework",
					"comments":"Terrible Effort"
				}
			],
			"categories": [
				{
					"name": "homework",
					"weight": "50",
					"points": "110/220",
					"percent": "50",
					"letter": "A-"
				}
			]
		},
		"secondSemester":undefined
	}
]
```
## End the session
``` js
var Gradebook = require('gradebook');
var gradebook = new Gradebook('username', 'password');
gradebook.startSession(function(err){
	gradebook.endSession();
});
```
