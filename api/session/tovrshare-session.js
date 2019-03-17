'use strict';

module.exports = {
	checkForUserSession : checkForUserSession
}

function checkForUserSession(request, response, next) {
	if (hasUserSessionProperties(request.session)) {
		next();
	} else {
		console.log("Session not a valid user session");
		console.log(request.session);
		request.session.destroy();

		var jsonOutput = {
			message : "Session is not user authenticated."
		};

		response.status(403)
				.json(jsonOutput);
	}
};

function hasUserSessionProperties(session) {
	return session.hasOwnProperty("authenticated")
		&& session.hasOwnProperty("userid")
		&& session.hasOwnProperty("email")
}