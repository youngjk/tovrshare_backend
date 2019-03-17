'use strict';

const {tsDb} = require('../utils/tovrshare-constants');

var tourListCardUtils = require('../utils/tour-list-card');
var tourListCardMapper = tourListCardUtils.mapper();

module.exports = {
	queryForTourById : queryForTourById,
	queryForTourByBannerURL : queryForTourByBannerURL,
	queryForToursByUserId : queryForToursByUserId,
	queryForToursByTitle : queryForToursByTitle,
	createTourWithObject : createTourWithObject,
	getBannerLinkForTourId : getBannerLinkForTourId,
	updateTourWithId : updateTourWithId,
	deleteTourBelongingToUser : deleteTourBelongingToUser
};

function queryForTourById(tourId, onSuccess, onError) {
	tsDb.one(findTourByIdQuery, tourId)
		.then(onSuccess)
		.catch(onError);
}

function queryForTourByBannerURL(bannerURL, onSuccess, onError) {
	tsDb.one(findTourByBannerQuery, bannerURL, onSuccess, onError);
}

function queryForToursByUserId(userId, onSuccess, onError) {
	tsDb.any(getToursCreatedByUserIdQuery, userId)
		.then(function(results) {
			results = tourListCardMapper(results);
			onSuccess(results);
		})
		.catch(onError);
}

function queryForToursByTitle(queryText, onSuccess, onError) {
	tsDb.any(getToursByTitleQuery, queryText)
		.then(function(results) {
			results = tourListCardMapper(results);
			onSuccess(results);
		})
		.catch(onError);
}

function createTourWithObject(tourObj, onSuccess, onError) {
	tsDb.one(insertTourQuery, tourObj)
		.then(onSuccess)
		.catch(onError);
}

function getBannerLinkForTourId(tourObj, onSuccess, onError) {
	tsDb.one(getBannerUrlForTourId, tourObj)
		.then(onSuccess)
		.catch(onError);
}

function updateTourWithId(tourObj, onSuccess, onError) {
	tsDb.one(updateTourQueryWithId, tourObj)
		.then(onSuccess)
		.catch(onError);
}

function deleteTourBelongingToUser(values, onSuccess, onError) {
	tsDb.none(deleteTourWithIdBeloningToUserQuery, values)
		.then(onSuccess)
		.catch(onError);
}

const findTourByIdQuery = "SELECT propertylistings.*, \
						 		accounts.email, \
								accounts.full_name, \
    							accounts.profile_picture_url, \
    							accounts.first_name, \
    							accounts.last_name \
						FROM propertylistings \
						INNER JOIN accounts ON (propertylistings.listing_owner = accounts.guuid) \
						WHERE propertylistings.id = $1";

const getToursCreatedByUserIdQuery = "SELECT propertylistings.id, \
								propertylistings.listing_banner_url, \
								propertylistings.listing_title, \
								propertylistings.listing_price, \
								accounts.guuid, \
								accounts.first_name, \
								accounts.last_name \
						FROM propertylistings \
						INNER JOIN accounts ON (propertylistings.listing_owner = accounts.guuid) \
						WHERE accounts.guuid = $1";

const getToursByTitleQuery = "SELECT propertylistings.id, \
								propertylistings.listing_banner_url, \
								propertylistings.listing_title, \
								propertylistings.listing_price, \
								accounts.guuid, \
								accounts.first_name, \
								accounts.last_name \
						FROM propertylistings \
						INNER JOIN accounts ON (propertylistings.listing_owner = accounts.guuid) \
						WHERE (LOWER(propertylistings.listing_description) LIKE LOWER('%$1#%') OR \
								LOWER(propertylistings.listing_title) LIKE LOWER('%$1#%'))"

const findTourByBannerQuery = "SELECT propertylistings.*, \
						 		accounts.email, \
								accounts.full_name, \
    							accounts.profile_picture_url, \
    							accounts.first_name, \
    							accounts.last_name \
						FROM propertylistings \
						INNER JOIN accounts ON (propertylistings.listing_owner = accounts.guuid) \
						WHERE propertylistings.listing_banner_url = $1";

const insertTourQuery = "INSERT INTO propertylistings( \
							listing_owner, listing_title, listing_price, \
							listing_description, availability_alt, \
							listing_banner_url, \
							amenities_is_furnished, amenities_has_internet, \
							amenities_has_hydro, amenities_has_water, \
							amenities_has_laundry, amenities_has_ensuite_washroom, is_live) \
						VALUES( \
							$[owner_uuid], $[title], $[price], $[description], \
							$[availability], $[banner_url], \
							$[amenities_is_furnished], $[amenities_has_internet], \
							$[amenities_has_hydro], $[amenities_has_water], \
							$[amenities_has_laundry], $[amenities_has_ensuite_washroom], $[is_live]) \
						RETURNING id";
const updateTourQueryWithId = "UPDATE propertylistings \
								SET listing_title = $[title], \
									listing_price = $[price], \
									listing_description = $[description], \
									amenities_is_furnished = $[amenities_is_furnished], \
									amenities_has_internet = $[amenities_has_internet], \
									amenities_has_hydro = $[amenities_has_hydro], \
									amenities_has_water = $[amenities_has_water], \
									amenities_has_laundry = $[amenities_has_laundry], \
									amenities_has_ensuite_washroom = $[amenities_has_ensuite_washroom], \
									is_live = TRUE, \
									listing_banner_url = $[banner_url] \
								WHERE id = $[id] \
								RETURNING id";
const getBannerUrlForTourId = "SELECT image_posx \
								FROM rooms \
								WHERE tourid = $1 LIMIT 1";

const deleteTourWithIdBeloningToUserQuery = "DELETE FROM propertylistings \
								WHERE id = $[id] AND listing_owner = $[userid]";