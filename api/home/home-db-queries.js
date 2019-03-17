'use strict';

const {tsDb} = require('../utils/tovrshare-constants');

var tourListCardUtils = require('../utils/tour-list-card');
var tourListCardMapper = tourListCardUtils.mapper();

module.exports = {
	queryTop10Popular : queryTop10Popular
};

function queryTop10Popular(onSuccess, onError) {
	tsDb.any(findTop10ToursQuery)
		.then(function(data) {
			data = tourListCardMapper(data);

			onSuccess(data);
		})
		.catch(onError);
};

const findTop10ToursQuery = 'SELECT propertylistings.id, \
									propertylistings.listing_banner_url, \
									propertylistings.listing_title, \
									propertylistings.listing_price, \
									accounts.guuid, \
									accounts.first_name, \
									accounts.last_name \
							FROM propertylistings \
							INNER JOIN accounts ON (propertylistings.listing_owner = accounts.guuid) \
							WHERE propertylistings.is_live = TRUE \
							ORDER BY propertylistings.created_at DESC \
							LIMIT 10';