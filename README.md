# pubg-counter-cron

This app is a cron job that runs in the background to update the player <-> matches relationship.

What does it do?
This app runs a cron job which looks for not processed player and matches and retrieves the data from pubg API for them.
Every player has multiple matches and every match has up to 100 players. 
The cron job will process one player or match at a time.
It will get the matches and players and push only the ones that do not exist in the database after doing that it will mark the match or the player as processed.

Requirements:
pubg API key
mongodb - local or remote (Atlas)

The structure of the database:
2 collections
1) players
2) matches

Botch collections have is_processed: true/false fields

To run:
node cron-pubg.js
