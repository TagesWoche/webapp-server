##Node.js server für tageswoche web apps

###Football

- Google Docs API
- API for visualisations

This API gives you FC Basel game and player stats dating back to the 2012/13 season. New data is added after every game (since it's added manually, it might take 1-3 days).
Data includes
- All players
- Games (general): Date, opponent, competition. home/away, result
- Games (per player): minutes played, no of goals/assists, no of yellow/yellow-red/red cards, rating
- Goal scenes analysis: A chess-like notation to show the ball found its way to the net. Includes: Involved players and their positions, minute of the game, goal details.

See the spreadsheet: https://docs.google.com/a/tageswoche.ch/spreadsheet/ccc?key=0At91HUqcYc5RdDVRaVhmY1RZemlWcXNFa2l0NzhsakE#gid=0

####Development Setup
We will create a real documentation of the API later, if you have any questions, feel free to ask david.bauer@tageswoche.ch or Gabriel and Lukas from Upfront.io, who created the API for TagesWoche.

If you build an application based on this data, please credit TagesWoche with a link to rotblaulive.ch and drop us a note.
For our own visualisations based on the API, see the other repos.

Requirements:

 - node.js
 - redis

Setup:

    $ npm install (to install dependencies)
    $ redis-server (for the redis connection)
    $ nodemon bin/server (run this from the root of the project)

Run all Tests:

    $ vows test/**/*
