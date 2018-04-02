var qs = require('querystring');
const URL = require('url');

function handleRequest (request, response, cb) {
  // https://stackoverflow.com/a/19183959/2066736
  let requestBody = '';
  request.on('data', function(data) {
    requestBody += data;
    if(requestBody.length > 1e7) {
      response.writeHead(413, 'Request Entity Too Large', {'Content-Type': mimeTypes[".html"]});
      response.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
    }
  });
  request.on('end', function() {
    request.body = qs.parse(requestBody);
    cb(null, request, response);
  });
}

function wrapReq (req) {
  req.query = URL.parse(req.url,true).query;

  return req;
}

function wrapRes (res) {
  res.status = (status) => {
    res.statusCode = status;
    return res;
  }
  res.json = (json) => {
    res.setHeader('content-type', 'application/javascript');
    console.log(json);
    res.end(JSON.stringify(json))
  }

  return res;
}

function middlewareHandler (cbs) {
  return (err, req, res) => {
    let next = () => {
      if(cbs.length > 0) {
        cbs.shift()(err,req,res,next);
      }
    }
    next();
  }
}

function Router (req, res) {
  return {
    // takes a url and middleware callbacks
    post (url, ...cbs) {
      if(req.method !== 'POST') {
        return;
      }
      if(req.url.indexOf(url) === 0) {
        handleRequest(req, wrapRes(res), middlewareHandler(cbs));
      }
    },
    // takes a url and middleware callbacks
    get (url, ...cbs) {
      if(req.method !== 'GET') {
        return;
      }
      if(req.url.indexOf(url) === 0) {
        handleRequest(wrapReq(req), wrapRes(res), middlewareHandler(cbs));
      }
    },
  }
}

module.exports = {
  Router
};
