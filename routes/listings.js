// routes/listings.js

var Joi = require('joi');
var Auth = require('./auth'); // Why do we need this? Because seller needs to be authenticated to do some commands.

exports.register = function(server, options, next) {
  server.route([

    {
      // Retrieve all listings
      method: 'GET',
      path: '/listings',
      handler: function(request, reply) {
        var db = request.server.plugins['hapi-mongodb'].db;

        db.collection('listings').find().toArray(function(err, listings) {
          if (err) { return reply('Internal MongoDB error', err); }
          reply(listings);
        });
      }
    },

    {
      // Retrieve one listing
      method: 'GET',
      path: '/listings/{id}',
      handler: function(request, reply) {
        var listing_id = encodeURIComponent(request.params.id);
        var db = request.server.plugins['hapi-mongodb'].db;
        var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;
        db.collection('listings').findOne({ "_id": ObjectId(listing_id)}, function(err, listing) {
          if (err) { return reply('Internal MongoDB error', err); }
          reply(listing);
        })
      }
    },

    {
      // Create a new listing
      method: 'POST',
      path: '/listings',
      config: {
        handler: function(request, reply) {
          Auth.authenticated(request, function(result) {
            if (result.authenticated) {
              var db = request.server.plugins['hapi-mongodb'].db;
              var session = request.session.get('hapi_twitter_session');
              var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;
              var listing = { 
                "message": request.payload.listing.message,
                "user_id": ObjectId(session.user_id)
                //** note: this needs to be expanded to include more fields, such as dates, remarks, etc.
              };
              db.collection('listings').insert(listing, function(err, writeResult) {
                if (err) { return reply('Internal MongoDB error', err); }
                reply(writeResult);
              });
            } else {
              reply(result.message);
            }
          });
        },
        validate: {
          payload: {
            listing: {
              // Required, Limited to 140 chars
              message: Joi.string().max(140).required()
            //need to add stuff here for other parameters. Eg. max length for remark
            }
          }
        }
      }
    },

    {
      // Delete one listing
      method: 'DELETE',
      path: '/listings/{id}',
      handler: function(request, reply) {
        Auth.authenticated(request, function(result) {
          if (result.authenticated) {
            var listing_id = encodeURIComponent(request.params.id);

            var db = request.server.plugins['hapi-mongodb'].db;
            var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;

            db.collection('listings').remove({ "_id": ObjectId(listing_id) }, function(err, writeResult) {
              if (err) { return reply('Internal MongoDB error', err); }

              reply(writeResult);
            });
          } else {
            reply(result.message);
          }
        });
      }
    },

    // {
  // Retrieve all listings by a specific user. Note: haven't done frontend for this. black out: apparent conflict with listings/{id}
    //   method: 'GET',
    //   path: '/listings/{username}',
    //   handler: function(request, reply) {
    //     var db = request.server.plugins['hapi-mongodb'].db;
    //     var username = encodeURIComponent(request.params.username);

    //     db.collection('users').findOne({ "username": username }, function(err, user) {
    //       if (err) { return reply('Internal MongoDB error', err); }

    //       db.collection('listings').find({ "user_id": user._id }).toArray(function(err, listings) {
    //         if (err) { return reply('Internal MongoDB error', err); }

    //         reply(listings);
    //       });
    //     })
    //   }
    // },


  ]);

  next();
};

exports.register.attributes = {
  name: 'listings-route',
  version: '0.0.1'
};




//    { //Retrieve all listings WC
//      method: 'GET',
//      path: '/listings',
//      handler: function(request, reply) {
//       var db = request.server.plugins['hapi-mongodb'].db;
//       db.collection("listings").find().toArray(function(err, users) {
//         if(err) { 
//           return reply('Internal MongoDB error', err); 
//         }
//           reply(users);
//           console.log("great success! All the listings.");
//       })
//      }
//    },

//     { //get listings WC
//       method: "GET",
//       path: "/listings/{wooWooWoo}", 
//       handler: function(request, reply) {
//         var id       = encodeURIComponent(request.params.wooWooWoo); //make sure it doesn't have weird stuff inside. you need the encode thing if you want to use MONGO.        
//         var db       = request.server.plugins['hapi-mongodb'].db;    
//         var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;    

//         db.collection("listings").findOne( {"_id" :ObjectID(id) }, function(err, obtainedlisting) { //inside the function, err is the err, the second thing is the result.
//         if (err) throw err;
//         reply(obtainedlisting);
//           console.log("Obtained listing! success!")
//       });    
//       }
//     }, 

// //**
//   { //WC WIP OF listing
//     method: 'POST',
//     path: '/listing',
//     config: {
//     handler: function(request, reply) { //ALWAYS request reply here.
//       var newUser = request.payload.userInfo;
//       var db = request.server.plugins['hapi-mongodb'].db;

//       Bcrypt.genSalt(10, function(err, salt){
//         Bcrypt.hash(newUser.password, salt, function(err, hash){ //newUser.password accesses the password
//           newUser.password = hash;
//           var uniqueUserQuery = {
//             $or: [ //or, count the number of matching username or matching email.
//               {username: newUser.username},
//               {email: newUser.email}
//             ]
//           };          
//           db.collection("users").count(uniqueUserQuery, function(err, userExist){ //if user exists, don't do it, if it doesn't exist, create user.
//             if(userExist) {
//               return reply("username or email already exists", err);
//             }
//             db.collection("users").insert(newUser, function(err, writeResult){
//               if(err) {
//                 return reply("you suck ass, usercreate FAIL");
//               }
//                 reply(writeResult);
//                 console.log("awesome man!")
//             });
//           });
//         })
//       });
//     },
//     validate: {
//         payload: {
//           userInfo: {
//             username: Joi.string().min(3).max(20).required(), 
//             email: Joi.string().email().max(50).required(),  
//             password: Joi.string().min(3).max(20).required(),
//           }
//         }
//     }
//     }
//   },