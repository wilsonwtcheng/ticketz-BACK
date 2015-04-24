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

//    {

    //   // Retrieve all listings for friday?
    //   method: 'GET',
    //   path: '/listings/{id}',
    //   handler: function(request, reply) {
    //     var listing_id = encodeURIComponent(request.params.id);
    //     var db = request.server.plugins['hapi-mongodb'].db;
    //     var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;
    //     db.collection('listings').findOne({ "_id": ObjectId(listing_id)}, function(err, listing) {
    //       if (err) { return reply('Internal MongoDB error', err); }
    //       reply(listing);
    //     })
    //   }
    // },


    {
      // Create a new listing
      method: 'POST',
      path: '/listings',
      config: {
        handler: function(request, reply) {
         // console.log(request.payload);
          Auth.authenticated(request, function(result) {
            if (result.authenticated) {
              var db = request.server.plugins['hapi-mongodb'].db;
              var session = request.session.get('hapi_ticketz_session');
              var ObjectId = request.server.plugins['hapi-mongodb'].ObjectID;
              //load db collection users in order to retrieve username (so user.username would work here).
              db.collection('users').findOne({ "_id": ObjectId(session.user_id) }, function(err, user) {
                if (err) { return reply('Internal MongoDB error', err); }
                var listing = { 
                 // "user_id": ObjectId(session.user_id),
                  "fritix": request.payload.listing.fritix,
                  "sattix": request.payload.listing.sattix,
                  "suntix": request.payload.listing.suntix,
                  "friprice": request.payload.listing.friprice,
                  "satprice": request.payload.listing.satprice,
                  "sunprice": request.payload.listing.sunprice,
                  "dateposted": new Date(),      
                  "username": user.username, 
                  "contactinfo": request.payload.listing.contactinfo, 
                  "remarks": request.payload.listing.remarks,
                  //"contact details":
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
              fritix: Joi.number().integer().max(20).allow(''),    
              sattix: Joi.number().integer().max(20).allow(''),    
              suntix: Joi.number().integer().max(20).allow(''),    
              friprice: Joi.number().integer().max(2000).allow(''),   
              satprice: Joi.number().integer().max(2000).allow(''),   
              sunprice: Joi.number().integer().max(2000).allow(''),   
              contactinfo: Joi.string().max(500).required(),  
              remarks: Joi.string().max(500).allow(''),
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

    { // SEARCH function for REMARKS
      method: 'GET',
      path: '/listings/search/remarks/{searchQuery}', 
      handler: function (request, reply) { 
        var db = request.server.plugins['hapi-mongodb'].db;  
        db.collection('listings').createIndex( { remarks: "text" } );   
        var query = { $text: { $search: request.params.searchQuery} }; 
        db.collection('listings').find(query).toArray(function(err, result){ 
          if (err) throw err;
          reply(result); 
        });
      }
    },

    { // SEARCH function by USERS
      method: 'GET',
      path: '/listings/search/users/{searchQuery}', 
      handler: function (request, reply) { 
        var db = request.server.plugins['hapi-mongodb'].db;  
        db.collection('listings').createIndex( { username: "text" } );   
        var query = { $text: { $search: request.params.searchQuery} }; 
        db.collection('listings').find(query).toArray(function(err, result){ 
          if (err) throw err;
          reply(result); 
        });
      }
    },

    { // SEARCH function by number of FRIDAY tix
      method: 'GET',
      path: '/listings/search/friday/{searchQuery}', 
      handler: function (request, reply) { 
        var db = request.server.plugins['hapi-mongodb'].db;  
        var query = {fritix: Number(request.params.searchQuery)};

        db.collection('listings').find(query).toArray(function(err, result){ 
          if (err) throw err;
          reply(result); 
        });
      }
    },

    { // SEARCH function by number of SATURDAY tix
      method: 'GET',
      path: '/listings/search/saturday/{searchQuery}', 
      handler: function (request, reply) { 
        var db = request.server.plugins['hapi-mongodb'].db;  
        var query = {sattix: Number(request.params.searchQuery)};

        db.collection('listings').find(query).toArray(function(err, result){ 
          if (err) throw err;
          reply(result); 
        });
      }
    },

    { // SEARCH function by number of SUNDAY tix
      method: 'GET',
      path: '/listings/search/sunday/{searchQuery}', 
      handler: function (request, reply) { 
        var db = request.server.plugins['hapi-mongodb'].db;  
        var query = {suntix: Number(request.params.searchQuery)};

        db.collection('listings').find(query).toArray(function(err, result){ 
          if (err) throw err;
          reply(result); 
        });
      }
    },

    { // Show all friday tix NEW
      method: 'GET',
      path: '/listings/search/friday', 
      handler: function (request, reply) { 
        var db = request.server.plugins['hapi-mongodb'].db;  
        db.collection('listings').find({fritix: {$gt: 0}}).toArray(function(err, result){ 
          if (err) throw err;
          reply(result); 
        });
      }
    },

    // { // Show all friday tix
    //   method: 'GET',
    //   path: '/listings/search/friday', 
    //   handler: function (request, reply) { 
    //     var db = request.server.plugins['hapi-mongodb'].db;  
    //     db.collection('listings').find().toArray(function(err, result){ 
    //       if (err) throw err;
    //       reply(result); 
    //     });
    //   }
    // },

    { // Show all saturday tix
      method: 'GET',
      path: '/listings/search/saturday', 
      handler: function (request, reply) { 
        var db = request.server.plugins['hapi-mongodb'].db;  
        db.collection('listings').find({sattix: {$gt: 0}}).toArray(function(err, result){ 
          if (err) throw err;
          reply(result); 
        });
      }
    },

    { // Show all sunday tix
      method: 'GET',
      path: '/listings/search/sunday', 
      handler: function (request, reply) { 
        var db = request.server.plugins['hapi-mongodb'].db;  
        db.collection('listings').find({suntix: {$gt: 0}}).toArray(function(err, result){ 
          if (err) throw err;
          reply(result); 
        });
      }
    }

  ]);

  next();
};

exports.register.attributes = {
  name: 'listings-route',
  version: '0.0.1'
};
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



    
  //       { // SEARCH QUOTES
  //     method: 'GET',
  //     path: '/quotes/search/{searchQuery}', //has to match the stuff after request.params.  (it's how you access it). You have to wrap it in {}. Whatever the usertype there you can access it.
  //     handler: function (request, reply) { // eg. Postman is a request. User sends the request. Thru postman or front-end. Reply is the output. It's what the server gives back to the user. The first thing is the request, second thing is the reply, no matter what you call them. Eg. if you call the first thing inside the function "bullshit", it will still be a request.
  //       var db = request.server.plugins['hapi-mongodb'].db; //connecting nitrous to mongo database. the "db" in "var db" corresponds to the "Db" in "db.collection". the .db is just convention for accessing the database. It knows what db because we named it in index.js! 
  //       db.collection('quotes').createIndex( { quote: "text" } );   //payload is when you put (usually) the key:value pair into an input box. params is when you access it through the url bar.
  //       var query = { "$text": { "$search": request.params.searchQuery} }; //looks into the url bar for the searchquery.
  //       db.collection('quotes').find(query).toArray(function(err, result){ //got nitrous to read the stuff, you have to put it in an array. otherwise it just reads it as a bunch of strings. callback is like "can you send me a response after you've done everything". e.g. to the server(DIMPLE):  find your phonebook, find fer's number (dimple knows I'm looking for fer's number because i wrote it in the url), put it into a format i like, after you done all that, send it back to me user.
  //         if (err) throw err;
  //         reply(result); //you only want it to reply when it's successful (ie. no errors). to do this, run the "callback" function.
  //       });
  //     }
  //   }
  // ]);
