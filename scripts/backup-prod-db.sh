#!/bin/bash

heroku pg:backups capture --app vrsublets
curl -o latest.dump `heroku pg:backups public-url --app vrsublets`
pg_restore --verbose --clean --no-acl --no-owner -h localhost  -d tourshare latest.dump