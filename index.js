const express = require('express');
const request = require('superagent');
const apicache = require('apicache');
const redis = require('redis');

const PORT = process.env.PORT || 3030;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const app = express();
const client = redis.createClient(REDIS_PORT);

const cacheWithRedis = apicache
                        .options({
                          redisClient: client,
                          debug: true,
                        })
                        .middleware;

function respond(org, numberOfRepos) {
  return `Organization "${org}" has ${numberOfRepos} public repositories!`;
}

function getNumberOfRepos(req, res, next) {
  const org = req.query.org;
  request.get(`https://api.github.com/users/${org}/repos`, function (err, response) {
    if (err) throw err;

    // response.body contains an array of public repositories
    const repoNumber = response.body.length;
    res.send(respond(org, repoNumber));
  });
}

app.get('/repos', cacheWithRedis('30 minutes'), getNumberOfRepos);

app.listen(PORT, function () {
  console.log('app listening on port', PORT);
});
