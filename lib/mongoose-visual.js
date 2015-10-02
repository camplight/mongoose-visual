
/**
 * @class mongoose-visual
 **/

/**
 * @deps
 **/

var glob = require("glob");
var fsEx = require('fs-extra');
var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , mongoose = require('mongoose')
  , express = require('express');

var projectModels = []
  , JSONOutput = [];

var HTMLString = '<html><head><title>Mongoose Visuals</title>';
HTMLString += '<link rel="stylesheet" type="text/css" href="style.css" />';
HTMLString += '</head><body>';

var loadedModels = 0
  , totalModels = 0;
  
function HTMLModel(modelName, keys, index) {
  HTMLString += '<div class="modelTitle"><code>' + index + ". " + modelName + '</code></div>';
  HTMLString += '<div class="models">';
  HTMLString += '<div id="' + modelName + '">';
  for (key in keys) {
    var name = keys[key].name;
    var type = keys[key].type;
    var ref = keys[key].ref;

    if (type === 'Boolean') {
      keyClass = 'booleanType'; 
    } else if (type === 'Date') {
      keyClass = 'dateType';
    } else if (type === 'String') {
      keyClass = 'stringType';
    } else if (type === 'Number') {
      keyClass = 'numberType';
    } else {
      keyClass = 'otherType';
    } 
    if (name !== 'id' && name !== '_id') {
      HTMLString += '<div class="holder">';
      HTMLString += '<div class="keyName"><code>' + name + ':</code></div>';

      HTMLString += '<div class="keyType"><code>{ type : ' + '<span class="'+ keyClass + '">' + type + '</span>';
      if (ref) 
        HTMLString += ', ref : <span class="'+ keyClass + '">' + ref + '</span>';
      HTMLString += '}</code></div>';

      HTMLString += '</div>';
    }
  }
  HTMLString += '</div></div>';
}

function abstractModel(obj, index) {
  if (!obj.prototype || !obj.prototype.schema || index > 3000)
    return ;
  var modelName = obj.modelName;
  var collectionProtoype = obj.prototype.schema.paths;
  var items = new Array();
  
  for (obj in collectionProtoype) {
    var itemObject = collectionProtoype[obj];
    var key = {};
    key.name = itemObject.path.toString();
    try {

      if (itemObject.schema)
        key.type = "Mixed";
      else
        key.type = itemObject.options.type.name || itemObject.instance || itemObject.caster.instance; 

      if (Array.isArray(itemObject.options.type))
         key.type =  "[" + key.type + "]"

      if (itemObject.options.ref)
        key.ref = itemObject.options.ref
      else if (itemObject.caster && itemObject.caster.options && itemObject.caster.options.ref)
        key.ref = itemObject.caster.options.ref
    } catch(error) {
      key.type = 'Empty';
    };
    items.push(key);
  };
  var myModel = {
    ModelName : modelName,
    keys : items
  };
  // JSON
  JSONOutput.push(myModel);
  // HTML
  HTMLModel(modelName, items, index);
};

/**
 * @description export main
 **/

module.exports = visual = function(args) {
  var exportPath = args[2] ? args[2] : __dirname + "/../visuals/";
  var exportName = args[3] ? args[3] : "models";

  if (args[0] == 'docs') {
    process.on('modelsLoaded', function() {
      fsEx.ensureDirSync(exportPath)
      // Save JSON
      var writeReady = JSON.stringify(JSONOutput);
      fs.writeFileSync(path.resolve(exportPath, "models.json"), writeReady, "utf8");
      // Save HTML
      var HTML = HTMLString + '</body></html>';
      fs.writeFileSync(exportPath + exportName + ".html", HTML, "utf8");

      fsEx.copySync(__dirname + '/../visuals/style.css', path.resolve(exportPath, 'style.css'));
    });
    var dir = args[1];

    glob(path.resolve(process.cwd(), dir, "**/*.js"), {}, function (er, files) {
      if (er) throw new Error(er);
      
      files.forEach(function(file, index) {
        abstractModel(require(file), index + 1);
      }); 

      process.emit('modelsLoaded', true);  
    })
  } else if (args[0] === 'server') {
    var app = express.createServer();
    app.get('/', function(request, response) {
      var servingType = 'HTML';
      if (servingType === 'JSON') {
        var UTF8String = fs.readFileSync(path.resolve(exportPath, "models.json"), 'utf8');
        var modelsJSON = JSON.parse(UTF8String);
        response.send(modelsJSON);
      } else if (servingType === 'HTML') {
        var HTML = fs.readFileSync(exportPath + exportName + '.html', 'utf8');
        response.writeHead(200, { 'Content-Type' : 'text/html' });
        response.end(HTML);
      }
    });
    app.get('/style.css', function(request, response) {
      var CSS = fs.readFileSync(exportPath + 'style.css', 'utf8');
      response.writeHead(200, { 'Content-Type' : 'text/css' });
      response.end(CSS);
    });
    app.listen(8000);
    console.log('> mongoose visual listening on: http://localhost:8000/');
  } else {
    console.log('> Unknown command, try: "mongoosevisual docs /models-path/" or: "mongoosevisual server"');
  }
};

/* EOF */