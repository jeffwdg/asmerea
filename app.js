/*eslint-env node*/

//------------------------------------------------------------------------------
// HORUS application
//------------------------------------------------------------------------------

'use strict';
// This application uses express as its web server
// for more info, see: http://expressjs.com
// ================================================================
// REQUIRES
// ================================================================
require('dotenv').config({silent: true});
var express = require('express');
var request = require('request');
var url = require('url');
var bodyParser = require('body-parser');
var watson = require('watson-developer-cloud');
var instagram = require('instagram-node').instagram();
var TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
var fs = require('fs');
var Sound = require('node-aplay');
var play = require('play');
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
// Create the service wrapper
var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  username: '0a1a7038-1fde-4c1f-81a8-ea789ca0cef1',
  password: '1C5VUt3XUvXf',
  url: 'https://gateway.watsonplatform.net/conversation/api',
  version_date: '2016-10-21',
  version: 'v1'
});

var text_to_speech = new TextToSpeechV1({
  username: 'd6db4a69-211e-4a53-9c84-00f602bbad48',
  password: 'IXTjieLw0Qdz'
});

var visual_recognition = watson.visual_recognition({
  api_key: '5bb5ab8768001a289d21219f73014b5f09483c08', //
  version: 'v3',
  version_date: '2016-05-20'
});

var authorization = new watson.AuthorizationV1({
  username: 'd6db4a69-211e-4a53-9c84-00f602bbad48',
  password: 'IXTjieLw0Qdz',
  url: watson.TextToSpeechV1.URL
});

authorization.getToken(function (err, token) {
  if (!token) {
    console.log('error:', err);
  } else {
    console.log("TOKEN"+token);
  }
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

app.get('/chat', function(req, res) {

  res.render('index');

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
  text_to_speech.synthesize(params).pipe(fs.createWriteStream('public/audio/hello.wav'));
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
          console.log("CLASS"+res.images[0].classifiers[0].classes[0].class);
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
      var i;

       for(i=0; i < json.data.length; i++){
        //console.log(json.data[i].images.standard_resolution.url);
        url = json.data[i].images.standard_resolution.url;
        console.log("OUTSIDE URL:"+url);

        recogImg(url, function(data){

            for(var ix=json.data.length-1; ix >=0; ix--){

              //console.log("FINAL CLASS"+data.images[0].classifiers[0].classes[0].class);
              //  iclass[i] = JSON.stringify(data.images[ix].classifiers[ix].classes);
              if(json.data[ix].type == "image"){ jtype="photo";}
              if(json.data[ix].location == true){ jlocation= json.data[ix].location.name;} else{ jlocation="";}
              if(json.data[ix].users_in_photo != "null"){ taggedPeople="";}
              jlikect = json.data[ix].likes.count;
              jcommentct = json.data[ix].comments.count;
              jcaption = json.data[ix].caption.text.replace("#", " hashtag ");
              var imageClasses = "";
              var imageClassesFinal ="";
              var iColor = [];
              var colorPos=-1;
              //console.log(JSON.stringify(jcaption+json.data[0].users_in_photo+json.data[0].location));
              //console.log("CLASS LEN"+ data.images[0].classifiers[0].classes.length);
              for(var e=0; e < data.images[0].classifiers[0].classes.length; e++){

                  imageClassesFinal += JSON.stringify(data.images[0].classifiers[0].classes[e].class)+ ", ";
                  //if(imageClasses.search("color")){
                  //colorPos = icolors.indexOf(imageClasses);
                  //iColor[e] = imageClasses;
                  //console.log(imageClasses);
                  //}
              }

              //console.log(JSON.stringify(imageClasses));

              instaAudioText[i] = "This post is a "+jtype +". It may contain "+imageClassesFinal+" Post Caption " +jcaption+" " +jlocation + "Tagged People " + taggedPeople + "Post contains colors: "+ jlikect + " Likes and "+jcommentct+ " comments."
              console.log("SPEAKNOW"+instaAudioText[i]);

              //instaAudioText[i] = data.images[0].classifiers[0].classes[0].class;
              createAudio(instaAudioText[i], "audio"+ix);
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
    //res.send(json);
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


// SEND MESSAGE TO CONVERSATION
// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '00a10fb7-60bf-4ee3-9b68-e0a827bfa268';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }

    var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
    };

    // Send the input to the conversation service
    conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    console.log("SENDING MESSAGE");
    console.log(data);

      console.log("TXT"+data.output.text[0]);
      //Synthesizing output text for play

      console.log("INTENT"+data.intent);
      //console.log("INTENT"+data.input.text);

      if(data.intents != ""){
        console.log(data.intents[0].intent);
        // Check for action flags.
        if(data.intents[0].intent == "ViewPost") {
          // User asked what time it is, so we output the local system time.

          console.log('Viewing Post...');

        }else if(data.intents[0].intent == "CreatePost") {
            // User asked what time it is, so we output the local system time.
            //new Sound('https://horus.mybluemix.net/public/audio/output.wav').play();
            console.log('Creating Post...');


          }
      }

      if(data.output.text == "wiew post") {
          // User asked what time it is, so we output the local system time.
          console.log('Viewing Post...');
      }
      else if (data.output.action === 'end_conversation') {
        // User said goodbye, so we're done.
        console.log(data.output.text[0]);
        endConversation = true;
      } else {
        // Display the output from dialog, if any.
      }

      res.json(updateMessage(payload, (data)));
  });


});


/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  console.log("UPDATE MESSAGE");
  var responseText = null;
  //console.log(input);
  console.log("Creating audio");
  var horusaudio = response.output.text[0].replace(/\s/g, '_');
  horusaudio = horusaudio.replace('?', '');
  console.log(horusaudio);
  var d = createAudio(response.output.text[0], horusaudio);
  if(d){
    console.log("Try play audio");
    try{
      play.sound('public/audio/'+horusaudio+'.wav');
    }catch(err){
      console.log("Error playing audio");
    }
  }

  if (!response.output) {
    response.output = {};
    console.log(response.output);
  } else {
    return response;
  }

  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }



  response.output.text = responseText;
  return response;
}
// ================================================================
// FUNCTIONS
// ================================================================

function createAudio(instatext, filename){
    var params = {
      text: instatext,
      voice: 'en-US_MichaelVoice', // Optional voice
      accept: 'audio/wav'
    };
    try{
      //var filename = "instaaudio";
      // Pipe the synthesized text to a file
      text_to_speech.synthesize(params).pipe(fs.createWriteStream('public/audio/'+ filename+'.wav'));

    }catch(err){
      console.log("Error dito mga besh");

    }

}

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
