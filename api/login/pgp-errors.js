'use strict';

var pgp = require('pg-promise')();
const QueryResultError = pgp.errors.QueryResultError;
const qrec = pgp.errors.queryResultErrorCode;

module.exports = {
		QueryResultError : QueryResultError,
		errorCodes : qrec
}