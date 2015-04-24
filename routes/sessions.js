
exports.register = function(server, options, next) { //everything after register is loaded in "register" in index.js.
 
var Bcrypt = require('bcrypt'); // require would make it look into the node modules.
// var Joi 	 = require('joi'); //because it's a library. Help us to distinguish betw variable, and variable leading to library.
var Auth = require('./auth')

 //include routes

 server.route([
 	
 	{ //logging in
 		method: 'POST',
 		path: '/sessions', 
 		handler: function(request, reply) { //ALWAYS request reply here.

			//load the mongoDB
			var db = request.server.plugins['hapi-mongodb'].db;

			//read the payload
			var user = request.payload.user; //user is for the stuff that goes in postman, eg. user[username] : wilzon	

			//find if the user exists
			db.collection("users").findOne({"username": user.username}, function(err, userMongo) {
				if(err) {return reply ("Internal MongoDB error", err);}

				if(userMongo === null) {
					return reply({"message": "User doesn't exist"});
				// } else {return reply ("great success! username exists!");
				}

				Bcrypt.compare(user.password, userMongo.password, function(err, matched){
					if(matched) {
				 	//return reply ("great success! username exists! AUTHORIZE!*");
					
					// if password matches, authenticate user and add to cookie
					function randomKeyGenerator() {
						return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
					}
					// Generate a random key. Below is a common way of generating random key.
					var randomKey = (randomKeyGenerator() + randomKeyGenerator() + "-" + randomKeyGenerator() + "-4" + randomKeyGenerator().substr(0,3) + "-" + randomKeyGenerator() + "-" + randomKeyGenerator() + randomKeyGenerator() + randomKeyGenerator()).toLowerCase();

					var newSession = {
						"session_id" :randomKey,
						"user_id": userMongo._id,
					}

					db.collection("sessions").insert(newSession, function(err, writeResult) {
						if(err) {return reply("Internal MongoDB error", err);}

						// store the Session info in the browser Cookie with request sessions et.
						// we can do this because we have Yar

						request.session.set("hapi_ticketz_session", { //name of hapi twitter session doesn't really matter. We are setting it to this name. WE WILL BE REFERENCING THIS LATER!
							"session_key": randomKey,
							"user_id": userMongo._id
						});
						return reply(writeResult);
					});
					} else {
						reply({ "message":"Not authorized"});
					}
				});
			})
 		}
 	},

 	{
 		method: "GET",
 		path: "/authenticated",
 		handler: function(request, reply) {
 			Auth.authenticated(request, function(result) //authenticated is a name we came up with that will be referenced elsewhere.
 				{
 					reply(result);
 				});
 		}
 	},

//logout / DELETE!
 	{
 		method: "DELETE",
 		path: "/sessions",
 		handler: function(request, reply) {
 			//obtain the session
 			var session = request.session.get("hapi_ticketz_session"); //hapi_twitter session was defined earlier, in login request.
 			//initialize db
 			var db = request.server.plugins["hapi-mongodb"].db;
 			//check if session exists
 			if(!session) {
 				return reply({"message":"Already logged out / never logged in"}); // return will terminate the rest of the program.
 			}
 			//remove that session in the db
			db.collection("sessions").remove({"session_id": session.session_key}, function(err, writeResult) {
				if(err) {return reply("Internal MongoDB error", err);}
				return reply(writeResult);
				
			});
			}
 		}

 ])

 next();
};

// give this file some attributes
exports.register.attributes = { 
 name: 'sessions-route',
 version: '0.0.1'
}

