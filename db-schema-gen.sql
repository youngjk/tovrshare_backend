--DROP TABLE accounts, rooms, propertylistings; -- Uncomment to reset db

CREATE TABLE IF NOT EXISTS accounts (
    guuid VARCHAR PRIMARY KEY,
    email VARCHAR, 
    full_name VARCHAR,
    profile_picture_url VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    created_at BIGSERIAL
);

CREATE TABLE IF NOT EXISTS propertylistings (
	id SERIAL PRIMARY KEY,
	listing_owner VARCHAR REFERENCES accounts(guuid),
	listing_title VARCHAR,
	listing_price DECIMAL,
	listing_description VARCHAR,
	start_date DATE,
	end_date DATE,
    availability_alt VARCHAR,
	listing_banner_url VARCHAR,
	amenities_is_furnished BOOLEAN,
	amenities_has_internet BOOLEAN,
	amenities_has_hydro BOOLEAN,
	amenities_has_water BOOLEAN,
	amenities_has_laundry BOOLEAN,
	amenities_has_ensuite_washroom BOOLEAN,
    is_live BOOLEAN
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    tourid INT REFERENCES propertylistings(id) ON DELETE CASCADE ON UPDATE CASCADE,
    image_posx VARCHAR(255),
    image_posy VARCHAR(255),
    image_posz VARCHAR(255),
    image_negx VARCHAR(255),
    image_negy VARCHAR(255),
    image_negz VARCHAR(255),
    original_pano VARCHAR,
    title VARCHAR(255),
    description VARCHAR(1000)
);
