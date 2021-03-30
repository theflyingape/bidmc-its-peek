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

[![Downloads](https://img.shields.io/npm/dy/bidmc-its-peek.svg)](https://www.npmjs.com/package/bidmc-its-peek)
[![GitHub release](https://img.shields.io/github/release/theflyingape/bidmc-its-peek.svg)](https://github.com/theflyingape/bidmc-its-peek/releases) ![Node.js Package](https://github.com/theflyingape/bidmc-its-peek/workflows/Node.js%20Package/badge.svg)

:us: :copyright: 2021 [Robert Hurst](https://www.linkedin.com/in/roberthurstrius/)
