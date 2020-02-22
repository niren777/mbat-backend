const q = require('q');

const users = require('./models/users');

function createMultipleSchools(req, res, callback) {
    var promises = [];
    req.body.forEach(function(school){
        console.log(school)
        var deferred = q.defer();
        users.insertSchool(school).then(function(school){
            deferred.resolve(school);
        }).catch(function(error){
            console.log("school error");
            deferred.reject({ status: "Error", message: error });
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
module.exports = { createMultipleSchools };
