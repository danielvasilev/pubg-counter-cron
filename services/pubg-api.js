const axios = require("axios");
const API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJhOGNkY2E2MC1hOGEyLTAxMzctMDM0MS0zYmJmYTQ3OGMxNzEiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNTY2NjU0MDI4LCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6ImRhbmllbC1kdi12YXNpIn0.QB_iGuaiBfc0MV_PL5tTDusC6l-2BEQLsXaiToPt8oI';
const BASE_PATH = 'https://api.pubg.com/shards/steam'
const HEADERS = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.api+json'
}

function getPlayerData(accountId, callback, onError) {
    const url = `/players/${accountId}`;
    const instance = axios.create({
        baseURL: BASE_PATH,
        headers: HEADERS,
    });
    instance.get(url)
        .then(function (response) {
            let player = {
                playerMatches: response.data.data.relationships.matches.data.map(match => match.id),
                playerName: response.data.data.attributes.name,
                playerId: response.data.data.id
            };
            callback(player);
        }).catch(error => {
            console.log('\x1b[31m', error.response.status);
            onError();
        });
}

function getMatchData(matchId, callback) {
    const url = `/matches/${matchId}`;
    const instance = axios.create({
        baseURL: BASE_PATH,
        headers: HEADERS,
    });
    instance.get(url)
        .then(function (response) {
            let data = response.data.data;
            let match = {
                id: data.id,
                players: response.data.included.filter(i => i.type === 'participant').map(i => i.attributes.stats.playerId),
                dateate: data.attributes.createdAt,
                gameMode: data.attributes.gameMode,
                map: data.attributes.mapName
            };
            callback(match);
        }).catch(error => {
            console.log(error);
        });
}

exports.getPlayerData = getPlayerData;
exports.getMatchData = getMatchData;