'use strict';

var express = require('express');
var session = require('express-session');
var router = express.Router();

var db = require('./home-db-queries');

module.exports = router;

router.get('/', function(request, response) {
	var onSuccess = onDbQuerySuccess(request, response);
	var onError = onDbQueryFail(request, response);

	db.queryTop10Popular(onSuccess, onError);
});

function onDbQuerySuccess(request, response) {
	return function(data) {
		console.log('Got Query data.');
		console.log(data);

		//FIXME: Needs to be an object housing 3 arrays (for Android, anyway):
		//1. Popular in Waterloo
		//2. Listings Near You
		//3. You Have Visited...

		response.status(200)
				.json(data);
	}
};

function onDbQueryFail(request, response) {
	return function(error) {
		console.log('Error.');
		console.log(error);

		response.sendStatus(500);
	}
};