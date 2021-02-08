# ⚕️ BIDMC ITS Peek services 🌐

> ## Apache (and Caché) activity insight

```bash
$ git clone https://github.com/theflyingape/bidmc-its-peek peek
$ cd peek
$ npm install
$ sudo rsync -av --delete . /mnt/autofs/media/peek/
$ sudo -s
$ cd /usr/local/sbin
$ ln -s /mnt/autofs/media/peek/bin/peek peek
$ ln -s /mnt/autofs/media/peek/bin/peek-gw peek-gw
$ cd /etc/httpd/conf.d
$ vi ccc*.conf
# ... append assets/apache-localhost-proxy.conf
$ cp /mnt/autofs/media/peek/peek-gw.service /etc/systemd/system/
$ systemctl daemon-reload
$ systemctl enable peek-gw
$ systemctl start peek-gw
$ systemctl status peek-gw
$ systemctl restart httpd
$ systemctl status httpd
```

[![Downloads](https://img.shields.io/npm/dy/bidmc-its-peek.svg)](https://www.npmjs.com/package/bidmc-its-peek)
[![GitHub release](https://img.shields.io/github/release/theflyingape/bidmc-its-peek.svg)](https://github.com/theflyingape/bidmc-its-peek/releases) ![Node.js Package](https://github.com/theflyingape/bidmc-its-peek/workflows/Node.js%20Package/badge.svg)

:us: :copyright: 2021 [Robert Hurst](https://www.linkedin.com/in/roberthurstrius/)
