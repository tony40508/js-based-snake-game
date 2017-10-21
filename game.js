var disp = $('.disp'),
    msg = $('.msg');
var availablePixels;
var currentCoin;
var GOOD_MOVE = 1,
    BAD_MOVE = 0,
    ACE_MOVE = 2;
var initialLength = 16;
var dispWidthInPixels = 40;
var gameInterval;
var frameStep, timeStep, currTime;
var gameRunning = false;

// 填充畫素
for (var i = 0; i < dispWidthInPixels; i++) {
    for (var j = 0; j < dispWidthInPixels; j++) {
        var p = $('<div class="pixel" data-x="' + j + '" data-y="' + i + '"></div>');
        disp.append(p);
    }
}

// 動態加入音檔
var beep = document.createElement('audio'),
    gameover = document.createElement('audio');

// 檢查瀏覽器可否播放音樂
// !!是把東西轉成布林值(如果為空字串，代表瀏覽器不支援，故判斷結果為純 false)
// 如果檢查結果是 no ，則將 no 字串取代為空字串
if (!!(beep.canPlayType && beep.canPlayType('audio/mpeg;').replace(/no/, ''))) { 
    beep.src = './src/beep.mp3';
    gameover.src = './src/gameover.mp3'
} else if (!!(beep.canPlayType && beep.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''))) {
    beep.src = './src/beep.ogg';
    gameover.src = './src/gameover.ogg';
}

var showMessage = function(ma, mb) {
    msg.find('.msg-a').text(ma);
    msg.find('.msg-b').text(mb);
};


// Returns true if anything available; false otherwise.
// It would be a good time to declare if we got false.
var useNextRandomPixelForCoin = function() {
    var ap = availablePixels;
    if (ap.length === 0) {
        return false;
    }
    var idx = Math.floor(Math.random() * ap.length);
    currentCoin = ap.splice(idx, 1)[0].split('|'); // ap.splice(idx, 1)[0] 取得刪掉同時又回傳的那一個 availablePixel，currentCoin拿到 x 、 y
    $('div.pixel[data-x="' + currentCoin[0] + '"][data-y="' + currentCoin[1] + '"]').addClass('taken');
    return true;
};

var releasePixel = function(x, y) {
    $('div.pixel[data-x="' + x + '"][data-y="' + y + '"]').removeClass('taken');
    availablePixels.push(x + '|' + y); // x、y 合併成字串
};

// Returns true if successful; false otherwise.
var tryAllocatingPixel = function(x, y) {
    var ap = availablePixels;
    var p = x + '|' + y;
    var idx = ap.indexOf(p);

    // 抓畫素成功！
    if (idx !== -1) {
        // 從 availablePixels 中刪除一個
        ap.splice(idx, 1);
        $('div.pixel[data-x="' + x + '"][data-y="' + y + '"]').addClass('taken');
        return true;
    } else {
        return false;
    }
};

var adjustSpeed = function(l) {
    // frameStep 越小，蛇行進速度越快
    if (l >= 500) {
        frameStep = 50;
    } else if (l >= 400) {
        frameStep = 100;
    } else if (l >= 300) {
        frameStep = 150;
    } else if (l >= 200) {
        frameStep = 200;
    }
};

var snake = {
    direction: 'l',
    bodyPixels: [],
    move: function() {
        var head = this.bodyPixels[this.bodyPixels.length - 1]; // bodyPixels 的最後一個
        
        // 從蛇頭往牠的行進方向，多抓一個畫素，判斷是 coin or availablePixel
        // figure out what should be the next one
        var nextHead = [];
        if (this.direction === 'l') {
            nextHead.push(head[0] - 1);
        } else if (this.direction === 'r') {
            nextHead.push(head[0] + 1);
        } else {
            //  新的 head 的 x 座標和舊的一樣
            nextHead.push(head[0]);
        }
        if (this.direction === 'u') {
            nextHead.push(head[1] - 1);
        } else if (this.direction === 'd') {
            nextHead.push(head[1] + 1);
        } else {
            //  新的 head 的 y 座標和舊的一樣
            nextHead.push(head[1]);
        }

        // different outcomes of the move
        // 遇到 coin
        // nextHead(整數) 跟 currentCoin(字串) 的比較不能用 ===
        if (nextHead[0] == currentCoin[0] && nextHead[1] == currentCoin[1]) {
            this.bodyPixels.push(nextHead);
            beep.play();
            adjustSpeed(this.bodyPixels.length);

            // 呼叫 useNextRandomPixelForCoin 並同時拿到結果
            if (useNextRandomPixelForCoin()) {
                return GOOD_MOVE;
            } else {
                // 螢幕沒有可用的畫素，代表蛇佔滿整的螢幕
                return ACE_MOVE;
            }
        } else if (tryAllocatingPixel(nextHead[0], nextHead[1])) {
            var tail = this.bodyPixels.splice(0, 1)[0]; // 從尾巴釋放出一個畫素
            this.bodyPixels.push(nextHead);
            releasePixel(tail[0], tail[1]);
            return GOOD_MOVE;
        } else {
            return BAD_MOVE;
        }
    }
};

var initializeGame = function() {
    frameStep = 250;
    timeStep = 50; // 時間間距，說明每隔多少時間做一次 gameInterval
    currTime = 0;
    $('.pixel').removeClass('taken');
    // initialize all pixels
    availablePixels = [];
    for (var i = 0; i < dispWidthInPixels; i++) {
        for (var j = 0; j < dispWidthInPixels; j++) {
            availablePixels.push(i + '|' + j);
        }
    }

    // initialize the snake
    snake.direction = 'l';
    snake.bodyPixels = [];
    for (var i = 29, end = 29 - initialLength; i > end; i--) {
        // 從座標 [29,25] ~ [14,25] 開始尋找16個畫素塞到蛇的身體裡-，建構出蛇的身體
        tryAllocatingPixel(i, 25);
        snake.bodyPixels.push([i, 25]);
    }

    // initialize the coin
    useNextRandomPixelForCoin();        
};

var startMainLoop = function() {
    gameInterval = setInterval(function() {
        currTime += timeStep;
        if (currTime >= frameStep) { // 藉由改變 frameStep，判斷是否執行此 callback function，經由此機制，來控制蛇行進的速度
            var m = snake.move();
            if (m === BAD_MOVE) {
                clearInterval(gameInterval);
                gameRunning = false;
                gameover.play();
                showMessage('Game Over', 'Press space to start again');
            } else if (m === ACE_MOVE) {
                clearInterval(gameInterval);
                gameRunning = false;
                showMessage("You Won", 'Press space to start again');            
            }
            currTime %= frameStep;
        }
    }, timeStep);
    showMessage('', ''); // start gameInterval 後，把訊息清掉
};

$(window).keydown(function(e) {
    var k = e.keyCode || e.which;
    // space
    if (k === 32) {
        e.preventDefault();
        if (!gameRunning) {
            initializeGame();
            startMainLoop();
            gameRunning = true;
        }
    } else if (k === 80) {
        if (gameRunning) {
            if (!gameInterval) {
                startMainLoop();
            } else {
                clearInterval(gameInterval); // 清掉計時器，靜止遊戲畫面
                gameInterval = null;
                showMessage('Paused', '');
            }
        }
      // up
    } else if (k === 38) {
        e.preventDefault();
        if (snake.direction !== 'd')
            snake.direction = 'u';
      // down
    } else if (k === 40) { 
        e.preventDefault();
        if (snake.direction !== 'u')
            snake.direction = 'd';  
      // left
    } else if (k === 37) { 
        e.preventDefault();
        if (snake.direction !== 'r')
            snake.direction = 'l';
      // right
    } else if (k === 39) {
        e.preventDefault();
        if (snake.direction !== 'l')
            snake.direction = 'r';
      // f for left turn
    } else if (k === 70) {
        if (snake.direction === 'u') {
            snake.direction = 'l';
        } else if (snake.direction === 'l') {
            snake.direction = 'd';
        } else if (snake.direction === 'd') {
            snake.direction = 'r';
        } else if (snake.direction === 'r') {
            snake.direction = 'u';
        }
      // j for right turn
    } else if (k === 74) {
        if (snake.direction === 'u') {
            snake.direction = 'r';
        } else if (snake.direction === 'r') {
            snake.direction = 'd';
        } else if (snake.direction === 'd') {
            snake.direction = 'l';
        } else if (snake.direction === 'l') {
            snake.direction = 'u';
        }            
    }
});

showMessage('Welcome!', 'Press space to start');

