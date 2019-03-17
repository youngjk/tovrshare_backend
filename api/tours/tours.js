'use strict';
var db = require('./tours-db-queries');
var pgpErrors = require('../login/pgp-errors');
var sessionChecker = require('../session/tovrshare-session').checkForUserSession;

var pg = require('pg');
var express = require('express');
var bodyParser = require('body-parser');

var router = express.Router();
var jsonParser = bodyParser.json();

const POST_TOUR_REQ_SUCCESS_STATUS = 100;
const PUT_TOUR_REQ_SUCCESS_STATUS = 101;
const PUT_TOUR_REQ_FAILURE_STATUS = 102;

module.exports = router;

router.get('/search', function(request, response) {
    var searchQuery = request.query.query;
    
    var onSuccess = function(data) {
        response.status(200)
                .json(data);
    };

    var onFailure = function(error) {
        console.log("Error: could not query for tours for search text: " + searchQuery);
        console.log(error);
        var jsonOutput = {
            message : "Tour could not be found on the server."
        };

        response.status(404)
                .json(jsonOutput);  
    };

    db.queryForToursByTitle(searchQuery, onSuccess, onFailure);
});

router.get('/me', sessionChecker, function(request, response) {
    var userid = request.session.userid;

    var onSuccess = function(data) {
        response.status(200)
                .json(data);
    }

    var onFailure = function(error) {
        console.log("Error: could not query for tours made by userid " + userid);
        console.log(error);
        var jsonOutput = {
            message : "Tour could not be found on the server."
        };

        response.status(404)
                .json(jsonOutput);  
    };

    db.queryForToursByUserId(userid, onSuccess, onFailure);
});

// post create tour
router.post('/createTour', sessionChecker, jsonParser, function(req, res){
    var parsedBody = {
        title : req.body.title,
        price : req.body.price,
        banner_url : '', //FIXME: this gets modified later
        description : req.body.description,
        start_date : "2018-03-01",  //FIXME: should get from network. Network obj as availability as a string //Needs to be this format.
        end_date : "2018-04-01", //FIXME: should get from network. Network obj as availability as a string,
        availability: req.body.availability,
        owner_uuid : req.session.userid || "106016967085247236201", //FIXME: don't commit
        amenities_is_furnished : req.body.amenities.furnished,
        amenities_has_internet : req.body.amenities.internet,
        amenities_has_hydro : req.body.amenities.hydro,
        amenities_has_water : req.body.amenities.water,
        amenities_has_laundry : req.body.amenities.laundry,
        amenities_has_ensuite_washroom : req.body.amenities.ensuite_washroom,
        is_live : false,
        created_at : Date.now()
    };

    var onSuccess = function(data) {
        console.log(data);
        res.status(200)
            .json({
                id : data.id,
                message : "Success"
            });
    };

    var onFailure = function(error) {
        console.log(error);
        res.status(500)
            .json({
                message : "Could not save tour."
            });
    }

    db.createTourWithObject(parsedBody, onSuccess, onSuccess);
});

router.put('/createTour', sessionChecker, jsonParser, function(req, res) {
    console.log(req.body);

    var parsedBody = {
        id : req.body.id,
        title : req.body.title,
        price : req.body.price,
        banner_url : '', //FIXME: Fetch this via query on rooms.
        description : req.body.description,
        start_date : "2018-03-01",  //FIXME: should get from network. Network obj as availability as a string. Needs to be this format.
        end_date : "2018-04-01", //FIXME: should get from network. Network obj as availability as a string,
        availability : req.body.availability,
        owner_uuid : req.session.userid,
        amenities_is_furnished : req.body.amenities.furnished,
        amenities_has_internet : req.body.amenities.internet,
        amenities_has_hydro : req.body.amenities.hydro,
        amenities_has_water : req.body.amenities.water,
        amenities_has_laundry : req.body.amenities.laundry,
        amenities_has_ensuite_washroom : req.body.amenities.ensuite_washroom,
        is_live : true,
        created_at : Date.now()
    };

    var onError = function(error) {
        console.log(error);
        res.status(500)
            .json({
                status: PUT_TOUR_REQ_FAILURE_STATUS,
                message : "Could not finish making tour."
            });
    }

    var onGetBannerError = function(error) {
        if (error instanceof pgpErrors.QueryResultError) {
            if (error.code == pgpErrors.errorCodes.noData) {
                parsedBody.banner_url = '';

                var onUpdateSuccess = function(results) {
                    console.log(results);

                    res.status(200)
                        .json({
                            status : PUT_TOUR_REQ_SUCCESS_STATUS,
                            message : "Success.",
                            id : results.id
                        });
                }

                console.log("hitting tour update");
                db.updateTourWithId(parsedBody, onUpdateSuccess, onError);
            }
        } else {
            console.log(error);
            res.status(500)
                .json({
                    status: PUT_TOUR_REQ_FAILURE_STATUS,
                    message : "Could not finish making tour."
                });
        }
    }

    var onSuccess = function(data) {
        parsedBody.banner_url = data.image_posx;
        console.log(data);

        var onUpdateSuccess = function(results) {
            res.status(200)
                .json({
                    status : PUT_TOUR_REQ_SUCCESS_STATUS,
                    message : "Success.",
                    id : results.id
                })
        }

        console.log("hitting tour update")
        db.updateTourWithId(parsedBody, onUpdateSuccess, onError);
    };

    console.log("hitting banner link")
    db.getBannerLinkForTourId(parsedBody.id, onSuccess, onGetBannerError);
});

router.delete('/:id', sessionChecker, function(request, response){
    var params = {
        id : request.params.id,
        userid : request.session.userid
    };

    var onSuccess = function(data) {
        console.log(data);
        response.status(200)
                .json({
                    message : "Success"
                });
    };

    var onFailure = function(error) {
        console.log(error);
        var jsonOutput = {
            message : "Failed to delete tour from server."
        };

        response.status(404)
                .json(jsonOutput);  
    }

    db.deleteTourBelongingToUser(params, onSuccess, onFailure);
});

router.get('/:id', function(request, response) {
    var tourId = request.params.id;

    var onSuccess = function(data) {
        if (data.is_live ||
            (!data.is_live && request.session.userid == data.listing_owner)) {
            var jsonOutput = {
                id : data.id,
                title : data.listing_title,
                price : data.listing_price,
                description : data.listing_description,
                availability : data.availability_alt,
                banner_url : data.listing_banner_url,
                owner : {
                    id : data.listing_owner,
                    first_name : data.first_name,
                    last_name : data.last_name,
                    email : data.email,
                    profile_picture_url : data.profile_picture_url
                },
                amenities : {
                    furnished : data.amenities_is_furnished,
                    internet : data.amenities_has_internet,
                    hydro : data.amenities_has_hydro,
                    water : data.amenities_has_water,
                    laundry : data.amenities_has_laundry,
                    ensuite_washroom : data.amenities_has_ensuite_washroom
                }
            };

            response.status(200)
                    .json(jsonOutput);
        } else {
            response.status(404)
                    .json({
                        message : "Tour is not available for viewing."
                    });
        }
    };

    var onFailure = function(error) {
        console.log("Error: could not query for tour at id " + tourId);
        console.log(error);
        var jsonOutput = {
            message : "Tour could not be found on the server."
        };

        response.status(404)
                .json(jsonOutput);
    };

    db.queryForTourById(tourId, onSuccess, onFailure);
});

//==========================================================================
// Get Tour By listing_banner_url
//==========================================================================

router.get('/getByBannerURL/:banner_url', function(request, response) {
    var bannerUrl = request.params.banner_url;

    var onSuccess = function(data) {
        var jsonOutput = {
            id : data.id,
            title : data.listing_title,
            price : data.listing_price,
            description : data.listing_description,
            availability : data.start_date + " - " + data.end_date,
            banner_url : data.listing_banner_url,
            owner : {
                id : data.listing_owner,
                first_name : data.first_name,
                last_name : data.last_name
            },
            amenities : {
                furnished : data.amenities_is_furnished,
                internet : data.amenities_has_internet,
                hydro : data.amenities_has_hydro,
                water : data.amenities_has_water,
                laundry : data.amenities_has_laundry,
                ensuite_washroom : data.amenities_has_ensuite_washroom
            }
        };

        response.status(200)
                .json(jsonOutput);
    };

    var onFailure = function(error) {
        console.log("Error: could not query for tour at banner_url " + bannerUrl);
        console.log(error);
        var jsonOutput = {
            message : "Tour could not be found on the server."
        };

        response.status(404)
                .json(jsonOutput);
    };

    db.queryForTourByBannerURL(bannerUrl, onSuccess, onFailure);
});

//

var dbClient;
pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) {
    console.log('Cannot connect to database.');
    throw err;
  }

  dbClient = client;
  console.log('Connected to database.');
});

// get tourid by userid
router.get('/getTourIDs', sessionChecker, function(req, res) {
    var userid = req.session.userid;
    var tourid = [];
    dbClient.query("SELECT id FROM propertylistings WHERE userid = $1::int;", [userid], function (err, result) {
        if (err) {
            res.status(500).send('');
        } else {
            for (var i = 0; i < result.rows.length; i++) {
                tourid.push(result.rows[i].id);
                console.log('tourid belong to the given userid: ' + result.rows[i].id);
            }
            res.status(200).json({
                'tourid':tourid
            });
        }
    });
});

function parseBool(val)
{
    if ((typeof val === 'string' && (val.toLowerCase() === 'true' || val.toLowerCase() === 'yes')) || val === 1)
        return true;
    else if ((typeof val === 'string' && (val.toLowerCase() === 'false' || val.toLowerCase() === 'no')) || val === 0)
        return false;

    return null;
}

function createLongToken() {
    var token = 'xxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });

    return token;
}