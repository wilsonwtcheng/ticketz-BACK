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
              var session = request.session.get('hapi_ticketz_session');
              var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;
              db.collection('users').findOne({ "_id": ObjectId(session.user_id) }, function(err, user) {
                if (err) { return reply('Internal MongoDB error', err); }
                var listing = { 
                  "user_id": ObjectId(session.user_id),
                  "username": user.username, 
                  "fritix": request.payload.listing.fritix,
                  "sattix": request.payload.listing.sattix,
                  "suntiX": request.payload.listing.suntix,
                  "friprice": request.payload.listing.friprice,
                  "satprice": request.payload.listing.satprice,
                  "sunprice": request.payload.listing.sunprice,
                  "dateposted": new Date,      
                  "remarks": request.payload.listing.remarks,
                };
              db.collection('listings').insert(listing, function(err, writeResult){
                if(err) {
                  return reply('Internal MongoDB error', err);
                } else {
                  reply(writeResult);
                }
              });
            });
          } else {
            // reply that user is not authenticated
            reply(result);
          }
        });
      },
        validate: {
          payload: {
            listing: {
              // Required, Limited to 500 chars
              fritix: Joi.number().integer().min(1).max(5), // .required(),   
              sattix: Joi.number().integer().min(1).max(5), // .required(),   
              suntix: Joi.number().integer().min(1).max(5), // .required(),   
              friprice: Joi.number().integer().min(1).max(2000), // .required(),  
              satprice: Joi.number().integer().min(1).max(2000), // .required(),  
              sunprice: Joi.number().integer().min(1).max(2000), // .required(),  
              remarks: Joi.string().min(1).max(500),
            }
          }
        }
      }
    },

   {
      // Create a new tweet
      method: 'POST',
      path: '/tweets',
      config: {  
        handler: function(request, reply) {
          // first authenticate the user
          Auth.authenticated(request, function(result){
            if(result.authenticated) {
              // post the tweet
              var db = request.server.plugins['hapi-mongodb'].db;
              var session = request.session.get('hapi_twitter_session');
              var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;

              db.collection('users').findOne({ "_id": ObjectId(session.user_id) }, function(err, user) {
                if (err) { return reply('Internal MongoDB error', err); }
                
                var tweet = {
                  'message': request.payload.tweet.message,
                  'user_id': ObjectId(session.user_id),
                  'username': user.username
                };

                db.collection('tweets').insert( tweet, function(err, writeResult){
                  if(err) {
                    return reply('Internal MongoDB error', err);
                  } else {
                    reply(writeResult);
                  }
                });
              });
            } else {
              // reply that user is not authenticated
              reply(result);
            }
          });
        },
        validate: {
          payload: {
            tweet: {
              message: Joi.string().max(140).required(),
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
