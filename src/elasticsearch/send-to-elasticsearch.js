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

async function fill(title, author, lyrics, language, link) {
  await client.index({
    index: "songs",
    body: {
      title,
      author,
      lyrics,
      language,
      link,
    },
  });

  await client.indices.refresh({ index: "songs" });
}

module.exports = { fill };
