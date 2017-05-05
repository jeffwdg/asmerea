/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

//'use strict';
// This application uses express as its web server
// for more info, see: http://expressjs.com
// ================================================================
// REQUIRES
// ================================================================
var express = require('express');
var request = require('request');
var url = require('url');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
//var fs = require('fs');
//var routes = require('../routes/index.js');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/public', express.static(process.cwd() + '/public'));
app.set('view engine', 'ejs');
//routes(app);
//app.set('public', __dirname + '/public');
// serve the files out of ./public as our main files
app.set('views', __dirname + '/public/views');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var oaccess_token = "";

// ================================================================
// WATSON CREDENTIALS HERE
// ================================================================

var visual_recognition = watson.visual_recognition({
  api_key: '5cfe8a848c2360730df7c59678b0dc103cae7630', // '0aa92f543e38547ddc8ba9383caf4cba952dbb32',
  version: 'v3',
  version_date: '2016-05-20'
});

var instaImage ="https://scontent.cdninstagram.com/t51.2885-15/s640x640/sh0.08/e35/18252117_808607632624658_991581406024957952_n.jpg";
//recognizeImage(instaImage, visual_recognition);


// ================================================================
// GET AND POSTS REQUESTS
// ================================================================

app.get('/', function(req, res) {
  res.render('pages/index');
});

app.get('/posts', function(req, res) {
  res.render('pages/posts');
});

app.get('/loginsuccess', function(req, res) {

  var u = window.location.href;
  console.log(u);
  res.render('pages/index');

});

app.get('/loginsuccess4', function(req, res){
  console.log("Enter now");
  oaccess_token = req.query.access_token;// req.params.code;
  console.log("token="+occess_token);

  if(oathcode ==  ""){

    console.log("Oath Access token generated");
    //getUserposts(oaccess_token);
    var url = 'https://api.instagram.com/v1/users/self/media/recent/?count=5&access_token='+occess_token;
    var jsodata;
     request({url: url , json: true}, function(err, res, json) {
       if (err) {
         throw err;
         console.log("Error occured");
       }
       getdata(json);
       //console.log(json.data[0].link);
     });

    function getdata(json){
      console.log("data passed");
      //console.log(json);
      //app.render('pages/posts', json);
      //res.setHeader('Content-Type', 'text/html');
      //res.send(JSON.stringify(json));
      res.render('pages/posts', json);

      console.log("end");
    }

  }
  else{
    console.log("Code not generated or you are not allowed yet. Still in sandbox mode.");
  }

  //res.render('bar.html', {title:'CHANSy', message:'Cognitive Health Application Management System'});
});

app.get('/feed', function(req, res, next){
  var url = 'https://api.instagram.com/v1/users/self/media/recent/?access_token=1378545447.4d4215d.b9522a4927564793b88828b33a32c4e3&count=10';
  var jsodata;
   request({url: url , json: true}, function(err, res, json) {
     if (err) {
       throw err;
       console.log("Error occured");
     }
     getdata(json);
     console.log(json.data.length);
     console.log("USER"+json.data[0].caption.text);
   });

  function getdata(json){
    console.log("data passed");
    //console.log(json);
    //app.render('pages/posts', json);
    //res.setHeader('Content-Type', 'text/html');
    //res.send(JSON.stringify(json));
    res.render('pages/posts', json);

    console.log("end");
  }
});

app.get('/recog', function(req, res) {
  //recognizeImage(instaImage, visual_recognition);
  console.log("recognizing image");
  res.render('pages/rec');
});



/* Recognize an image */
app.post('/rec',   function(req, res) {
  var url = "https://scontent.cdninstagram.com/t51.2885-15/s640x640/sh0.08/e35/18252117_808607632624658_991581406024957952_n.jpg";

  var params = {
    url: url,
    images_file: null
  };

/*
  if (req.file) { // file image
    params.images_file = fs.createReadStream(req.file.path);
    console.log(req.file);
  }

  else if (req.body.url && req.body.url.indexOf('images') === 0) { // local image
    params.images_file = fs.createReadStream(path.join('public', req.body.url));
  } else if (req.body.image_data) {
    // write the base64 image to a temp file
    var resource = parseBase64Image(req.body.image_data);
    var temp = path.join(os.tmpdir(), uuid.v1() + '.' + resource.type);
    fs.writeFileSync(temp, resource.data);
    params.images_file = fs.createReadStream(temp);
  } else if (req.body.url) { // url
    params.url = req.body.url;
  } else { // malformed url
    return res.status(400).json({ error: 'Malformed URL', code: 400 });
  }*/

  //Detect images
  visual_recognition.classify(params, function(err, res) {
    if (err)
      console.log(err);
    else
      getdata(res);
      res.images[0].classifiers[0].classes.sort();

      console.log("SIZE"+res.images[0].classifiers[0].classes.length);
      console.log("CLASS"+res.images[0].classifiers[0].classes[0].class);
      console.log("SCORE"+res.images[0].classifiers[0].classes[0].score);
      console.log("Images: "+JSON.stringify(res, null, 2));
  });

  //Detect faces
  visual_recognition.detectFaces(params,
  function(err, response) {
    if (err)
      console.log(err);
    else
      console.log("Faces: "+ res);
  });



  function getdata(json){
    console.log("data passed");
    //console.log(json);
    //res.setHeader('Content-Type', 'text/html');
    //res.send(JSON.stringify(json));
    res.render('pages/recogResult', json);

    console.log("end");
  }

});



// ================================================================
// FUNCTIONS
// ================================================================


function recognizeImage(instaImage){

}



// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
