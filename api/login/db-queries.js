'use strict';

const {tsDb} = require('../utils/tovrshare-constants');

module.exports = {
	queryForUser : queryForUser,
	createNewUser : createNewUser
};

function queryForUser(googleUuid, onSuccess, onError) {
	tsDb.one('SELECT * FROM accounts WHERE guuid = $1', googleUuid)
	.then(onSuccess)
	.catch(onError);
}

function createNewUser(googleUser, onSuccess, onError) {
	tsDb.one('INSERT INTO accounts (guuid, email, full_name, profile_picture_url, first_name, last_name) ' +
			'VALUES($1,$2,$3,$4,$5,$6) RETURNING guuid, email, full_name, first_name, last_name, profile_picture_url',
			[googleUser.userId, googleUser.email, googleUser.name, 
			googleUser.profilePicture, googleUser.firstName, googleUser.lastName])
		.then(onSuccess)
		.catch(onError);
}