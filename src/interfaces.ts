interface cachedb {
    server: string
    ns?: string
    pid?: string
    cmd?: any
}

interface config {
    report: number
    ssl?: { key: string, cert: string, requestCert: boolean, rejectUnauthorized: boolean }
}

interface skip {
    error?: string
    verbose: number
    webt: number
}

interface hosts {
    apache?: string[]
    caché?: string[]
}

interface vip {
    apache?: {
        [fqdn: string]: {
            caché: string,
            hosts: string[]
        }
    }
    caché?: {
        [fqdn: string]: {
            apache: string,
            hosts: string[]
        }
    }
}
