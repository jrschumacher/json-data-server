var express = require('express');
var http = require('http');
var path = require('path');
var crypto = require('crypto');
var async = require('async');
var app = express();

var debugRemote = require('debug')('remote');
var debugHttp = require('debug')('http');

var GET_DATA_TIMEOUT = 15000;

var jsonData;
var jsonDataVersion;
var jsonDataHash;

var remoteHost = process.env.REMOTE_HOST || 'localhost';
var remotePath = process.env.REMOTE_PATH || '';

var requestFile = function(file, cb) {
  http
    .request({
      method: 'GET',
      host: remoteHost,
      path: remotePath +'/' + file + '.json'
    }, function(res) {
      debugRemote('Requesting ' + file + '.json...');
      debugRemote('Requesting ' + file + '.json...');

      var data = '';

      res
        .setEncoding('utf8');
        
      res
        .on('data', function (chunk) {
          debugRemote('\trecieved data');
          debugRemote('\trecieved data');
          jsonDataHash.update(chunk);
          data += chunk;
        });

      res
        .on('end', function() {
          debugRemote('\tend of data');
          debugRemote('\tend of data');
          cb(null, data);
        });

    })
    .end();
};

var buildDataStructure = function(files, result) {

  var data = {};

  result.forEach(function(item, i) {
    try {

      var file= files[i];
      data[file] = JSON.parse(result);

    }
    catch(e) {

      console.error(file + '.json is invalid');

      // notify via email of issue

    }
  });

  return data;

};

var getData = function() {

  jsonDataHash = crypto.createHash('md5');

  requestFile('index', function(x, files) {

    try {

      files = JSON.parse(files);

      if(typeof files === 'object') {

        async.map(files, requestFile, function(err, result) {
          jsonData = buildDataStructure(files, result);
          jsonDataVersion = jsonDataHash.digest('hex');

          setTimeout(getData, GET_DATA_TIMEOUT);
        });

      }
    }
    catch(e) {

      console.error('index.json is invalid', e);

      // notify via email of issue

    }

  });

};

// Get data
getData();

//--- EXPRESS ---//

// Middleware
app.use(require('compression')({level: 9}));
app.use(require('response-time')());

// Routes
app.get('/version', function(req, res) {

  if(req.query.is) {
    debugHttp('GET /version?is=' + req.query.is);
    debugHttp(req.query.is == jsonDataVersion);
    res.jsonp(req.query.is == jsonDataVersion);
  }
  else {
    debugHttp('GET /version');
    debugHttp(jsonDataVersion);
    res.jsonp(jsonDataVersion);
  }

  res.end();
});

app.get('/data', function(req, res) {
  debugHttp('GET /data');
  debugHttp(jsonData);

  res.jsonp(jsonData).end();
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Express server listening to http://localhost:' + (process.env.PORT || 3000));
});