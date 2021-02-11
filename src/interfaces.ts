interface cachedb {
    server: string
    cachedb: any
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
        caché: string,
        hosts: string[]
    }
    caché?: {
        apache: string,
        hosts: string[]
    }
}
