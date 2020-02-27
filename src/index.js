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

console.log(util.config)
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
      console.log(data.body)
      req.user = JSON.parse(data.body);
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
  // console.log(req.user);
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
app.post('/attendee', checkJwt, function(req, res) {
  // attendee.getAndStoreAttendees(function(data){res.json(data)});

  let orders = [
    {
        "orderNo": "RK610K-EFAAIIF-200227-225802-1484",
        "orderCost": 0,
        "quantity": 2,
        "status": "success",
        "paidBy": "Free",
        "paidTo": "",
        "refundAmount": null,
        "purchaseDate": {
            "date": "2020-02-27 00:00:00.000000",
            "timezone_type": 3,
            "timezone": "Asia/Calcutta"
        },
        "name": "vasanth",
        "email": "thiru1921+101@gmail.com",
        "city": "",
        "state": "",
        "country": "",
        "address": "",
        "zipcode": "",
        "phoneNo": "+91 9611879248",
        "attendee": [
            {
                "ticketName": "Mbat Tournament",
                "ticketId": "TKCFGGIJG",
                "name": null,
                "email": "thiru1921+121@gmail.com",
                "checkin": "no",
                "ticketNo": "161",
                "status": "attending",
                "details": {
                    "First Name": "vasanth",
                    "Last Name": "kumar"
                }
            },
            {
                "ticketName": "Early bird",
                "ticketId": "TKCFGGIJH",
                "name": null,
                "email": "thiru1921+122@gmail.com",
                "checkin": "no",
                "ticketNo": "162",
                "status": "attending",
                "details": {
                    "First Name": "vasanth",
                    "Last Name": "kumar"
                }
            }
        ]
    },
    {
        "orderNo": "RK610K-EFAAIIF-200227-225030-1478",
        "orderCost": 0,
        "quantity": 4,
        "status": "success",
        "paidBy": "Free",
        "paidTo": "",
        "refundAmount": null,
        "purchaseDate": {
            "date": "2020-02-27 00:00:00.000000",
            "timezone_type": 3,
            "timezone": "Asia/Calcutta"
        },
        "name": "vasanth",
        "email": "thiru1921+102@gmail.com",
        "city": "",
        "state": "",
        "country": "",
        "address": "",
        "zipcode": "",
        "phoneNo": "+91 9611879248",
        "attendee": [
            {
                "ticketName": "Mbat Tournament",
                "ticketId": "TKCFGGIJJ",
                "name": null,
                "email": "thiru1921+124@gmail.com",
                "checkin": "no",
                "ticketNo": "157",
                "status": "attending",
                "details": {
                    "First Name": "vasanth",
                    "Last Name": "kumar"
                }
            },
            {
                "ticketName": "Mbat Tournament",
                "ticketId": "TKCFGGIJA",
                "name": null,
                "email": "thiru1921+125@gmail.com",
                "checkin": "no",
                "ticketNo": "158",
                "status": "attending",
                "details": {
                    "First Name": "vasanth",
                    "Last Name": "kumar"
                }
            },
            {
                "ticketName": "Early bird",
                "ticketId": "TKCFGGIJB",
                "name": null,
                "email": "thiru1921+126@gmail.com",
                "checkin": "no",
                "ticketNo": "159",
                "status": "attending",
                "details": {
                    "First Name": "vasanth",
                    "Last Name": "kumar"
                }
            },
            {
                "ticketName": "Early bird",
                "ticketId": "TKCFGGIJC",
                "name": null,
                "email": "thiru1921+127@gmail.com",
                "checkin": "no",
                "ticketNo": "160",
                "status": "attending",
                "details": {
                    "First Name": "vasanth",
                    "Last Name": "kumar"
                }
            }
        ]
    },
    {
        "orderNo": "RK610K-EFAAIIF-200227-224631-1473",
        "orderCost": 0,
        "quantity": 1,
        "status": "success",
        "paidBy": "Free",
        "paidTo": "",
        "refundAmount": null,
        "purchaseDate": {
            "date": "2020-02-27 00:00:00.000000",
            "timezone_type": 3,
            "timezone": "Asia/Calcutta"
        },
        "name": "Jc",
        "email": "thiru1921+103@gmail.com",
        "city": "",
        "state": "",
        "country": "",
        "address": "",
        "zipcode": "",
        "phoneNo": "+33 1234567890",
        "attendee": [
            {
                "ticketName": "Mbat Tournament",
                "ticketId": "TKCFGGHIH",
                "name": null,
                "email": "thiru1921+129@gmail.com",
                "checkin": "no",
                "ticketNo": "156",
                "status": "attending",
                "details": {
                    "First Name": "Jc",
                    "Last Name": "Jcd"
                }
            }
        ]
    },{
      "orderNo": "RK610K-EFAAIIF-200227-223447-1467",
      "orderCost": 0,
      "quantity": 1,
      "status": "success",
      "paidBy": "Free",
      "paidTo": "",
      "refundAmount": null,
      "purchaseDate": {
          "date": "2020-02-27 00:00:00.000000",
          "timezone_type": 3,
          "timezone": "Asia/Calcutta"
      },
      "name": "Thirupathi",
      "email": "thiru1921+98@gmail.com",
      "city": "Bengaluru",
      "state": "",
      "country": "India",
      "address": "",
      "zipcode": "",
      "phoneNo": "+91 7204473342",
      "attendee": [
          {
              "ticketName": "Mbat Tournament",
              "ticketId": "TKCFGGHIE",
              "name": null,
              "email": "thiru1921+130@gmail.com",
              "checkin": "no",
              "ticketNo": "155",
              "status": "attending",
              "details": {
                  "First Name": "Thirupathi",
                  "Last Name": "Raja"
              }
          }
      ]
  },
  {
      "orderNo": "RK610K-EFAAIIF-200227-210823-1283",
      "orderCost": 0,
      "quantity": 7,
      "status": "success",
      "paidBy": "Free",
      "paidTo": "",
      "refundAmount": null,
      "purchaseDate": {
          "date": "2020-02-27 00:00:00.000000",
          "timezone_type": 3,
          "timezone": "Asia/Calcutta"
      },
      "name": "vasanth",
      "email": "thiru1921+99@gmail.com",
      "city": "",
      "state": "",
      "country": "",
      "address": "",
      "zipcode": "",
      "phoneNo": "+91 9611879248",
      "attendee": [
          {
              "ticketName": "Mbat Tournament",
              "ticketId": "TKCFGGGBB",
              "name": null,
              "email": "thiru1921+131@gmail.com",
              "checkin": "no",
              "ticketNo": "148",
              "status": "attending",
              "details": {
                  "First Name": "vasanth",
                  "Last Name": "kumar"
              }
          },
          {
              "ticketName": "Mbat Tournament",
              "ticketId": "TKCFGGGBC",
              "name": null,
              "email": "thiru1921+132@gmail.com",
              "checkin": "no",
              "ticketNo": "149",
              "status": "attending",
              "details": {
                  "First Name": "vasanth",
                  "Last Name": "kumar"
              }
          },
          {
              "ticketName": "Early bird",
              "ticketId": "TKCFGGGBD",
              "name": null,
              "email": "thiru1921+133@gmail.com",
              "checkin": "no",
              "ticketNo": "150",
              "status": "attending",
              "details": {
                  "First Name": "vasanth",
                  "Last Name": "kumar"
              }
          },
          {
              "ticketName": "Early bird",
              "ticketId": "TKCFGGGBE",
              "name": null,
              "email": "thiru1921+134@gmail.com",
              "checkin": "no",
              "ticketNo": "151",
              "status": "attending",
              "details": {
                  "First Name": "vasanth",
                  "Last Name": "kumar"
              }
          },
          {
              "ticketName": "Early bird",
              "ticketId": "TKCFGGGBF",
              "name": null,
              "email": "thiru1921+134@gmail.com",
              "checkin": "no",
              "ticketNo": "152",
              "status": "attending",
              "details": {
                  "First Name": "vasanth",
                  "Last Name": "kumar"
              }
          },
          {
              "ticketName": "Early bird",
              "ticketId": "TKCFGGGBG",
              "name": null,
              "email": "thiru1921+136@gmail.com",
              "checkin": "no",
              "ticketNo": "153",
              "status": "attending",
              "details": {
                  "First Name": "vasanth",
                  "Last Name": "kumar"
              }
          },
          {
              "ticketName": "Early bird",
              "ticketId": "TKCFGGGBH",
              "name": null,
              "email": "thiru1921+137@gmail.com",
              "checkin": "no",
              "ticketNo": "154",
              "status": "attending",
              "details": {
                  "First Name": "vasanth",
                  "Last Name": "kumar"
              }
          }
      ]
  }
  ];
  attendee.syncAttendees(orders, function(data){res.json(data)});
});
