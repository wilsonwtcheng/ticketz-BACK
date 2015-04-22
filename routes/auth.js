

module.exports ={};

module.exports.authenticated =function(request, callback) {
		//retrieve the session information from the browser
 			var session = request.session.get("hapi_ticketz_session"); //the session here is the cookie.
 			
 			//check if session exists
 			if(!session) {
 				return callback({
 				"message":"No session: already logged out / never logged in",
 				"authenticated" : false
 				}); // return will terminate the rest of the program.
 			}

 			var db = request.server.plugins["hapi-mongodb"].db
 			db.collection("sessions").findOne({"session_id": session.session_key}, function(err, result){
 				if (result === null) {
 					return callback( {
	 				"message":"Session not found in database. Already logged out / never logged in?",
	 				"authenticated" : false
 					});
				} else {
						return callback( { 
		 				"message":"Hey! You are LOGGED IN!",
		 				"authenticated" : true
 						});
				}
 			});

}