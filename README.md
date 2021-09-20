# ⚕️ BIDMC ITS Peek services 👁️

## Apache (and Caché) activity insight

```bash
$ git clone https://github.com/theflyingape/bidmc-its-peek peek
$ cd peek
$ npm install
$ sudo -s
% rsync -av --delete . /mnt/autofs/media/peek/
% cd /usr/local/sbin
% ln -s /mnt/autofs/media/peek/bin/peek
% ln -s /mnt/autofs/media/peek/bin/peek-gw

% vi /etc/httpd/conf.d/ccc*.conf
# ... append etc/apache-localhost-proxy.conf

% cp /mnt/autofs/media/peek/peek-gw.service /etc/systemd/system/

# ... restart services
% systemctl daemon-reload
% systemctl enable peek-gw
% systemctl start peek-gw
% systemctl restart httpd
```

| ![screenshot](https://raw.githubusercontent.com/theflyingape/bidmc-its-peek/master/Peek%20Portal%20-%20webOMR%20apps.png "webOMR application utilizations") |
|:--:|
| *example screenshot from web server https://valhalla.bidmc.org/peek/* |

[![NPM](https://nodei.co/npm/bidmc-its-peek.png?compact=true)](https://nodei.co/npm/bidmc-its-peek/)

[![Open in Visual Studio Code](https://open.vscode.dev/badges/open-in-vscode.svg)](https://open.vscode.dev/organization/repository)[![npm version](https://badge.fury.io/js/bidmc-its-peek.svg)](https://www.npmjs.com/package/bidmc-its-peek) ![npm version](https://img.shields.io/node/v/bidmc-its-peek) ![David](https://img.shields.io/david/dev/theflyingape/bidmc-its-peek) [![Issues](http://img.shields.io/github/issues/theflyingape/bidmc-its-peek.svg)](https://github.com/theflyingape/bidmc-its-peek/issues)

:us: :copyright: 2021 [Robert Hurst](https://www.linkedin.com/in/roberthurstrius/)
