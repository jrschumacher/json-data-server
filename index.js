var express = require('express');
var request = require('request');
var path = require('path');
var crypto = require('crypto');
var async = require('async');
var yaml = require('js-yaml');
var app = express();

var debugRemote = require('debug')('remote');
var debugHttp = require('debug')('http');
var debugGetData = require('debug')('getdata');

var GET_DATA_TIMEOUT = 15000;

var jsonData;
var jsonDataVersion;
var jsonDataHash;

var remoteHost = process.env.REMOTE_HOST || 'localhost';
var remotePath = process.env.REMOTE_PATH || '';

var requestFile = function(file, cb) {
  debugRemote('Initalizing request file');
  debugRemote('Requesting ' + file + '.yaml...');
  request('http://' + remoteHost + remotePath +'/' + file + '.yaml', function(error, res, body) {
    if(error) {
      console.error('requestFile: unable to connect', error);
    }
    else if(body) {
      jsonDataHash.update(body);
      cb(null, body);
    }
  });
};

var buildDataStructure = function(files, result) {

  var data = {};

  result.forEach(function(item, i) {
    try {

      var file= files[i];
      data[file] = yaml.safeLoad(item);

    }
    catch(e) {

      console.error(file + '.yaml is invalid');
      console.error(e);

      // notify via email of issue

    }
  });

  return data;

};

var getData = function(cb) {
  debugGetData('Running getData');

  jsonDataHash = crypto.createHash('md5');

  requestFile('index', function(x, files) {
    debugGetData('Parsing files');

    try {

      files = yaml.safeLoad(files);

      if(typeof files === 'object') {
        debugGetData('Mapping files');

        async.map(files, requestFile, function(err, result) {
          debugGetData('Building structure');
          jsonData = buildDataStructure(files, result);
          jsonDataVersion = jsonDataHash.digest('hex');
          debugGetData('Data length:', JSON.stringify(jsonData).length);
          debugGetData('Data hash:', jsonDataVersion);
          debugGetData('Calling callback');
          if(typeof cb === 'function') cb();

          debugGetData('Timeout set to', GET_DATA_TIMEOUT);
          setTimeout(getData, GET_DATA_TIMEOUT);
        });

      }
    }
    catch(e) {
      debugGetData('Error occurred');
      console.error('index.yaml is invalid', e);

      // notify via email of issue

    }

  });

};

// Get data
debugGetData('Init getData');
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

  if(jsonData === undefined) {
    getData(function() { res.jsonp(jsonData).end() });
  }
  else {
    res.jsonp(jsonData).end();
  }
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Express server listening to http://localhost:' + (process.env.PORT || 3000));
}).on('error', function(err){
  console.error('app.on.error:', err);
});


process.on('uncaughtException', function(err) {
  console.error('process.on.error:', err);
});
