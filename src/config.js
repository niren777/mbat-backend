module.exports = {
    development: {
        port: 8080,
        environment: "development",
        auth0: {
            domain: 'blr-mbat.auth0.com',
            clientId: 'PCTTqLIlZIdN5PShWs7wi0y9cFHM2VoI',
            clientSecret: '79BMOtPP_MCgsQJFIK98wEp7e8wJfQT-p2R63bBDa2ROjW5NmO5lU8I6z9ubUQPa'
        },
        mongodb: {
            domain: 'localhost',
            port: '27017'
        },
    },
    production: {
        port: 8080,
        environment: "production",
        auth0: {
            domain: 'blr-mbat.auth0.com',
            clientId: 'PCTTqLIlZIdN5PShWs7wi0y9cFHM2VoI',
            clientSecret: '79BMOtPP_MCgsQJFIK98wEp7e8wJfQT-p2R63bBDa2ROjW5NmO5lU8I6z9ubUQPa'
        },
        mongodb: {
            domain: 'localhost',
            port: '27017'
        },
    },
};