'use strict';
const {s3} = require('../utils/tovrshare-constants');
const {S3_BUCKET} = require('../utils/tovrshare-constants');

var roomDb = require('./room-db');

var pg = require('pg');
var express = require('express');
var aws = require('aws-sdk');
var router = express.Router();
var fs = require('fs');
var multerS3Disk = require('multer-s3');
var multer = require('multer');
var upload = multer({
    storage: multerS3Disk({
        s3: s3,
        bucket: S3_BUCKET,
        acl: 'public-read',
        metadata: function(request, file, cb) {
            cb(null, {fieldName : "file.fieldame"});
        },
        key: function(request, file, cb) {
            cb(null, file.originalname + "-" + Date.now().toString());
        }
    }),
    limits : {
        fieldSize : 25 * 1024 * 1024
    }
});

module.exports = router;

const fields = [{ name : 'image', maxCount: 7 }]

router.post('/add', function(request, response) {
    console.log("Starting multer");
    upload.fields(fields)(request, response, function(error) {
        printMulterErrorIfExists(request, response, error);
        
        var itemsToPersist = {};
        itemsToPersist.tourid = request.body.tourid;
        itemsToPersist.title = request.body.title || "Title"; //FIXME: should be a body part
        itemsToPersist.description = request.body.description || "Description"; //FIXME: should be a body part
        request.files.image.forEach(function(imageFile) {
            itemsToPersist[imageFile.originalname] = imageFile.location;
        });

        console.log(itemsToPersist);

        var onSuccess = function(data) {
            itemsToPersist.id = data.id;
            response.status(200)
                    .json(itemsToPersist);
        };

        var onFailure = function(error) {
            console.log(error);
            response.status(500)
                    .json({message : "Could not save room."});

        }
        roomDb.insertRoomValues(itemsToPersist, onSuccess, onFailure);
    });
});

function printMulterErrorIfExists(request, response, error) {
    console.log("Finished multer");
    if (error) {
        console.log("MULTER ERROR===================================");
        console.log(error);
        console.log("REQ BODY FOR MULTER ERR========================");
        console.log(request);

        response.status(500)
                .json({message : "Failed to upload files."});
        // throw error;
    }
}


var dbClient;
pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) {
    console.log('Cannot connect to database.');
    throw err;
  }

  dbClient = client;
  console.log('Connected to database.');
});

router.get('/roomsForTour/:tourid', function(request, response) {
    var tourid = parseInt(request.params.tourid);
    dbClient.query("SELECT * FROM rooms WHERE tourid = $1::int;", [tourid], function (err, result) {
        if (err) {
            console.log(err);
            response.status(500).send('');
        } else {
            response.status(200).json(result.rows);
        }
    });
});

// get roomid by tourid
router.get('/getRoomIDsByTourID/:tourid',function(req, res){
    var tourid = parseInt(req.params.tourid);
    var roomid = [];
    dbClient.query("SELECT id FROM rooms WHERE tourid = $1::int;", [tourid], function (err, result) {
        if (err) {
            res.status(500).send('');
        } else {
            for (var i = 0; i < result.rows.length; i++) {
                roomid.push(result.rows[i].id);
                console.log('roomid belong to the given tourid: ' + result.rows[i].id);
            }
            res.status(200).json({
                'roomid':roomid
            });
        }
    });
});


// get room info by room id
// image returns the link of the aws s3 image
router.get('/getRoomInfo/:roomid',function(req, res){
    var roomid = parseInt(req.params.roomid);
    dbClient.query("SELECT * FROM rooms WHERE id = $1::int;", [roomid], function (err, result) {
        if (err) {
            res.status(500).send('');
        } else if (!result.rows.length) {
            console.log('roomid does not exist in the room table');
            res.status(400).send('');
        } else {
            res.status(200).json({
                'id':result.rows[0].id,
                'tourid':result.rows[0].tourid,
                'image_posx':result.rows[0].image_posx,
                'image_posy':result.rows[0].image_posy,
                'image_posz':result.rows[0].image_posz,
                'image_negx':result.rows[0].image_negx,
                'image_negy':result.rows[0].image_negy,
                'image_negz':result.rows[0].image_negz,
                'original_pano' : result.rows[0].original_pano,
                'title':result.rows[0].title,
                'description':result.rows[0].description
            });
        }
    });
});

// post delete room by roomid
router.post('/deleteRoom/:roomid',function(req, res){
    var roomid = parseInt(req.params.roomid)
    // delete from rooms table
    dbClient.query('DELETE FROM rooms where id = $1::int;', [roomid]);
    res.status(200).send('');
});

// post addroom
// image token is a byte array
router.post('/addRoom/:tourid/:usertoken',function(req, res){
    var tourid = parseInt(req.params.tourid);
    var usertoken = req.params.usertoken;
    var title = JSON.stringify(req.headers['title']).substring(1, JSON.stringify(req.headers['title']).length-1);
    var description = JSON.stringify(req.headers['description']).substring(1, JSON.stringify(req.headers['description']).length-1);

    //TODO: If the image byte arrays have "data:image/png;base64," prefix, it is required to replace it with ""

    var image_posx = new Buffer(JSON.stringify(req.body['image_posx'].replace(/^data:image\/\w+;base64,/, "")),'base64'); // byte array
    var image_posy = new Buffer(JSON.stringify(req.body['image_posy'].replace(/^data:image\/\w+;base64,/, "")),'base64'); // byte array
    var image_posz = new Buffer(JSON.stringify(req.body['image_posz'].replace(/^data:image\/\w+;base64,/, "")),'base64'); // byte array
    var image_negx = new Buffer(JSON.stringify(req.body['image_negx'].replace(/^data:image\/\w+;base64,/, "")),'base64'); // byte array
    var image_negy = new Buffer(JSON.stringify(req.body['image_negy'].replace(/^data:image\/\w+;base64,/, "")),'base64'); // byte array
    var image_negz = new Buffer(JSON.stringify(req.body['image_negz'].replace(/^data:image\/\w+;base64,/, "")),'base64'); // byte array

    var imagetoken_posx = createLongToken();
    var imagetoken_posy = createLongToken();
    var imagetoken_posz = createLongToken();
    var imagetoken_negx = createLongToken();
    var imagetoken_negy = createLongToken();
    var imagetoken_negz = createLongToken();

    // // TODO: if you want to save buffer it self, remove .toString() here and below as well
    // fs.writeFileSync(imagetoken, image.toString(), 'ascii');

    // fs.readFile(imagetoken, function read(err, data) {
    //     if (err) {
    //         throw err;
    //     }
    //     // Invoke the next step here however you like
    //     console.log('image data')
    //     console.log(data);   // Put all of the code here (not the best solution)
    // });

    // TODO: if you want to save buffer it self, remove .toString() from Body here
    var s3Params_posx = {
        Bucket: S3_BUCKET,
        Key: imagetoken_posx,
        Body: image_posx,
        ACL: 'public-read',
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg' // comment out this if we want just a text
    };

    var s3Params_posy = {
        Bucket: S3_BUCKET,
        Key: imagetoken_posy,
        Body: image_posy,
        ACL: 'public-read',
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg' // comment out this if we want just a text
    };

    var s3Params_posz = {
        Bucket: S3_BUCKET,
        Key: imagetoken_posz,
        Body: image_posz,
        ACL: 'public-read',
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg' // comment out this if we want just a text
    };

    var s3Params_negx = {
        Bucket: S3_BUCKET,
        Key: imagetoken_negx,
        Body: image_negx,
        ACL: 'public-read',
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg' // comment out this if we want just a text
    };

    var s3Params_negy = {
        Bucket: S3_BUCKET,
        Key: imagetoken_negy,
        Body: image_negy,
        ACL: 'public-read',
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg' // comment out this if we want just a text
    };

    var s3Params_negz = {
        Bucket: S3_BUCKET,
        Key: imagetoken_negz,
        Body: image_negz,
        ACL: 'public-read',
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg' // comment out this if we want just a text
    };

    var params = [s3Params_posx, s3Params_posy, s3Params_posz, s3Params_negx, s3Params_negy, s3Params_negz]

    var image_url = 'https://s3.amazonaws.com/tovrshare/';
    var urls = [(image_url+imagetoken_posx).replace("'", "''"), (image_url+imagetoken_posy).replace("'", "''"), (image_url+imagetoken_posz).replace("'", "''"), (image_url+imagetoken_negx).replace("'", "''"), (image_url+imagetoken_negy).replace("'", "''"), (image_url+imagetoken_negz).replace("'", "''")]
    console.log(urls);
    // TODO: compute image

    console.log('tourid: ' + tourid);
    console.log('usertoken: ' + usertoken);
    console.log('title: ' + title);
    console.log('description: ' + description);

    dbClient.query("SELECT users.token, tours.id FROM users, tours WHERE users.token = $1::text AND tours.id = $2::int AND users.id = tours.userid;", [usertoken, tourid], function (err1, result1) {
        if (err1) {
            console.log('select from users and tours problem')
            res.status(500).send('');
        } else if (!result1.rows.length) {
            console.log('problems with tourid or usertoken');
            res.status(400).send(''); // userid doesn't exist or token does not match
        } else {
            dbClient.query('INSERT INTO rooms (tourid, title, description, image_posx, image_posy, image_posz, image_negx, image_negy, image_negz) VALUES ($1::int, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::text, $9::text);', [tourid, title, description, urls[0], urls[1], urls[2], urls[3], urls[4], urls[5]], function (err3, result3) {
                if (err3) {
                    console.log('insert fail');
                    console.log(err3);
                } else {
                    console.log('Inserted the new room');
                    dbClient.query("SELECT id FROM rooms WHERE image_posx = '" + urls[0] +"'", function (err2, result2) {
                        if (err2) {
                            console.log('select from rooms problem');
                            console.log(err2);
                            res.status(500).send(''); // sql error
                        }
                        else if (result2.rows.length) {
                            console.log('right before adding to aws s3')
                            var datas = []
                            var i;
                            for (i = 0; i < 6; ++i) {
                                console.log(params[i])
                                s3.putObject(params[i], (err3, data) => {
                                    if(err3){
                                        console.log(err3);
                                        console.log('s3 put object failed');
                                        dbClient.query('DELETE FROM rooms where id = $1::int;', [result2.rows[0].id]);
                                        res.status(500).send('');
                                        return;
                                    }
                                    var returnData = {
                                        signedRequest: data,
                                        url: urls[i]
                                    };
                                    datas.push(JSON.stringify(returnData));
                                });
                            }
                            res.status(200).json({
                                    'roomid':result2.rows[0].id,
                                    'result':datas,
                                    'url_posx': urls[0],
                                    'url_posy': urls[1],
                                    'url_posz': urls[2],
                                    'url_negx': urls[3],
                                    'url_negy': urls[4],
                                    'url_negz': urls[5]
                                }); // return the inserted token value
                        } else {
                            console.log('400');
                            res.status(400).send(''); // this shouldn't happen
                        }
                    });
                }
            });
        }
    });
});

function createLongToken() {
    var token = 'xxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });

    return token;
}