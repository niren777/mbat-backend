const request = require('request');
const requestPromise = require('request-promise');
const q = require('q');

const users = require('./models/users');
const util = require('./util');

function getAccessToken(){
    var deferred = q.defer();
    var options = {
        method: 'POST',
        url: 'https://' + util.config.auth0.domain + '/oauth/token',
        headers: { 'content-type': 'application/json' },
        body: '{"client_id":"' + util.config.auth0.clientId + '","client_secret":"' + util.config.auth0.clientSecret + '","audience":"https://' + util.config.auth0.domain + '/api/v2/","grant_type":"client_credentials"}'
     };
    console.log(options)
    request(options, function (error, response, body) {
        if (error) deferred.reject(error);
        deferred.resolve(JSON.parse(body));
    });
    return deferred.promise;
}
function getToken(userData) {
    var deferred = q.defer();
    const bodyParams = {
        client_id: util.config.auth0.clientId,
        grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
        username: userData.email,
        password: userData.password,
        audience: 'https://' + util.config.auth0.domain +'/api/v2/',
        scope: 'openid',
        client_secret: util.config.auth0.clientSecret,
        realm: 'Username-Password-Authentication'
      };
      request('https://' + util.config.auth0.domain + '/oauth/token', {
        crossDomain: true,
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyParams)
      }, function(error, data){
        if(error) {
            deferred.reject(error);
        }
        deferred.resolve(JSON.parse(data.body));
      });
      return deferred.promise;
}
function createUser(req, res, callback) {
    let createUserData = {
        "email": req.body.email,
        "user_metadata": {
            "role": "member",
            "schoolId": req.body.schoolId,
            "phoneNumber": req.body.phoneNumber
        },
        "blocked": false,
        "email_verified": false,
        "app_metadata": {},
        "given_name": req.body.firstName,
        "family_name": req.body.lastName,
        "name": req.body.firstName + " " + req.body.lastName,
        "user_id": req.body.id,
        "connection": "Username-Password-Authentication",
        "password": req.body.password,
        "verify_email": true
    };
    let otherData = {
        yearOfGraduation: req.body.yearOfGraduation,
        linkedIn: req.body.linkedIn
    }
    console.log(req.body);
    makeUserAPICall(createUserData, otherData, callback);
}
function makeUserAPICall(createUserData, otherData, callback) {
    getAccessToken().then(function(token) {
        console.log(token)
        requestPromise({
            headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token.access_token
            },
            uri: 'https://' + util.config.auth0.domain + '/api/v2/users',
            form: createUserData,
            method: 'POST',
            resolveWithFullResponse: true
        }).then(async function(body){
            var user = JSON.parse(body.body);
            console.log(user);
            await users.insertUser(user, otherData);
            getToken(createUserData).then(function(tokenData){
                user.access_token = tokenData.access_token;
                console.log(user)
                callback(user);
            }).catch(function(error){
                callback(JSON.parse(error.error || error));
            });
        }).catch(function(error){
            callback(JSON.parse(error.error || error));
        });
    });
}

function createMultipleUsers(req, res, callback) {
    var promises = [];
    getAccessToken().then(function(token) {
        req.body.forEach(function(user){
            var deferred = q.defer();
            let createUserData = {
                "email": user.email,
                "user_metadata": {
                    "role": "admin",
                    "schoolId": user.schoolId,
                    "phoneNumber": req.body.phoneNumber
                },
                "blocked": false,
                "email_verified": false,
                "app_metadata": {},
                "given_name": user.fullName && user.fullName.split(' ')[0] || "",
                "family_name": user.fullName && user.fullName.split(' ')[1] || "",
                "name": user.fullName || "",
                "user_id": user.id,
                "connection": "Username-Password-Authentication",
                "password": user.password,
                "verify_email": true
            };
            requestPromise({
                headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token.access_token
                },
                uri: 'https://' + util.config.auth0.domain + '/api/v2/users',
                form: createUserData,
                method: 'POST',
                resolveWithFullResponse: true
            }).then(async function(body){
                var user = JSON.parse(body.body);
                await users.insertUser(user);
                deferred.resolve(user);
            }).catch(function(error){
                console.log("error1111");
                deferred.reject(error.message || error);
            });
            promises.push(deferred.promise);
        });
        q.all(promises).then(function(data){
            callback(data);
        }).catch(function(error){
            callback(error.message || error);
        });
    });
}

function changePassword(password, email) {
    var deferred = q.defer();
    getAccessToken().then(function(token) {
        console.log(token)
        var options = {
            method: 'PATCH',
            url: 'https://' + util.config.auth0.domain + '/api/v2/users/' + email,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token.access_token
            },
            body: {password: password, connection: 'Username-Password-Authentication'},
            json: true
        };
        requestPromise(options).then(function (body) {
            console.log(body)
            deferred.resolve(JSON.parse(body));
        }).catch(function(error){
            // console.log(error)
            deferred.reject(error);
        });
    });
    return deferred.promise;
}
module.exports = { createUser, createMultipleUsers, getToken, makeUserAPICall, changePassword };
