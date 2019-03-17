'use strict';
var pgp = require('pg-promise')();
var aws = require('aws-sdk');

const OAUTH_CLIENT_ID = process.env.OAUTH_ID;
const SESSION_KEY = process.env.USER_SESSION_KEY;
const SESSION_SECRET = process.env.USER_SESSION_SECRET;
const PG_ENV_ENDPOINT = process.env.DATABASE_URL || "postgresql://localhost:5432/tourshare";
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const tsDb = pgp(PG_ENV_ENDPOINT);
const s3 = new aws.S3({
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY,
	config : 'us-east-2',
	signatureVersion: 'v4'
});

module.exports = Object.freeze({
	OAUTH_CLIENT_ID,
	SESSION_SECRET,
	PG_ENV_ENDPOINT,
	tsDb,
	s3,
	S3_BUCKET,
	AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY
});