var express = require('express');
 //var request = require('request');
var app = module.exports = express.createServer();
var fs = require('fs');
var _ = require('underscore');

var base = 'http://rodin-admin.cloud.wiser-ci.com/api/v1/topics/topic/';
var urls = [
'http://rodin-admin.cloud.wiser-ci.com/api/v1/topics?q=relation',
'http://rodin-admin.cloud.wiser-ci.com/api/v1/topics?q=type.id:health-plan',
'http://rodin-admin.cloud.wiser-ci.com/api/v1/topics?q=type.id:health-service',
'http://rodin-admin.cloud.wiser-ci.com/api/v1/topics?q=type.id:health-plan-coverage-variation',
'http://rodin-admin.cloud.wiser-ci.com/api/v1/topics?q=type.id:coverage'

];

var Client = require('node-rest-client').Client;
client = new Client();
// handling client error events
client.on('error',function(err){
    console.error('Something went wrong on the client', err);
});

function getData(url,callback) {
  //console.log('get' + url);
      client.get(url,
            function(data, response){
            // parsed response body as js object
            callback(JSON.parse(data));
      }).on('error',function(err){
            console.log('something went wrong on the request', err.request.options);
        });
}
function saveFile(path,data) {
  fs.writeFile("topics/topic/"+ path + ".json", JSON.stringify(data), function(err) {
    if(err) {
        console.log(err);
    } else {
        objectssaved ++;
        console.log(path + ".json was saved! Objects(" + objectssaved + ')');
    }
  });
}
function parseCollection(object) {
  _.each(object.results,function(topic) {
      setTimeout(function() {
        // Add a bit of delay so we don't overload the server
      getData(base + topic.id ,function(data) {
            setTimeout(function() {
              // Throttle the saving to disk also.
            saveFile(data.id,data);
          },500);
         });
      }, 1000);
  });
}

var objectssaved = 0;

_.each(urls,function(url) {
  console.log('PARSING ' + url);
  getData(url,function(data) {
      parseCollection(data);
      var blnFinished = false;
      var max = data.count / data.per_page;
      var count = 1;
      while(count < max) {
        count++;
        getData(url + '&page='+count,function(data) {
          console.log(data.next);
          if (!data.next) {
            blnFinished = true;
          }
          parseCollection(data);

        });
      }
  });
});

app.listen(8080);
