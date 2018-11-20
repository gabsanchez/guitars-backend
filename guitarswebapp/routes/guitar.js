var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'), //used to manipulate POST
    redisClient = require('redis'),
    redis = redisClient.createClient(6379, 'redis');
    redis.on('connect', () => console.log('Connected to Redis') );
router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}));
//build the REST operations at the base for guitars
//this will be accessible from http://127.0.0.1:3000/blobs if the default route for / is left unchanged
router.route('/')
    //GET all guitars
    .get(function(req, res, next) {
        //retrieve all guitars from Monogo
        mongoose.model('Guitar').find({}, function (err, guitars) {
            if (err) {
                return console.error(err);
            } else {
                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                res.json(guitars);
            }     
        });
        
    })
    //POST a new guitar
    .post(function(req, res) {
        //call the create function for our database
        mongoose.model('Guitar').create({
            id: req.body.id,
            imageUrl: req.body.imageUrl,
            brand: req.body.brand,
            type: req.body.type,
            owner: req.body.owner,
            likes: req.body.likes
        }, function (err, guitar) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
              } else {
                  //a guitar has been created
                  console.log('POST creating new blob: ' + guitar);
                  res.json(guitar);
              }
        });
    });

    //GET the individual guitar
router.get('/:id/edit', function(req, res) {
    redis.get(req.params.id, (err, response) => {
        if (err) next(err);
        else if(response)//the guitar is in cache
            res.json(JSON.parse(response));
        else{
            //search for the guitar within Mongo
            mongoose.model('Guitar').findById(req.params.id, function (err, guitar) {
                if (err) {
                    console.log('GET Error: There was a problem retrieving: ' + err);
                } else {
                    //Set the guitar to the cache server and return the value
                    redis.set(req.params.id, JSON.stringify(guitar), function () {
                        res.json(guitar);
                    });
                }
            });
        }
    });
});

router.put('/:id/edit', function(req, res) {
    var newGuitar = {
        id: req.body.id,
        imageUrl: req.body.imageUrl,
        brand: req.body.brand,
        type: req.body.type,
        owner: req.body.owner,
        likes: req.body.likes
    }
    redis.set(req.params.id, JSON.stringify(newGuitar));
   //find the document by ID
        mongoose.model('Guitar').findById(req.params.id, function (err, guitar) {
            //update it
            guitar.update(newGuitar, function (err, guitarId) {
              if (err) {
                  res.send("There was a problem updating the information to the database: " + err);
              } 
              else {
                res.json(guitar);
               }
            })
        });
});

//DELETE a Blob by ID
router.delete('/:id/edit', function (req, res){
    //find blob by ID
    mongoose.model('Guitar').findById(req.params.id, function (err, guitar) {
        if (err) {
            return console.error(err);
        } else {
            //remove it from Mongo
            guitar.remove(function (err, guitar) {
                if (err) {
                    return console.error(err);
                } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + guitar._id);
                    res.json({message : 'deleted',
                        item : guitar
                    });
                }
            });
        }
    });
});
module.exports = router;