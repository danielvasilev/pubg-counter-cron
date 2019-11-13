const cron = require("node-cron");
const express = require("express");
const fs = require("fs");
const database = require('./utils/database');
const getDb = require('./utils/database').getDb;
const pubgApi = require('./services/pubg-api')

const matchColor = '\x1b[32m';
const succesColor = '\x1b[36m';
const redColor = '\033[91m';
const resetColor = '\x1b[0m';

app = express();
database.mongoConnect(() => { });

cron.schedule('*/1 * * * * *', function () {
    let _db = getDb();
    nextMatch(_db);
});

// cron.schedule('*/5 * * * * *', function () {
//     let _db = getDb();

//     getNextPlayer(_db).then(nextPlayer => {
//         if (Object.keys(nextPlayer).length === 0) {
//             console.log(resetColor, 'No new players to process sleep 5 seconda.');
//         }
//         else {
//             console.log(resetColor, `Found an unprocessed player: ${nextPlayer.name}, id ${nextPlayer.id}`);
//             processPlayer(_db, nextPlayer, pubgApi, () => console.log(redColor, 'Reached max player per minute.'));
//         }
//     });
// });


app.listen(3128);

function nextMatch(db) {
    getNextMatch(db).then(nextMatch => {
        if (nextMatch.id === 'undefined') {
            console.log(resetColor, `All matches are processed. Sleep for 5 seconds.`);
        } else {
            console.log(resetColor, `Found an unprocessed match: ${nextMatch.id}`);
            processMatch(db, nextMatch.id, pubgApi);
        }
    });
}

function insertPlayers(db, matchPlayerData) {
    db.collection('players').find({ player_id: { $in: matchPlayerData.players } }).toArray((error, existingPlayers) => {
        let existingPlayersIds = existingPlayers.map(x => x.player_id);
        let diff = matchPlayerData.players.filter(x => !existingPlayersIds.includes(x));
        if (diff.length > 0) {
            let players = diff.map(playerId => {
                return {
                    player_id: playerId,
                    is_processed: false,
                    player_name: ""
                }
            });
            db.collection('players').insertMany(players, function (err, res) {
                if (err) throw err;
                console.log(matchColor, "Number of documents inserted: " + res.insertedCount);
            });
        } else {
            console.log(redColor, `No new players to add for ${matchPlayerData.match_id}.`)
        }
    });
}

function insertMatches(db, playerData) {
    db.collection('matches').find({ match_id: { $in: playerData.playerMatches } }).toArray((error, existingMatches) => {
        let existingMatchesIds = existingMatches.map(x => x.match_id);
        let diff = playerData.playerMatches.filter(x => !existingMatchesIds.includes(x));
        if (diff.length > 0) {
            let matches = diff.map(matchId => {
                return {
                    match_id: matchId,
                    is_processed: false,
                    date: "",
                    map: "",
                    type: ""
                }
            });
            db.collection('matches').insertMany(matches, function (err, res) {
                if (err) throw err;
                console.log(matchColor, "Number of documents inserted: " + res.insertedCount);
            });
        } else {
            console.log(redColor, `No new matches to add for ${playerData.playerName}.`)
        }
    });
}

function getNextMatch(db) {
    return db.collection('matches').findOne({ is_processed: false }).then(match => {
        if (match == null)
            return {};
        else return {
            proccessed: false,
            id: match.match_id,
            map: match.map,
            date: match.date
        }
    }).catch(err => {
        console.log(err);
    });
}

function processMatch(db, matchId, pubgApi) {
    pubgApi.getMatchData(matchId, (match) => {
        console.log(resetColor, `match ${match.id} ${match.map} ${match.players.length} players.`)
        insertPlayers(db, match);
        db.collection('matches').updateOne({ match_id: matchId }, {
            $set: { is_processed: true }
        }).catch(err => {
            console.log(err);
        });
        console.log(resetColor, `Match processed: ${match.id} ${match.map}`);
    });
}

function getNextPlayer(db) {
    return db.collection('players').findOne({ is_processed: false }).then(player => {
        if (player == null)
            return {};
        else return {
            proccessed: false,
            id: player.player_id,
            name: player.player_name
        }
    }).catch(err => {
        console.log(err);
    });
}

function processPlayer(db, player, pubgApi, onError) {
    pubgApi.getPlayerData(player.id, (playerData) => {
        console.log(resetColor, `Processing ${playerData.playerName} ${playerData.playerMatches.length} matches.`)
        insertMatches(db, playerData);
        db.collection('players').updateOne({ player_id: player.id }, {
            $set: { is_processed: true }
        })
            .then(console.log(resetColor, `Player processed: ${player.name}, id: ${player.id}`))
            .catch(err => {
                console.log(err);
            });

    }, onError);
}