/* jshint esversion:6*/

// Taken from http://stackoverflow.com/a/9722502/4923167
CanvasRenderingContext2D.prototype.clear =
    CanvasRenderingContext2D.prototype.clear || function(preserveTransform) {
        if (preserveTransform) {
            this.save();
            this.setTransform(1, 0, 0, 1, 0, 0);
        }

        this.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (preserveTransform) {
            this.restore();
        }
    };



//canvas
var canvas = document.getElementById('game'),
    ctx = canvas.getContext('2d'),
    Colors = [],
    Screen = [],
    Timer = 0,
    currentColor = -1,
    MousePos = { x: -1, y: -1 };

function updateCanvas() {
    ctx.clear();
    requestAnimationFrame(updateCanvas);

    if (Screen.length > 0) {
        if (Colors.length > 0) {
            for (let x = 0; x < Screen.length; x++) {
                if (!Screen[x]) continue;
                for (let y = 0; y < Screen[x].length; y++) {
                    if (isNaN(Screen[x][y])) continue;
                    ctx.fillStyle = Colors[Screen[x][y]] || 'white';
                    ctx.fillRect(x * 7.5, y * 7.5, 7.5, 7.5);
                    if (doesCollideWithMouse(x, y)) {
                        ctx.beginPath();
                        ctx.strokeStyle = 'pink';
                        ctx.lineWidth = "2";
                        ctx.rect(x * 7.5, y * 7.5, 7.5, 7.5);
                        ctx.stroke();
                    }
                }
            }
        }
    }
}


function doesCollideWithMouse(x, y) {
    if (
        MousePos.x < x * 7.5 + 7.5 &&
        MousePos.x > x * 7.5 &&
        MousePos.y < y * 7.5 + 7.5 &&
        (MousePos.y) > y * 7.5
    ) {
        return true;
    }
    return false;
}



function updateColors(colors) {
    Colors = colors;
    let $colors = $('div#colors');
    $colors.empty();
    let toAppend = [];
    for (let i = 0; i < Colors.length; i++) {
        toAppend.push($('<div class="color"></div>').css('background-color', Colors[i]).attr('num', i));
    }

    $colors.append(...toAppend);
}

function updateTimer(time) {
    Timer = time;
    $('p#timer').text('Timer: ' + time);
}



//websockets
var ws = new WebSocket('ws://localhost:6060');

ws.onopen = p => {
    send({ cmd: 'join' });
};
ws.onclose = p => {
    /*Commented out for easier testing
    alert('You have been disconnected, refreshing now...');
    location.href = location.href;*/
};
ws.onmessage = message => {
    let args = JSON.parse(message.data);
    console.log(args);
    COMMANDS[args.cmd](args);
};

function send(data) {
    if (ws && ws.readyState == ws.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

var HasConnected = false;

//Commands
var COMMANDS = {
    data: args => {
        if (args.colors) updateColors(args.colors);
        if (args.screen) Screen = args.screen;
        if (!HasConnected) {
            HasConnected = true;
            updateCanvas();
        }
    },
    update: args => {
        if (args.screen) {
            for (let x = 0; x < args.screen.length; x++) {
                if (!args.screen[x]) continue;
                for (let y = 0; y < args.screen[x].length; y++) {
                    if (isNaN(args.screen[x][y]) || args.screen[x][y] === null) continue;
                    Screen[x][y] = args.screen[x][y];
                }
            }
        }
        if (!isNaN(args.colors)) {
            Colors = args.colors;
        }
        if (!isNaN(args.timer)) {
            updateTimer(args.timer);
        }
        if ((args.color || args.color === 0) && (args.x || args.x === 0) && (args.y || args.y === 0)) {
            Screen[args.x][args.y] = args.color;
        }
    },
    alert: args => {
        alert(args.text);
    }
};

function getMousePos(obj) {
    /* let rect = canvas.getBoundingClientRect();
    return {
        x: Math.round((x - rect.left) / (rect.right - rect.left) * canvas.width),
        y: Math.round((y - rect.top) / (rect.bottom - rect.top) * canvas.height)
	};*/
    let curLeft = 0,
        curTop = 0;
    if (obj.offsetParent) {
        do {
            curLeft += obj.offsetLeft;
            curTop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return {
            x: curLeft,
            y: curTop
        };
    }
    return;
}
$('canvas#game').on('mousemove', function(e) {
    let pos = getMousePos(this);
    MousePos.x = e.pageX - pos.x;
    MousePos.y = e.pageY - pos.y
        //console.log(`Coords:\nX=${MousePos.x}\nY=${MousePos.y}`);
});
$('canvas#game').on('click', e => {
    if (!Timer) {
        send({
            cmd: 'place',
            x: Math.floor(MousePos.x / 7.5),
            y: Math.floor(MousePos.y / 7.5),
            color: currentColor
        });
    }
});
$(document).on('click', '.color', function(e) {
    let num = Number($(this).attr('num'));
    if (isNaN(num)) return alert('Client-Error: Colors not working properly, refresh if this continues.');

    currentColor = num;
    $('p#color').text('Color: ' + Colors[currentColor]);
});
updateTimer(0);