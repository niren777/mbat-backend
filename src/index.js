const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');


const app = express()
  .use(cors())
  .use(bodyParser.json());

const util = require('./util');
util.config = require("./config")[app.get("env")];

console.log(util.config)
const usersModel = require('./models/users');
const users = require('./users');
const schools = require('./schools');

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

app.get('/api/public', function(req, res) {
    // console.log(users.getUserDocument());
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
});
app.post('/user', function(req, res) {
    // console.log(users.getUserDocument());
    users.createUser(req, res, function(data){res.json(data)});
});
app.post('/users', checkJwt, function(req, res) {
  // console.log(users.getUserDocument());
  users.createMultipleUsers(req, res, function(data){res.json(data)});
});
app.get('/schools', function(req, res) {
  usersModel.getSchools().then(function(data){
    res.json(data);
  }).catch(function(error){
    res.json(error);
  });
});
app.post('/schools', checkJwt, function(req, res) {
  schools.createMultipleSchools(req, res, function(data){res.json(data)});
});
