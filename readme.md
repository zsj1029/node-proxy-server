
* Docker build & start
```
docker build -t node_proxy_server .
mkdir -p ./data
docker run  --name proxy -d -v ./data:/app/data --network host --restart always node_proxy_server
```

* Direct start 
```
npm i
node proxy.js
```

## Dynamic Creation and Deletion of Proxy Services by API

### Add Proxy 

from local random port -> remote ip:port

GET request : http://127.0.0.1:3000/addProxy?proxyIp=x.x.x.x&proxyPort=7681

Return JSON: {"listenPort":55369,"proxyIp":"x.x.x.x","proxyPort":"7681"}

THEN: View: http://127.0.0.1:55369 proxy-> http://x.x.x.x:7681

### Get Proxies Now

GET request : http://127.0.0.1:3000/getProxies

Return JSON: {"55369":"127.0.0.1:7681","xxx":x.x.x.x:8888}

### Remove Proxy

GET request : http://127.0.0.1:3000/removeProxy?proxyIp=x.x.x.x&proxyPort=7681

Return JSON: {"code":"Remove Success"}

THEN Stop: http://127.0.0.1:55369 proxy-> http://x.x.x.x:7681



