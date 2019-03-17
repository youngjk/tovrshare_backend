'use strict';

module.exports = {
	mapper : mapper
}

function mapper() {
	return function(data) {
		data.forEach(function(tourCard) {
				remapKeyForTourCard(tourCard);
			});

		return data;
	}
}

function remapKeyForTourCard(tourCard) {
	remapPropertyKey(tourCard, 'id', 'tour_listing_id');
	remapPropertyKey(tourCard, 'listing_banner_url', 'banner_url');
	remapPropertyKey(tourCard, 'listing_title', 'tour_title');
	remapPropertyKey(tourCard, 'listing_price', 'tour_price')

	var owner = {
		id : tourCard.guuid,
		first_name : tourCard.first_name,
		last_name : tourCard.last_name
	};

	tourCard.owner = owner;
	delete tourCard['guuid'];
	delete tourCard['first_name'];
	delete tourCard['last_name'];
};

function remapPropertyKey(object, old_key, new_key) {
	object[new_key] = object[old_key];
	delete object[old_key];
};