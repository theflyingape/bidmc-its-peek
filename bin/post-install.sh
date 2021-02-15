#!/bin/bash -x

path="`dirname $0`/.."; cd $path || exit 1

if [ ! -d keys ]; then
    mkdir keys
    openssl req -newkey rsa:2048 -nodes -x509 -days 365 \
        -keyout keys/localhost.key -out keys/localhost.cer \
        -subj '/C=US/ST=Massachusetts/L=Boston/O=Beth Israel Deaconess Medical Center Inc/OU=IS Clinical Develpment/CN=localhost'
    chmod g+r keys/localhost.key
fi

if [ -d node_modules/uikit/dist ]; then
    rsync -av node_modules/uikit/dist/ public/uikit/
fi
