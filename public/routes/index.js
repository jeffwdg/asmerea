'use strict';

module.exports = function(app) {
 app.get('/', function(req, res) {
   res.render('index');
 });
 app.get('/posts', function(req, res) {
   res.render('posts');
 });
};
