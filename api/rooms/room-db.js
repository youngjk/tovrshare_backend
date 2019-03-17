'use strict';

const {tsDb} = require('../utils/tovrshare-constants');

module.exports = {
	insertRoomValues : insertRoomValues
};

function insertRoomValues(values, onSuccess, onError) {
	tsDb.one(insertRoomValuesQuery, [values.tourid, values.image_posx, values.image_posy, values.image_posz,
									 values.image_negx, values.image_negy, values.image_negz,
									 values.title, values.description, values.original_pano])
		.then(onSuccess)
		.catch(onError);
};

const insertRoomValuesQuery = "INSERT INTO rooms(tourid, image_posx, image_posy, \
												image_posz, image_negx, image_negy, image_negz, \
												title, description, original_pano) \
								VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) \
								RETURNING id";
