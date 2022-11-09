const { Client } = require("@elastic/elasticsearch");
const config = require("config");
const elasticConfig = config.get("elastic");

const client = new Client({
  cloud: {
    id: elasticConfig.cloudID,
  },
  auth: {
    username: elasticConfig.username,
    password: elasticConfig.password,
  },
});

client
  .info()
  .then((response) => console.log(response))
  .catch((error) => console.error(error));

async function findSong(text) {
  console.log("findSong");
  const response = await client.search({
    index: "songs",
    body: {
      query: {
        match: {
          lyrics: text,
        },
      },
    },
  });
  console.log(response.hits.hits);
  return response.hits.hits[0]._source;
}

module.exports = { findSong };
