'use strict';
const {OAUTH_CLIENT_ID} = require('../utils/tovrshare-constants');
const {OAuth2Client} = require('google-auth-library');
const googleOauthClient = new OAuth2Client(OAUTH_CLIENT_ID);

var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var router = express.Router();

var db = require('./db-queries');
var pgpErrors = require('./pgp-errors');
var tsSession = require('../session/tovrshare-session');

module.exports = router;

var urlEncodedParser = bodyParser.urlencoded({ extended: false });

router.post('/', urlEncodedParser, function(request, response) {
	if (!request.body) {
		var jsonOutput = {
			message : "Need a valid id token."
		};

		response.status(400)
				.json(jsonOutput);
	}

	var idToken = request.body.id_token;
	
	verifyGoogleOAuthToken(idToken).then(function(googleUserAccount) {
		var dbSuccessCallback = onDbQuerySuccess(request, response);
		var dbErrorCallback = onDbQueryFail(request, response, googleUserAccount);

		db.queryForUser(googleUserAccount.userId, 
						dbSuccessCallback, 
						dbErrorCallback);
	}).catch(function(error) {
		console.log('---Failed verifying user from google----');
		console.log(error);

		var jsonOutput = {
			message : "Failed to validate the OAuth token."
		};

		response.status(400)
				.json(jsonOutput);
	});
});


//FIXME: Delete this
router.get('/test', tsSession.checkForUserSession, function(request, response) {
	console.log("Woohoo!!");
	console.log(request.session);

	var payload = {
		authenticated : request.session.authenticated,
		email : request.session.email
	};

	response.send(JSON.stringify(payload));
});

//==========================================================================
// Google Auth Code
//==========================================================================

async function verifyGoogleOAuthToken(loginIdToken) {
  const ticket = await googleOauthClient.verifyIdToken({
      idToken: loginIdToken,
      audience: OAUTH_CLIENT_ID
  });
  const payload = ticket.getPayload();

  return {
  	userId: payload['sub'],
  	email: payload['email'],
  	name: payload['name'],
  	profilePicture: payload['picture'],
  	firstName: payload['given_name'],
  	lastName: payload['family_name']
  }
}

function onDbQuerySuccess(request, response) {
	return function(result) {
		console.log('User exists. Authenticating session');
		console.log(result);
		
		authenticateSession(request, result);
		var jsonOutput = {
			message : "success",
			userid : result.guuid,
			email : result.email,
			full_name : result.full_name,
			first_name : result.first_name,
			last_name : result.last_name,
			profile_picture_url: result.profile_picture_url
		};

		response.status(200)
				.json(jsonOutput);
	};
}

function onDbQueryFail(request, response, googleUserAccount) {
	var dbCreateSuccessCallback = function(result) {
		console.log("New user created with uuid: " + result.guuid);

		authenticateSession(request, result);
		var jsonOutput = {
			message : "success",
			userid : result.guuid,
			email : result.email,
			full_name : result.full_name,
			first_name : result.first_name,
			last_name : result.last_name,
			profile_picture_url: result.profile_picture_url
		};

		response.status(200)
				.json(jsonOutput);
	};

	var dbCreateFailCallback = function(error) {
		console.log("Failed to create new user");
		console.log(error);
		var jsonOutput = {
			message : "Failed to create new user account."
		};

		response.status(500)
				.json(jsonOutput);
	};

	var errorCallback = function(error) {
		if (error instanceof pgpErrors.QueryResultError) {
			if (error.code == pgpErrors.errorCodes.noData) {
				//User does not exist
				console.log('Creating new user for google user: ');
				console.log(googleUserAccount);

				db.createNewUser(googleUserAccount, 
								 dbCreateSuccessCallback, 
								 dbCreateFailCallback);
			} else {
				console.log(error);
				response.sendStatus(500);
			}
		} else {
			console.log(error);
			response.sendStatus(500);
		}
	};


	return errorCallback;
}

function authenticateSession(request, result) {
	request.session.authenticated = true;
	request.session.userid = result.guuid;
	request.session.email = result.email;
	request.session.firstname = result.first_name;
	request.session.lastname = result.last_name;
	request.session.save();

	return request;
}