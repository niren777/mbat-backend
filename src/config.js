module.exports = {
    development: {
        port: 8080,
        environment: "development",
        auth0: {
            domain: 'blr-mbat.auth0.com',
            clientId: 'PCTTqLIlZIdN5PShWs7wi0y9cFHM2VoI',
            clientSecret: '79BMOtPP_MCgsQJFIK98wEp7e8wJfQT-p2R63bBDa2ROjW5NmO5lU8I6z9ubUQPa',
            apiIdentifier: 'https://blr-mbat.auth0.com/api/v2/'
        },
        mongodb: {
            domain: 'localhost',
            port: '27017'
        },
        explaraAccessToken: 'd3fc964d222c8a6093c7019062f328c0d89bf6f2'
    },
    production: {
        port: 8080,
        environment: "production",
        auth0: {
            domain: 'mbatournament.eu.auth0.com',
            clientId: 'spvllI0SfIkmgC3tIfH4pMTY2WcB7MNF',
            clientSecret: 'rpOTcaHlzrOuCEAOmB-iF1yiEvU62-Btde6LeCfbnVZHICLba2vseMVDxuZV_-rI'
        },
        mongodb: {
            domain: 'localhost',
            port: '27017'
        },
        explaraAccessToken: 'a0430f1408625317f562d3bc7870f9bf62ec437a'
    },
    staging: {
        port: 8080,
        environment: "staging",
        auth0: {
            domain: 'mbat-staging.eu.auth0.com',
            clientId: 'WcptIRns3mgEXol0cyWRYLmStUkSMOA1',
            clientSecret: 'LVvSb2fBGG4F77aeXe2pXvFaozDlbrYy5HIZQos56vVClsKcEVi-XSf9go9y0X29'
        },
        mongodb: {
            domain: 'localhost',
            port: '27017'
        },
        explaraAccessToken: 'd3fc964d222c8a6093c7019062f328c0d89bf6f2'
    }
};