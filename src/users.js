const request = require('request');
const requestPromise = require('request-promise');
const q = require('q');

const users = require('./models/users');
const util = require('./util');

function createUser(req, res, callback) {
    let createUserData = {
        "email": req.body.email,
        "user_metadata": {
            "role": "admin",
            "schoolId": req.body.schoolId,
            "phoneNumber": req.body.phoneNumber
        },
        "blocked": false,
        "email_verified": false,
        "app_metadata": {},
        "given_name": req.body.fullName && req.body.fullName.split(' ')[0] || "",
        "family_name": req.body.fullName && req.body.fullName.split(' ')[1] || "",
        "name": req.body.fullName || "",
        "user_id": req.body.id,
        "connection": "Username-Password-Authentication",
        "password": req.body.password,
        "verify_email": true
    };
    console.log(req.body);
    requestPromise({
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + util.config.auth0.apiToken
        },
        uri: 'https://' + util.config.auth0.domain + '/api/v2/users',
        form: createUserData,
        method: 'POST',
        resolveWithFullResponse: true
      }).then(async function(body){
        var user = JSON.parse(body.body);
        console.log(user);
        await users.insertUser(user);
        callback(user);
    }).catch(function(error){
        console.log(error);
        callback(JSON.parse(error.error || error));
    });
}

function createMultipleUsers(req, res, callback) {
    var promises = [];
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
            'Authorization': 'Bearer ' + util.config.auth0.apiToken
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
            deferred.reject({ status: "Error", message: error.error || error });
        });
        promises.push(deferred.promise);
    });
    q.all(promises).then(function(data){
        console.log(data)
        callback(data);
    }).catch(function(error){
        console.log(error)
        callback(JSON.parse(error.message || error));
    });
}
module.exports = { createUser, createMultipleUsers };
