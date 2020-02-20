#!/bin/bash
if [ "$1" != "" ]; then
	URL="https://le4qbchjrl.execute-api.us-east-1.amazonaws.com/test/download-page?url=" 
	URL+=$1
	curl $URL
else
	echo "No url argument found!"
fi
