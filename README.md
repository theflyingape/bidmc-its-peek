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

| [![NPM](https://nodei.co/npm/bidmc-its-peek.png?compact=true)](https://nodei.co/npm/bidmc-its-peek/) | ![David](https://img.shields.io/david/dev/theflyingape/bidmc-its-peek) |
| | ![Node.js Package](https://github.com/theflyingape/bidmc-its-peek/workflows/Node.js%20Package/badge.svg) |
| | [![Issues](http://img.shields.io/github/issues/theflyingape/bidmc-its-peek.svg)](https://github.com/theflyingape/bidmc-its-peek/issues) |

:us: :copyright: 2021 [Robert Hurst](https://www.linkedin.com/in/roberthurstrius/)
