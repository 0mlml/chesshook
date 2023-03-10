## chesshook

userscript for chess.com that highlights hanging pieces and attempts to calculate the best move.

### usage: 
 - install a userscript manager, such as [tampermonkey](https://www.tampermonkey.net/) or [violentmonkey](https://violentmonkey.github.io/get-it/).
 - create a new script with the content of: [chesshook.user.js](https://raw.githubusercontent.com/0mlml/chesshook/master/chesshook.user.js)
 - go to chess.com
   - note: the hotkey to toggle the window is alt+k, but it should render by default 

### engines:
 - [betafish](https://github.com/Strryke/betafish), can beat the highest rated named free bot on chess.com (Francis, 2300 elo)
 - random, plays a random legal move
 - [Checkmate, Check, Capture, Push](http://tom7.org/chess/weak.pdf), inspired by tom7's paper for SIGBOVIK 2019, not very good at chess
 - [external](https://github.com/0mlml/chesshook-intermediary), can use any UCI-compliant engine using an intermediary server written in golang

### soon:
 - [ ] lichess.org support
 - [X] automatically playing the best move
 - [X] offloading engine to webworker
 - [X] full automation of matchmaking (finding games, etc.)
