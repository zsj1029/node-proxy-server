const express = require('express');
const httpProxy = require('http-proxy-middleware');
const fs = require("node:fs");
const app = express();

const validator = require('validator')

const createProxy = (proxyIp, port) => {
    return httpProxy.createProxyMiddleware({
        target: `http://${proxyIp}:${port}`,
        changeOrigin: false,
        ws: true,
        logger: console
    })
}

const proxies = {};

/**
 *
 * @param {string} localPort
 * @param {string} proxyIp
 * @param {string} proxyPort
 */
const proxyStartListen = (localPort, proxyIp, proxyPort) => {
    const proxyApp = express();
    proxyApp.use(createProxy(proxyIp, proxyPort));
    proxies[localPort] = proxyApp.listen(localPort, () => {
        console.log(`Proxy :${localPort} -> ${proxyIp}:${proxyPort}\n`)
    })
}


class CFG {
    filePath = './data/proxy.json'

    constructor() {
        if (!fs.existsSync(this.filePath)) {
            fs.mkdirSync('./data', {recursive: true});
            fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2))
        }
    }

    initProxy() {
        const proxies = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        Object.keys(proxies).forEach((value, key) => {
            proxyStartListen(value, proxies[value].split(':')[0], proxies[value].split(':')[1])
        })
    }

    getProxies() {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    }

    /**
     * @description
     * @param {string} proxyIp
     * @param {string} proxyPort
     */
    addProxy(proxyIp, proxyPort) {
        this.removeProxy(proxyIp, proxyPort)
        const ct = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        let pp;
        while (true) {
            pp = Math.floor(Math.random() * (65535 - 8000 + 1) + 8000);
            if (!this.checkLocalPort(pp.toString())) {
                break;
            }
        }
        ct[pp] = proxyIp + ':' + proxyPort
        fs.writeFileSync(this.filePath, JSON.stringify(ct, null, 2))

        return pp;
    }

    /**
     * @param {string} proxyIp
     * @param {string} proxyPort
     */
    removeProxy(proxyIp, proxyPort) {
        const ct = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
        let removePort;
        Object.keys(ct).forEach((value, key) => {
            if (ct[value].includes(proxyIp + ':' + proxyPort)) {
                removePort = value
                delete ct[value];
            }
        })
        fs.writeFileSync(this.filePath, JSON.stringify(ct, null, 2))

        proxies[removePort]?.close();
        return removePort
    }

    /**
     * @param {string} port
     */
    checkLocalPort(port) {
        const ct = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
        return Object.keys(ct).includes(port);
    }
}

const cfg = new CFG();
cfg.initProxy();


app.use('/addProxy', (req, res, next) => {
    try {
        const {proxyIp, proxyPort} = req.query
        if (!proxyIp || !validator.isIP(proxyIp)) {
            throw new Error(`Invalid IP address`);
        }

        if (!proxyPort || !validator.isInt(proxyPort, {allow_leading_zeroes: false, min: 23, max: 65535})) {
            throw new Error(`Invalid proxyPort, [23-65535]`);
        }
        const port = cfg.addProxy(proxyIp, proxyPort)

        proxyStartListen(port, proxyIp, proxyPort)
        res.send(JSON.stringify({
            listenPort: port,
            proxyIp,
            proxyPort
        }));
    } catch (e) {
        res.send(JSON.stringify({error: e.message}));
    }
})

app.use('/removeProxy', (req, res, next) => {
    try {
        const {proxyIp, proxyPort} = req.query
        if (!proxyIp || !validator.isIP(proxyIp)) {
            throw new Error(`Invalid IP address`);
        }

        if (!proxyPort || !validator.isInt(proxyPort, {allow_leading_zeroes: false, min: 23, max: 65535})) {
            throw new Error(`Invalid proxyPort, [23-65535]`);
        }

        cfg.removeProxy(proxyIp, proxyPort)
        res.send(JSON.stringify({code: "Remove Success"}))
    } catch (e) {
        res.send(JSON.stringify({error: e.message}));
    }
})

app.use('/getProxies', (req, res, next) => {
    try {
        res.send(JSON.stringify(cfg.getProxies()))
    } catch (e) {
        res.send(JSON.stringify({error: e.message}));
    }
})


process.on('uncaughtException', (err, origin) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});

const server = app.listen(3000, () => {
    console.log(`Proxy service started on port ${server.address().port}`);
});


