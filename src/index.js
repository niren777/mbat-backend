const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const request = require('request');


const app = express()
  .use(cors())
  .use(bodyParser.json());

const util = require('./util');
util.config = require("./config")[app.get("env")];

console.log(util.config, app.get("env"))
const usersModel = require('./models/users');
const users = require('./users');
const schools = require('./schools');
const attendee = require('./attendee');

const port = process.env.PORT || util.config.port;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
// server.js

// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and 
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://' + util.config.auth0.domain + '/.well-known/jwks.json'
  }),

  // Validate the audience and the issuer.
  audience: 'https://' + util.config.auth0.domain + '/api/v2/',
  issuer: 'https://' + util.config.auth0.domain + '/',
  algorithms: ['RS256']
});

const getUserInfo = function(req, res, next) {
  console.log(req.headers.authorization);
  request('https://' + util.config.auth0.domain + '/userinfo', {
    crossDomain: true,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization
    }
  }, function(error, data){
    if(error) {
        res.json({
          'error': 'error'
        })
    }
    if(data) {
      console.log(data.body)
      req.user = JSON.parse(data.body);
    }
    next();
  });
};
app.get('/public', function(req, res) {
    // console.log(users.getUserDocument());
    users.getToken()
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
});
app.get('/user', checkJwt, getUserInfo, function(req, res) {
  console.log(req.user);
  usersModel.getUser(req.user.email).then(function(data){res.json(data)});
});
app.post('/user', function(req, res) {
    // console.log(users.getUserDocument());
    users.createUser(req, res, function(data){res.json(data)});
});
app.post('/users', checkJwt, function(req, res) {
  // console.log(users.getUserDocument());
  users.createMultipleUsers(req, res, function(data){res.json(data)});
});
app.patch('/users', checkJwt, getUserInfo, function(req, res) {
  if (req.body.password) {
    console.log(req.user)
    return users.changePassword(req.body.password, req.user.sub);
  } else {

  }
  // attendee.syncAttendees(orders, function(data){res.json(data)});
});
app.get('/users', checkJwt, function(req, res) {
  usersModel.getUsers().then(function(data){
    res.json(data);
  }).catch(function(error){
    res.json(error);
  });
});

app.post('/users/token', function(req, res) {
  var options = { method: 'POST',
    url: 'https://' + util.config.auth0.domain + '/oauth/token',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form:{ 
        grant_type: 'password',
        username: req.body.email,
        password: req.body.password,
        audience: util.config.auth0.apiIdentifier,
        scope: 'openid',
        client_id: util.config.auth0.clientId,
        client_secret: util.config.auth0.clientSecret 
      }
    };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);

    res.json(JSON.parse(body));
  });
});

app.get('/orders', checkJwt, getUserInfo, function(req, res) {
  console.log(req.user.email);
  usersModel.getOrders(req.user.email).then(
    function(data){res.json(data)}).catch(function(error){res.json(error)});
});

app.get('/schools', function(req, res) {
  usersModel.getSchools().then(function(data){
    res.json(data);
  }).catch(function(error){
    res.json(error);
  });
});
app.post('/schools', function(req, res) {
  schools.createMultipleSchools(req, res, function(data){res.json(data)});
});
app.patch('/schools/:id', checkJwt, function(req, res) {
  if (req.body.points && req.params.id) {
    usersModel.updatePointsForSchool(req.body.points, req.params.id).then(function(data){
      res.json(data);
    }).catch(function(error){
      res.status(404).send(error);
    });
  }
});

app.get('/questions', checkJwt, function(req, res) {
  usersModel.fetchQuestions().then(function(data){
    res.json(data);
  }).catch(function(error){
    res.json(error);
  });
});
app.patch('/questions/:questionId/', checkJwt, function(req, res) {
  if (req.body.status && req.params.questionId) {
    usersModel.activateQuestion(req.body.status, req.params.questionId).then(function(data){
      res.json(data);
    }).catch(function(error){
      res.status(404).send(error);
    });
  }
});
app.post('/questions', checkJwt, function(req, res) {
  usersModel.insertQuestion(req.body).then(function(data){
    res.json(data);
  }).catch(function(error){
    res.status(404).send(error);
  });
});
app.get('/questions/active', checkJwt, function(req, res) {
  usersModel.fetchActiveQuestion().then(function(data){
    res.json(data);
  }).catch(function(error){
    res.status(404).send(error);
  });
});

app.post('/attendee', checkJwt, function(req, res) {
  attendee.getAndStoreAttendees(function(data){res.json(data)});
  // attendee.syncAttendees(orders, function(data){res.json(data)});
});

