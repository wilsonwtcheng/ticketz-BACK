
exports.register = function(server, options, next) {
 
var Bcrypt = require('bcrypt'); // require would make it look into the node modules.
var Joi 	 = require('joi'); //because it's a library. Help us to distinguish betw variable, and variable leading to library.

 //include routes
 server.route([
   { //Retrieve All Users
     method: 'GET',
     path: '/users',
     handler: function(request, reply) {
     	var db = request.server.plugins['hapi-mongodb'].db;
     	db.collection("users").find().toArray(function(err, users) {
     		if(err) { 
     			return reply('Internal MongoDB error', err); 
     		}
     			reply(users);
     			console.log("All users retrieved.");
     	})
     }
   },

 	{ 
 		method: 'POST',
 		path: '/users',
 		config: {
 		handler: function(request, reply) { //ALWAYS request reply here.
 			var newUser = request.payload.user;
			var db = request.server.plugins['hapi-mongodb'].db;

			Bcrypt.genSalt(10, function(err, salt){
				Bcrypt.hash(newUser.password, salt, function(err, hash){ //newUser.password accesses the password
					newUser.password = hash;
		 			var uniqueUserQuery = {
		 				$or: [ //or, count the number of matching username or matching email.
		 					{username: newUser.username},
		 					{email: newUser.email}
						]
					};		 			
		 			db.collection("users").count(uniqueUserQuery, function(err, userExist){ //if user exists, don't do it, if it doesn't exist, create user.
		 				if(userExist) {
		 					return reply("username or email already exists", err);
		 				}
			     	db.collection("users").insert(newUser, function(err, writeResult){
			     		if(err) {
			     			return reply("you suck ass, usercreate FAIL");
			     		}
			     			reply(writeResult);
			     			console.log("sign up successful! awesome man!")
		   			});
		   		});
				})
			});
 		},
 		validate: {
 				payload: {
 					user: {
 						username: Joi.string().min(3).max(20).required(), 
 						email: Joi.string().email().max(50).required(),  
 						password: Joi.string().min(3).max(20).required(),
 					}
 				}
 		}

 		}
 	},

 ])

 next();
};

// give this file some attributes
exports.register.attributes = {
 name: 'users-route',
 version: '0.0.1'
}

