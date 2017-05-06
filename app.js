/*eslint-env node*/

//------------------------------------------------------------------------------
// HORUS application
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
var instagram = require('instagram-node').instagram();
var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
var fs = require('fs');
//var fs = require('fs');

// cfenv provides access to your Cloud Foundry environment
var cfenv = require('cfenv');

// create a new express server
var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/public', express.static(process.cwd() + '/public'));
app.set('view engine', 'ejs');


// serve the files out of ./public as our main files
app.set('views', __dirname + '/public/views');
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var oaccess_token = "";

// ================================================================
// WATSON CREDENTIALS HERE
// ================================================================
/*
instagram.use({
  client_id: '4d4215dd28de4c0fbcc1c4aa8366a926',
  client_secret: '84f0af4d4c5244eeaed53aeb2c1cfc21'
});
*/

var text_to_speech = new TextToSpeechV1({
  username: '41e15cff-d972-4a5f-a52e-39d2a7b337b3',
  password: '8MOlkv7ttq8V'
});

var visual_recognition = watson.visual_recognition({
  api_key: '5bb5ab8768001a289d21219f73014b5f09483c08', //
  version: 'v3',
  version_date: '2016-05-20'
});

var instaImage ="https://scontent.cdninstagram.com/t51.2885-15/s640x640/sh0.08/e35/18252117_808607632624658_991581406024957952_n.jpg";

var redirect_uri = 'https://horus.mybluemix.net/loginsuccess';
// ================================================================
// GET AND POSTS REQUESTS
// ================================================================




app.get('/', function(req, res) {
  console.log(req.query);
  //res.send(req.url+req.query+req.params;
  res.render('pages/index');

});

app.get('/loginsuccess', function(req, res) {
  console.log(req.query);
  //res.send(req.url+req.query+req.params;
  //res.render('pages/index');
});

app.get('/posts', function(req, res) {
  res.render('pages/posts');
});

app.get('/speak', function(req, res) {

  var params = {
    text: 'Hello. My name is Horus. What do you want to see today?',
    voice: 'en-US_AllisonVoice', // Optional voice
    accept: 'audio/wav'
  };

  // Pipe the synthesized text to a file
  text_to_speech.synthesize(params).pipe(fs.createWriteStream('public/audio/output.wav'));
  console.log();

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
  var url = 'https://api.instagram.com/v1/users/self/media/recent/?access_token=1378545447.4d4215d.b9522a4927564793b88828b33a32c4e3&count=5';
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
    //console.log(JSON.stringify(json));

    //Loop each fetched posts and recognize the images
    // Append the results in the output array
    //Returns class of the image after recognition
    var getImgClass = function(url,callback) {
      //var url = "https://scontent.cdninstagram.com/t51.2885-15/s640x640/sh0.08/e35/18252117_808607632624658_991581406024957952_n.jpg";
      console.log(" RECOG URL"+url);

      var params = {
        url: url,
        images_file: null
      };

      //Detect images
      visual_recognition.classify(params, function(err, res) {
        if (err)
          console.log(err);
        else
          getdata(res);
          //res.images[0].classifiers[0].classes.sort();
          var score = res.images[0].classifiers[0].classes[0].score;
          var iclass = res.images[0].classifiers[0].classes[0].class;
          //console.log("SIZE"+res.images[0].classifiers[0].classes.length);
          //console.log("CLASS"+res.images[0].classifiers[0].classes[0].class);
          //console.log("SCORE"+res.images[0].classifiers[0].classes[0].score);
          //console.log("Images: "+JSON.stringify(res, null, 2));
          //console.log(res);
          callback(res);
          //return res.images[0].classifiers[0].classes[0].class;
      });


      function getdata(json){
        console.log("data passed");
        //console.log(json);
        //res.setHeader('Content-Type', 'text/html');
        //res.send(JSON.stringify(json));
        //res.render('pages/recogResult', json);
        console.log("end");
      }

    };

    //Loops through each image for recognition
    var recogImg = function(url, callback) {
        console.log("Recognizing each");
        getImgClass(url,function(data){
            callback(data);
        });

    };

    var json = retResults(json);

    function retResults(json){

    var icolors = {
      "brown":"which is similar to the earths natural color or some dead parts of things which grew out of the dirt from the earth",
      "red":"which is similar to a skin sun burn and the color of your cheeks if you felt embarrassed and blushed.",
      "orange":"which is similar as refreshing, sweet, and tropical",
      "yellow":"which is when you feel the warmth from the rays of the sun and the smell of a field of sunflowers",
      "green":"which feels like the smoothness and suppleness of the leaves; green feels like life. But when the leaves are crispy  like these other ones, they have turned brown and aren’t alive anymore.",
      "blue":"which is similar when you feel you’re swimming in the water and the cool wetness of it feels relaxing",
      "indigo":"which is hot, yet icy. Its intellectual, and very sexual, but frustrated too. Indigo appears in the sky at dawn and",
      "dusk":"when the weather is beautiful but storms lie ahead way before we can feel it in the atmosphere",
      "violet":"which is a type of color between hot and cool, red and blue. It gives a feeling as though it is between the heat of fire and the coldness of ice. If it were a smell, it would smell like burning wood that is floating on top of the ocean."
    };

      var postAudio = "This post";

      console.log("Recognizing each posts of "+json.data.length);
      //var iclass=[];
      var instaAudioText = [];
      //iclass.length = json.data.length;
      var jtype="text in a photo";
      var jcaption = "Caption here";
      var jlocation = "";
      var taggedPeople = "";
      var jlikect = "";
      var jcommentct = "";
      var ix;

       for(i=0; i < json.data.length; i++){
        //console.log(json.data[i].images.standard_resolution.url);
        url = json.data[i].images.standard_resolution.url;
        console.log("OUTSIDE URL:"+url);
        recogImg(url, function(data){

            for(ix=0; ix < json.data.length; ix++){

              url = json.data[ix].images.standard_resolution.url;
              console.log("INSIDE URL:"+url);
              //console.log("FINAL CLASS"+data.images[0].classifiers[0].classes[0].class);
              //  iclass[i] = JSON.stringify(data.images[ix].classifiers[ix].classes);
              if(json.data[ix].type == "image"){ jtype="photo";}
              if(json.data[ix].location == true){ jlocation= json.data[ix].location.name;} else{ jlocation="";}
              if(json.data[ix].users_in_photo != "null"){ taggedPeople="";}
              jlikect = json.data[ix].likes.count;
              jcommentct = json.data[ix].comments.count;
              jcaption = json.data[ix].caption.text.replace("#", "hashtag ");

              var imageClasses = "";
              var imageClassesFinal ="";
              var iColor = [];
              var colorPos=-1;
              //console.log(JSON.stringify(jcaption+json.data[0].users_in_photo+json.data[0].location));
              //console.log("CLASS LEN"+ data.images[0].classifiers[0].classes.length);
              for(var e=0; e < data.images[0].classifiers[0].classes.length; e++){

                  imageClassesFinal += JSON.stringify(data.images[0].classifiers[0].classes[e].class)+ ", ";
                  if(imageClasses.search("color")){
                    //colorPos = icolors.indexOf(imageClasses);
                    //iColor[e] = imageClasses;
                    console.log(imageClasses);
                  }
              }

              //console.log(JSON.stringify(imageClasses));

              instaAudioText[i] = "This post is a "+jtype +". It may contain "+imageClassesFinal+" Post Caption " +jcaption+" " +jlocation + "Tagged People " + taggedPeople + "Post contains colors: "+ jlikect + " Likes and "+jcommentct+ " comments."
              console.log("SPEAKNOW"+instaAudioText[i]);

              //instaAudioText[i] = data.images[0].classifiers[0].classes[0].class;
              createAudo(instaAudioText[i], "audio"+json.data[ix].id);
              //console.log(data);

            }

        });

        //console.log(iclass);

      }


      console.log(json);
      return json;
      //console.log("RESULT ARRAY "+iclass);
    }


    //app.render('pages/posts', json);
    //res.setHeader('Content-Type', 'text/html');
    //res.send(JSON.stringify(json));
    res.render('pages/posts', json);

    console.log("end");
  }


});


/* Recognize an image */
app.post('/rec',   function(req, res) {
  var url = "https://scontent.cdninstagram.com/t51.2885-15/s640x640/sh0.08/e35/18252117_808607632624658_991581406024957952_n.jpg";
  var params = {
    url: url,
    images_file: null
  };

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
      //console.log("Images: "+JSON.stringify(res, null, 2));
  });

  //Detect faces
  visual_recognition.detectFaces(params, function(err, response) {
    if (err){
        console.log(err);
    }
    else{
      //console.log("Faces: "+ res);
    }

  });

  function getdata(json){
    //console.log("data passed");
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

function createAudo(instatext, filename){
    var params = {
      text: instatext,
      voice: 'en-US_AllisonVoice', // Optional voice
      accept: 'audio/wav'
    };
    //var filename = "instaaudio";
    // Pipe the synthesized text to a file
    text_to_speech.synthesize(params).pipe(fs.createWriteStream('public/audio/'+ filename+'.wav'));
    console.log();
}

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
