#!/bin/bash

node server.js &
echo $! > /tmp/ws-server.pid

(cd static-content; python -m SimpleHTTPServer) &
echo $! > /tmp/http-server.pid
