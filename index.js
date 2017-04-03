/* jshint esversion:6*/
var WebSocket = require('ws');

var Screen = (p => {
    let arr = [];
    for (let x = 0; x < 100; x++) {
        if (!arr[x]) arr[x] = [];
        for (let y = 0; y < 100; y++) {
            if (!arr[x][y]) arr[x][y] = 0;
        }
    }
    return arr;
})();
var Colors = [
    'black',
    'white',
    'red',
    'green',
    'blue',
    'purple',
    'hotpink',
    'grey',
    'yellow',
    'orange',
    'lightblue'
];

var COMMANDS = {
    join: args => {
        args.client.timer = 0;
        args.client.joined = true;
        return send({
            cmd: 'data',
            colors: Colors,
            screen: Screen
        }, args.client);
    },
    place: args => {
        if (!args.client.joined) return;
        let x = args.x,
            y = args.y,
            color = args.color;

        if (args.client.timer !== 0) return send({ cmd: 'alert', text: 'ERROR: Your timer has not run out yet.' });

        if (isNaN(x)) return send({ cmd: 'alert', text: 'ERROR: x Position must be a number. Refresh if it doesn\'t fix itself.' }, args.client);
        if (isNaN(y)) return send({ cmd: 'alert', text: 'ERROR: y Position must be a number. Refresh if it doesn\'t fix itself.' }, args.client);
        if (isNaN(color)) return send({ cmd: 'alert', text: 'ERROR: color must be a number. Refresh if it doesn\'t fix itself.' }, args.client);

        if (typeof(Colors[color]) !== 'string') return send({ cmd: 'alert', text: 'ERROR: That color does not exist. Refresh it if it does not fix itself.' }, args.client);

        Screen[x][y] = color;

        args.client.timer = 10;

        let arr = [];
        arr[x] = [];
        arr[x][y] = color;
        for (let client of Server.clients) {
            send({
                cmd: 'update',
                color: color,
                x: x,
                y: y,
                timer: client.timer
            }, client);
        }
    }
};


var Server = new WebSocket.Server({
    perMessageDeflate: true,
    host: '0.0.0.0',
    port: 6060
});

function send(data, client) {
    try {
        if (client.readyState == WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    } catch (err) {}
}
console.log('Started server on localhost:6060');

Server.on('connection', client => {
    client.on('message', data => {
        try {
            let args = JSON.parse(data),
                command = COMMANDS[args.cmd];
            console.log(args);
            if (command && args) {
                args.client = client;
                command(args);
            }
        } catch (err) {
            console.warn(err);
        }
    });
});


function updateTimer() {
    for (let client of Server.clients) {
        if (!client.timer) continue;
        client.timer--;
        send({
            cmd: 'update',
            timer: client.timer
        }, client);
    }
}

setInterval(updateTimer, 1000);