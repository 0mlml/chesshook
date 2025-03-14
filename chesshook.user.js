// ==UserScript==
// @name        Chesshook
// @include    	https://www.chess.com/*
// @grant       none
// @require     https://raw.githubusercontent.com/0mlml/chesshook/master/betafish.js
// @require     https://raw.githubusercontent.com/0mlml/vasara/main/vasara.js
// @version     2.1
// @author      0mlml
// @description Chess.com Cheat Userscript
// @updateURL   https://raw.githubusercontent.com/0mlml/chesshook/master/chesshook.user.js
// @downloadURL https://raw.githubusercontent.com/0mlml/chesshook/master/chesshook.user.js
// @run-at      document-start
// ==/UserScript==

(() => {
  const vs = vasara();

  const createExploitWindow = () => {
    const exploitWindow = vs.generateModalWindow({
      title: 'Exploits',
      unique: true,
    });

    if (!exploitWindow) return;

    exploitWindow.generateLabel({
      text: 'Force Scholars Mate against bot: ',
      tooltip: 'This feature simply does not work online. It will only work on the computer play page, and can be used to three crown all bots.'
    });

    exploitWindow.generateButton({
      text: 'Force Scholars Mate',
      callback: e => {
        e.preventDefault();
        if (!document.location.pathname.startsWith('/play/computer')) return alert('You must be on the computer play page to use this feature.');
        const board = document.querySelector('wc-chess-board');
        if (!board?.game?.move || !board?.game?.getFEN) return alert('You must be in a game to use this feature.');
        if (parseInt(board.game.getFEN().split(' ')[5]) > 1 || board.game.getFEN().split(' ')[1] !== 'w') return alert('It must be turn 1 and white to move to use this feature.');

        board.game.move('e4');
        board.game.move('e5');
        board.game.move('Qf3');
        board.game.move('Nc6');
        board.game.move('Bc4');
        board.game.move('Nb8');
        board.game.move('Qxf7#');
      }
    });

    exploitWindow.putNewline();

    exploitWindow.generateLabel({
      text: 'Force Draw against bot: ',
      tooltip: 'This feature simply does not work online. It will only work on the computer play page.'
    });

    exploitWindow.generateButton({
      text: 'Force Draw',
      callback: e => {
        e.preventDefault();
        if (document.location.hostname !== 'www.chess.com') return alert('You must be on chess.com to use this feature.');
        if (!document.location.pathname.startsWith('/play/computer')) return alert('You must be on the computer play page to use this feature.');
        const board = document.querySelector('wc-chess-board');
        if (!board?.game?.move) return alert('You must be in a game to use this feature.');

        board.game.agreeDraw();
      }
    });
  }

  const createConfigWindow = () => {
    vs.generateConfigWindow({
      height: 700,
      resizable: true
    });
  }

  const consoleQueue = [];
  const createConsoleWindow = () => {
    const consoleWindow = vs.generateModalWindow({
      title: 'Console',
      resizable: true,
      unique: true,
      tag: namespace + '_consolewindowtag'
    });

    if (!consoleWindow) return;

    consoleWindow.content.setAttribute('tag', namespace + '_consolewindowcontent');
    consoleWindow.content.style.padding = 0;

    while (consoleQueue.length > 0) {
      addConsoleLineElement(consoleQueue.shift());
    }
  }

  const addConsoleLineElement = (text) => {
    const consoleWindow = document.querySelector(`[tag=${namespace}_consolewindowtag]`);
    const consoleContent = consoleWindow?.querySelector(`[tag=${namespace}_consolewindowcontent]`);

    if (!consoleWindow || !consoleContent) {
      return console.warn('Cannot add console line');
    }

    const line = document.createElement('p');
    line.style.border = 'solid 1px';
    line.style.width = '100%';
    line.style.padding = '2px';
    line.innerText = text;
    consoleContent.appendChild(line);
  }

  const addToConsole = (text) => {
    const consoleWindow = document.querySelector(`[tag=${namespace}_consolewindowtag]`);
    const consoleContent = consoleWindow?.querySelector(`[tag=${namespace}_consolewindowcontent]`);

    if (!consoleWindow || !consoleContent) {
      consoleQueue.push(text);
      return;
    }

    addConsoleLineElement(text);
  }

  const namespace = 'chesshook';

  window[namespace] = {};

  const externalEngineWorkerFunc = () => {
    const minIntermediaryVersion = 1;

    self.uciQueue = [];
    self.hasLock = false;
    self.wsPath = null;
    self.whatEngine = null;
    self.intermediaryVersionString = null;
    self.ws = null;
    self.enginePassKey = null;
    self.closeWs = () => {
      if (self.ws !== null) {
        self.ws.close();
        self.ws = null;
      }
    };
    self.openWs = (url) => {
      self.closeWs();
      self.ws = new WebSocket(url);
      self.ws.onopen = () => {
        self.postMessage({ type: 'DEBUG', payload: 'Connected to engine intermediary' });
        self.send('whoareyou');
      };
      self.ws.onclose = () => {
        self.postMessage({ type: 'DEBUG', payload: 'Disconnected from engine' });
        self.postMessage({ type: 'WSCLOSE' });
        self.intermediaryVersionString = null;
      };
      self.ws.onerror = (e) => {
        self.postMessage({ type: 'ERROR', payload: 'Error with engine: ', err: e });
      };
      self.ws.onmessage = (e) => {
        const data = e.data;
        if (data.startsWith('iam ')) {
          response = data.substring(4);
          self.intermediaryVersionString = response;
          self.postMessage({ type: 'MESSAGE', payload: 'Connected to engine intermediary version ' + response });
          let parts = response.split('v');
          if (!parts[1] || parseInt(parts[1]) < minIntermediaryVersion) {
            self.postMessage({ type: 'ERROR', payload: 'Engine intermediary version is too old or did not provide a valid version string. Please update it.' });
            self.closeWs();
          }
          self.send('whatengine');
        } else if (data.startsWith('auth')) {
          if (data === 'authok') {
            self.postMessage({ type: 'MESSAGE', payload: 'Engine authentication successful' });
          } else {
            if (!self.enginePassKey) {
              self.postMessage({ type: 'NEEDAUTH' });
            } else {
              self.postMessage({ type: 'ERROR', payload: 'Engine authentication failed' });
            }
          }
        } else if (data.startsWith('sub')) {
          if (data === 'subok') {
          } else {
            self.postMessage({ type: 'ERROR', payload: 'Engine subscription failed' });
          }
        } else if (data.startsWith('unsub')) {
          if (data === 'unsubok') {
          } else {
            self.postMessage({ type: 'ERROR', payload: 'Engine unsubscription failed' });
          }
        } else if (data.startsWith('lock')) {
          if (data === 'lockok') {
            self.hasLock = true;
            while (self.uciQueue.length > 0) {
              self.send(self.uciQueue.shift());
            }
          } else {
            self.postMessage({ type: 'ERROR', payload: 'Engine lock failed' });
          }
        } else if (data.startsWith('unlock')) {
          if (data === 'unlockok') {
            self.hasLock = false;
          } else {
            self.postMessage({ type: 'ERROR', payload: 'Engine unlock failed' });
          }
        } else if (data.startsWith('engine')) {
          self.whichEngine = data.split(' ')[1];
          self.postMessage({ type: 'ENGINE', payload: self.whichEngine });
        } else if (data.startsWith('bestmove')) {
          const bestMove = data.split(' ')[1];
          self.postMessage({ type: 'BESTMOVE', payload: bestMove });
          self.send('unsub');
          self.send('unlock');
        } else {
          self.postMessage({ type: 'UCI', payload: data });
        }
      };
    };
    self.send = (data) => {
      if (self.ws === null) return self.postMessage({ type: 'ERROR', payload: 'No connection to engine', err: null });
      self.ws.send(data);
    };
    self.addEventListener('message', e => {
      if (e.data.type === 'UCI') {
        if (!e.data.payload) return self.postMessage({ type: 'ERROR', payload: 'No UCI command provided' });
        if (!self.ws) return self.postMessage({ type: 'ERROR', payload: 'No connection to engine' });
        if (self.hasLock) {
          self.send(e.data.payload);
        } else {
          self.uciQueue.push(e.data.payload);
        }
      } else if (e.data.type === 'INIT') {
        if (!e.data.payload) return self.postMessage({ type: 'ERROR', payload: 'No URL provided' });
        if (!e.data.payload.startsWith('ws://')) return self.postMessage({ type: 'ERROR', payload: 'URL must start with ws://' });
        self.openWs(e.data.payload);
        self.wsPath = e.data.payload;
      } else if (e.data.type === 'AUTH') {
        if (!e.data.payload) return self.postMessage({ type: 'ERROR', payload: 'No auth provided' });
        self.enginePassKey = e.data.payload;
        self.send('auth ' + e.data.payload);
      } else if (e.data.type === 'SUB') {
        self.send('sub');
      } else if (e.data.type === 'UNSUB') {
        self.send('unsub');
      } else if (e.data.type === 'LOCK') {
        if (self.hasLock) return self.postMessage({ type: 'ERROR', payload: 'Already have lock' });
        self.send('lock');
      } else if (e.data.type === 'UNLOCK') {
        self.send('unlock');
      } else if (e.data.type === 'WHATENGINE') {
        self.send('whatengine');
      } else if (e.data.type === 'GETMOVE') {
        if (!e.data.payload?.fen) return self.postMessage({ type: 'ERROR', payload: 'No FEN provided' });
        if (!e.data.payload?.go) return self.postMessage({ type: 'ERROR', payload: 'No go command provided' });
        self.send('lock');
        self.send('sub');
        self.send('position fen ' + e.data.payload.fen);
        self.send(e.data.payload.go);
      } else if (e.data.type === 'STOP') {
        if (self.hasLock) {
          self.send('stop');
          self.send('unsub');
          self.send('unlock');
        }
      }
    });
  }

  const externalEngineWorkerBlob = new Blob([`(${externalEngineWorkerFunc.toString()})();`], { type: 'application/javascript' });
  const externalEngineWorkerURL = URL.createObjectURL(externalEngineWorkerBlob);
  const externalEngineWorker = new Worker(externalEngineWorkerURL);

  let externalEngineName = null;

  externalEngineWorker.onmessage = (e) => {
    const maxlines = 50;
    const websocketOutputTextArea = document.getElementById(namespace + '_websocketoutput');
    const engineOutputTextArea = document.getElementById(namespace + '_engineoutput');

    const addToWebSocketOutput = (line) => {
      if (websocketOutputTextArea) {
        const lines = websocketOutputTextArea.value.split('\n');
        lines.push(line);
        if (lines.length > maxlines) {
          lines.shift();
        }
        websocketOutputTextArea.value = lines.join('\n');
      }
    }

    const updateEngineTextarea = (infoLine) => {
      if (engineOutputTextArea) {
        const lines = engineOutputTextArea.value.split('\n');
        const infoParts = infoLine.split(' ');
        const depth = infoParts[infoParts.indexOf('depth') + 1];
        const score = infoParts[infoParts.indexOf('score') + 1] + ' ' + infoParts[infoParts.indexOf('score') + 2];
        const time = infoParts[infoParts.indexOf('time') + 1];
        const bestLine = infoParts.slice(infoParts.indexOf('pv') + 1).join(' ');
        if (depth !== 'info') {
          lines[0] = 'depth ' + depth;
        }
        if (!score.startsWith('info')) {
          lines[1] = 'score ' + score;
        }
        if (time !== 'info') {
          lines[2] = 'time ' + time;
        }
        if (!bestLine.startsWith('info')) {
          lines[3] = 'best line ' + bestLine;
        }

        engineOutputTextArea.value = lines.join('\n');
      }
    }

    if (e.data.type === 'DEBUG') {
      console.debug(e.data.payload);
      addToWebSocketOutput(e.data.payload);
    } else if (e.data.type === 'ERROR') {
      console.error(e.data.payload, e.data.err);
      addToWebSocketOutput(e.data.payload);
    } else if (e.data.type === 'MESSAGE') {
      addToConsole(e.data.payload);
      addToWebSocketOutput(e.data.payload);
    } else if (e.data.type === 'UCI') {
      updateEngineTextarea(e.data.payload);
    } else if (e.data.type === 'ENGINE') {
      externalEngineName = e.data.payload;
      addToWebSocketOutput('Connected to ' + externalEngineName);
    } else if (e.data.type === 'NEEDAUTH') {
      externalEngineWorker.postMessage({ type: 'AUTH', payload: vs.queryConfigKey(namespace + '_externalenginepasskey') });
      addToWebSocketOutput('Attempting to authenticate with passkey ' + vs.queryConfigKey(namespace + '_externalenginepasskey'));
    } else if (e.data.type === 'BESTMOVE') {
      addToConsole(`${externalEngineName} engine computed best move: ${e.data.payload}`);
      handleEngineMove(e.data.payload);
    }
  }

  const betafishWebWorkerFunc = () => {
    self.instance = betafishEngine();
    self.thinking = false;

    const postError = (message) => self.postMessage({ type: 'ERROR', payload: message });
    const isInstanceInitialized = () => self.instance || postError('Betafish not initialized.');

    self.addEventListener('message', e => {
      if (!isInstanceInitialized()) return;

      switch (e.data.type) {
        case 'FEN':
          if (!e.data.payload) return postError('No FEN provided.');
          self.instance.setFEN(e.data.payload);
          break;
        case 'GETMOVE':
          if (self.thinking) return postError('Betafish is already calculating.');
          self.postMessage({ type: 'MESSAGE', payload: 'Betafish received request for best move. Calculating...' });
          self.thinking = true;
          const move = self.instance.getBestMove();
          self.thinking = false;
          self.postMessage({ type: 'MOVE', payload: { move, toMove: self.instance.getFEN().split(' ')[1] } });
          break;
        case 'THINKINGTIME':
          if (isNaN(e.data.payload)) return postError('Invalid thinking time provided.');
          self.instance.setThinkingTime(e.data.payload / 1000);
          self.postMessage({ type: 'DEBUG', payload: `Betafish thinking time set to ${e.data.payload}ms.` });
          break;
        default:
          postError('Invalid message type.');
      }
    });
  };

  const betafishWorkerBlob = new Blob([`const betafishEngine=${betafishEngine.toString()};(${betafishWebWorkerFunc.toString()})();`], { type: 'application/javascript' });
  const betafishWorkerURL = URL.createObjectURL(betafishWorkerBlob);
  const betafishWorker = new Worker(betafishWorkerURL);

  const betafishPieces = { EMPTY: 0, wP: 1, wN: 2, wB: 3, wR: 4, wQ: 5, wK: 6, bP: 7, bN: 8, bB: 9, bR: 10, bQ: 11, bK: 12 };

  betafishWorker.onmessage = e => {
    switch (e.data.type) {
      case 'DEBUG':
      case 'MESSAGE':
        console.info(e.data.payload);
        break;
      case 'ERROR':
        console.error(e.data.payload);
        break;
      case 'MOVE':
        const { move, toMove } = e.data.payload;
        const squareToRankFile = sq => [Math.floor((sq - 21) / 10), sq - 21 - Math.floor((sq - 21) / 10) * 10];
        const from = squareToRankFile(move & 0x7f);
        const to = squareToRankFile((move >> 7) & 0x7f);
        const promoted = (move >> 20) & 0xf;
        const promotedString = promoted !== 0 ? Object.entries(betafishPieces).find(([key, value]) => value === promoted)?.[0].toLowerCase()[1] || '' : '';
        const uciMove = coordsToUCIMoveString(from, to, promotedString);
        addToConsole(`Betafish computed best for ${toMove === 'w' ? 'white' : 'black'}: ${uciMove}`);
        handleEngineMove(uciMove);
        break;
    }
  };

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const clonedResponse = response.clone();
    clonedResponse.json().then(body => {
      try {
        handleInterception({ url: args[0].url || args[0] }, body);
      } catch (ignored) {
      }
    }).catch(error => console.error('Fetch response clone error:', error));
    return response;
  };

  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._url = new URL(url, window.location.origin).href;
    originalXHROpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener('load', () => {
      if (this.readyState === 4 && this.status >= 200 && this.status < 300) {
        try {
          const responseJson = JSON.parse(this.responseText);
          handleInterception({ url: this._url }, responseJson);
        } catch (ignored) {
        }
      }
    });
    originalXHRSend.apply(this, arguments);
  };

  const handleInterception = (req, res) => {
    const urlPath = new URL(req.url).pathname;

    switch (urlPath) {
      case '/rpc/chesscom.puzzles.v1.PuzzleService/GetNextRated':
        if (vs.queryConfigKey(namespace + '_puzzlemode')) {
          if (res.userPuzzle && res.userPuzzle.puzzle) {
            const puzzle = res.userPuzzle.puzzle;

            const fenMatch = puzzle.pgn.match(/\[FEN "(.+?)"\]/);
            const fen = fenMatch ? fenMatch[1] : null;

            const moves = [];
            const rawMoves = [];
            if (puzzle.moves && Array.isArray(puzzle.moves)) {
              for (const moveObj of puzzle.moves) {
                if (moveObj.move) {
                  rawMoves.push(moveObj.move);
                  const from = squareToAlgebraic(moveObj.move.from);
                  const to = squareToAlgebraic(moveObj.move.to);

                  const move = {
                    from: from,
                    to: to,
                    promotion: null,
                    drop: null,
                  };

                  if (moveObj.move.promotionPieceType) {
                    const promotionMap = {
                      'PROMOTION_PIECE_TYPE_QUEEN': 'q',
                      'PROMOTION_PIECE_TYPE_ROOK': 'r',
                      'PROMOTION_PIECE_TYPE_BISHOP': 'b',
                      'PROMOTION_PIECE_TYPE_KNIGHT': 'n'
                    };

                    move.promotion = promotionMap[moveObj.move.promotionPieceType] || null;
                  }

                  moves.push(move);
                }
              }
            }

            if (vs.queryConfigKey(namespace + '_apipuzzlemode')) {
              submitPuzzleSolution(puzzle.legacyPuzzleId, rawMoves);
            } else {
              puzzleQueue.push({
                fen: fen,
                moves: moves,
                tagged: false,
              });
            }
          }
        }
        break;
      case /\/service\/battle\/games\/.*\/puzzles/.test(urlPath) ? urlPath : '':
        if (vs.queryConfigKey(namespace + '_puzzlemode') && res.puzzles && Array.isArray(res.puzzles)) {
          for (const puzzle of res.puzzles) {
            if (puzzle.initialFen) {
              const moves = [];

              if (puzzle.firstMove) {
                const decodedMoves = decodeTCN(puzzle.firstMove);
                if (decodedMoves.length > 0) {
                  moves.push(...decodedMoves);
                }
              }

              if (puzzle.secureMoves && Array.isArray(puzzle.secureMoves)) {
                for (const secureMove of puzzle.secureMoves) {
                  if (secureMove.move) {
                    const decodedMoves = decodeTCN(secureMove.move);
                    if (decodedMoves.length > 0) {
                      moves.push(...decodedMoves);
                    }
                  }

                  if (secureMove.counter) {
                    const decodedCounters = decodeTCN(secureMove.counter);
                    if (decodedCounters.length > 0) {
                      moves.push(...decodedCounters);
                    }
                  }
                }
              }

              puzzleQueue.push({
                fen: puzzle.initialFen,
                moves: moves,
                tagged: false,
              });
            }
          }
        }
        break;
      case '/callback/tactics/rated/next':
        if (vs.queryConfigKey(namespace + '_puzzlemode')) {
          puzzleQueue.push({
            fen: res.initialFen,
            moves: decodeTCN(res.tcnMoveList),
            tagged: false,
          });
        }
        break;
      case '/callback/tactics/challenge/puzzles':
        if (vs.queryConfigKey(namespace + '_puzzlemode')) {
          for (const puzzle of res.puzzles) {
            puzzleQueue.push({
              fen: puzzle.initialFen,
              moves: decodeTCN(puzzle.tcnMoveList),
              tagged: false,
            });
          }
        }
        break;
    }
  }

  const init = () => {
    vs.registerConfigValue({
      key: namespace + '_configwindowhotkey',
      type: 'hotkey',
      display: 'Config Window Hotkey: ',
      description: 'The hotkey to show the conifg window',
      value: 'Alt+K',
      action: createConfigWindow
    });

    vs.registerConfigValue({
      key: namespace + '_consolewindowhotkey',
      type: 'hotkey',
      display: 'Console Window Hotkey: ',
      description: 'The hotkey to show the console window',
      value: 'Alt+C',
      action: createConsoleWindow
    });

    vs.registerConfigValue({
      key: namespace + '_exploitwindowhotkey',
      type: 'hotkey',
      display: 'Exploit Window Hotkey: ',
      description: 'The hotkey to show the exploit window',
      value: 'Alt+L',
      action: createExploitWindow
    });

    vs.registerConfigValue({
      key: namespace + '_renderthreats',
      type: 'checkbox',
      display: 'Render Threats: ',
      description: 'Render mates, undefended pieces, underdefended pieces, and pins.',
      value: true
    });

    vs.registerConfigValue({
      key: namespace + '_renderthreatspincolor',
      type: 'color',
      display: 'Pin Color: ',
      description: 'The color to render pins in',
      value: '#3333ff',
      showOnlyIf: () => vs.queryConfigKey(namespace + '_renderthreats')
    });

    vs.registerConfigValue({
      key: namespace + '_renderthreatsundefendedcolor',
      type: 'color',
      display: 'Undefended Color: ',
      description: 'The color to render undefended pieces in',
      value: '#ffff00',
      showOnlyIf: () => vs.queryConfigKey(namespace + '_renderthreats')
    });

    vs.registerConfigValue({
      key: namespace + '_renderthreatsunderdefendedcolor',
      type: 'color',
      display: 'Underdefended Color: ',
      description: 'The color to render underdefended pieces in',
      value: '#ff6666',
      showOnlyIf: () => vs.queryConfigKey(namespace + '_renderthreats')
    });

    vs.registerConfigValue({
      key: namespace + '_renderthreatsmatecolor',
      type: 'color',
      display: 'Mate Color: ',
      description: 'The color to render mates in',
      value: '#ff0000',
      showOnlyIf: () => vs.queryConfigKey(namespace + '_renderthreats')
    });

    vs.registerConfigValue({
      key: namespace + '_cleararrowskey',
      type: 'hotkey',
      display: 'Clear Arrows Hotkey: ',
      description: 'The hotkey to clear arrows',
      value: 'Alt+L',
      action: () => {
        const board = document.querySelector('wc-chess-board');
        if (!board) return;
        board.game.markings.removeAll();
      }
    });

    vs.registerConfigValue({
      key: namespace + '_autoqueue',
      type: 'checkbox',
      display: 'Auto Queue: ',
      description: 'Attempts to automatically queue for games.',
      value: false
    });

    vs.registerConfigValue({
      key: namespace + '_legitmode',
      type: 'checkbox',
      display: 'Legit Mode: ',
      description: 'Prevents the script from doing anything that could be considered cheating.',
      value: false,
      callback: () => {
        vs.setConfigValue('whichEngine', 'none');
        vs.setConfigValue('autoMove', false);
        vs.setConfigValue('puzzleMode', false);
      }
    });

    vs.registerConfigValue({
      key: namespace + '_playingas',
      type: 'dropdown',
      display: 'Playing As: ',
      description: 'What color to calculate moves for',
      value: 'both',
      options: ['white', 'black', 'auto'],
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && !vs.queryConfigKey(namespace + '_puzzlemode')
    });

    vs.registerConfigValue({
      key: namespace + '_enginemovecolor',
      type: 'color',
      display: 'Engine Move Color: ',
      description: 'The color to render the engine\'s move in',
      value: '#77ff77',
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && !vs.queryConfigKey(namespace + '_puzzlemode')
    });

    vs.registerConfigValue({
      key: namespace + '_whichengine',
      type: 'dropdown',
      display: 'Which Engine: ',
      description: 'Which engine to use',
      value: 'none',
      options: ['betafish', 'random', 'cccp', 'external'],
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && !vs.queryConfigKey(namespace + '_puzzlemode'),
      callback: () => {
        if (vs.queryConfigKey(namespace + '_whichengine') !== 'external') {
          return;
        }
        if (!vs.queryConfigKey(namespace + '_externalengineurl')) {
          addToConsole('Please set the path to the external engine in the config.');
          return;
        }
        externalEngineWorker.postMessage({ type: 'INIT', payload: vs.queryConfigKey(namespace + '_externalengineurl') });

        if (!vs.queryConfigKey(namespace + '_haswarnedaboutexternalengine') || vs.queryConfigKey(namespace + '_haswarnedaboutexternalengine') === 'false') {
          addToConsole('Please note that the external engine is not for the faint of heart. It requires tinkering and the user to host the chesshook intermediary server.');
          alert('Please note that the external engine is not for the faint of heart. It requires tinkering and the user to host the chesshook intermediary server.')
          vs.setConfigValue(namespace + '_haswarnedaboutexternalengine', true);
        }
      }
    });

    vs.registerConfigValue({
      key: namespace + '_betafishthinkingtime',
      type: 'number',
      display: 'Betafish Thinking Time: ',
      description: 'The amount of time in ms to think for each move',
      value: 1000,
      min: 0,
      max: 20000,
      step: 100,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_whichengine') === 'betafish',
      callback: () => {
        betafishWorker.postMessage({ type: 'THINKINGTIME', payload: parseFloat(vs.queryConfigKey(namespace + '_betafishthinkingtime')) });
      }
    });

    vs.registerConfigValue({
      key: namespace + '_externalengineurl',
      type: 'text',
      display: 'External Engine URL: ',
      description: 'The URL of the external engine',
      value: 'ws://localhost:8080/ws',
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_whichengine') === 'external',
      callback: v => externalEngineWorker.postMessage({ type: 'INIT', payload: v })
    });

    vs.registerConfigValue({
      key: namespace + '_externalengineautogocommand',
      type: 'checkbox',
      display: 'External Engine Auto Go Command: ',
      description: 'Automatically determine the go command based on the time left in the game',
      value: true,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_whichengine') === 'external'
    });

    vs.registerConfigValue({
      key: namespace + '_externalenginegocommand',
      type: 'text',
      display: 'External Engine Go Command: ',
      description: 'The command to send to the external engine to start thinking',
      value: 'go movetime 1000',
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_whichengine') === 'external' && !vs.queryConfigKey(namespace + '_externalengineautogocommand')
    });

    vs.registerConfigValue({
      key: namespace + '_externalenginepasskey',
      type: 'text',
      display: 'External Engine Passkey: ',
      description: 'The passkey to send to the external engine to authenticate',
      value: 'passkey',
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_whichengine') === 'external',
      callback: v => externalEngineWorker.postMessage({ type: 'AUTH', payload: v })
    });

    vs.registerConfigValue({
      key: namespace + '_automove',
      type: 'checkbox',
      display: 'Auto Move: ',
      description: 'Potentially bannable. Tries to randomize move times to avoid detection.',
      value: false,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && !vs.queryConfigKey(namespace + '_puzzlemode')
    });

    vs.registerConfigValue({
      key: namespace + '_automovemaxrandomdelay',
      type: 'number',
      display: 'Move time target range max: ',
      description: 'The maximum delay in ms for automove to target',
      value: 1000,
      min: 0,
      max: 20000,
      step: 100,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_automove')
    });

    vs.registerConfigValue({
      key: namespace + '_automoveminrandomdelay',
      type: 'number',
      display: 'Move time target range min: ',
      description: 'The minimum delay in ms for automove to target',
      value: 500,
      min: 0,
      max: 20000,
      step: 100,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_automove')
    });

    vs.registerConfigValue({
      key: namespace + '_automoveinstamovestart',
      type: 'checkbox',
      display: 'Speed up game start: ',
      description: 'Instantly move first 5',
      value: true,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_automove')
    });

    vs.registerConfigValue({
      key: namespace + '_puzzlemode',
      type: 'checkbox',
      display: 'Solves puzzles: ',
      description: 'Solves puzzles automatically',
      value: false,
      callback: () => {
        vs.setConfigValue('whichEngine', 'none');
        vs.setConfigValue('autoMove', false);
      }
    });

    vs.registerConfigValue({
      key: namespace + '_apipuzzlemode',
      type: 'checkbox',
      display: 'Use the API for puzzles: ',
      description: 'Uses the API to solve puzzles',
      value: false,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_puzzlemode')
    });

    vs.registerConfigValue({
      key: namespace + '_apipuzzletimemode',
      type: 'dropdown',
      display: 'Puzzle Time Mode: ',
      description: 'The time mode to use for the API puzzles',
      value: 'zero',
      options: ['hour', 'legit'],
      showOnlyIf: () => vs.queryConfigKey(namespace + '_puzzlemode') && vs.queryConfigKey(namespace + '_apipuzzlemode')
    })

    vs.registerConfigValue({
      key: namespace + '_refreshhotkey',
      type: 'hotkey',
      display: 'Refresh Hotkey: ',
      description: 'Force some values to reload in order to try to "unstuck" some features',
      value: 'Alt+R',
      action: () => {
        if (window.location.pathname.startsWith('/puzzles')) {
          window.location.reload();
        } else {
          engineLastKnownFEN = null;
        }
      }
    });

    vs.registerConfigValue({
      key: namespace + '_renderwindow',
      type: 'hidden',
      value: true
    });

    vs.registerConfigValue({
      key: namespace + '_haswarnedaboutexternalengine',
      type: 'hidden',
      value: false
    });

    vs.loadPersistentState();

    addToConsole(`Loaded! This is version ${GM_info.script.version}`);
    addToConsole(`Github: https://github.com/0mlml/chesshook`);
    if (vs.queryConfigKey(namespace + '_externalengineurl') && vs.queryConfigKey(namespace + '_whichengine') === 'external') {
      externalEngineWorker.postMessage({ type: 'INIT', payload: vs.queryConfigKey(namespace + '_externalengineurl') });
    }
  }

  function squareToAlgebraic(squareEnum) {
    if (typeof squareEnum === 'string' && squareEnum.startsWith('SQUARE_')) {
      const file = squareEnum.charAt(7).toLowerCase();
      const rank = squareEnum.charAt(8);
      return file + rank;
    }
    return null;
  }


  const decodeTCN = (n) => {
    const tcnChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?{~}(^)[_]@#$,./&-*++=";
    const pieceChars = "qnrbkp";
    let moves = [];

    for (let i = 0; i < n.length; i += 2) {
      let move = {
        from: null,
        to: null,
        drop: null,
        promotion: null,
      };

      let o = tcnChars.indexOf(n[i]);
      let s = tcnChars.indexOf(n[i + 1]);

      if (s > 63) {
        move.promotion = pieceChars[Math.floor((s - 64) / 3)];
        s = o + (o < 16 ? -8 : 8) + ((s - 1) % 3) - 1;
      }

      if (o > 75) {
        move.drop = pieceChars[o - 79];
      } else {
        move.from = tcnChars[o % 8] + String(Math.floor(o / 8) + 1);
      }

      move.to = tcnChars[s % 8] + String(Math.floor(s / 8) + 1);
      moves.push(move);
    }

    return moves;
  }

  const getPieceValue = (piece, scoreActivity = false) => {
    return {
      'p': 1,
      'n': 3,
      'b': 3,
      'r': 5,
      'q': 9,
      'k': scoreActivity ? -3 : 99
    }[piece.toLowerCase()];
  }

  const xyToCoordInverted = (x, y) => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const file = letters[y];
    const rank = x + 1;
    return file + rank;
  }

  const coordToYX = (coord) => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const file = letters.indexOf(coord[0]) + 1;
    const rank = Number(coord[1]);
    return [file, rank];
  }

  const coordsToUCIMoveString = (from, to, promotion) => {
    return xyToCoordInverted(from[0], from[1]) + xyToCoordInverted(to[0], to[1]) + promotion;
  }

  let renderThreatsLastKnownFEN = null;
  const renderThreats = () => {
    let board = document.querySelector('wc-chess-board');
    if (renderThreatsLastKnownFEN === board.game.getFEN()) return;
    renderThreatsLastKnownFEN = board.game.getFEN();

    board.game.markings.removeAll();

    const threats = board.game.getJCEGameCopy().threats();

    for (let pin of threats.pins) {
      board.game.markings.addOne({ type: 'highlight', data: { color: vs.queryConfigKey(namespace + '_renderthreatspincolor'), square: pin } });
    }

    for (let undefended of threats.undefended) {
      board.game.markings.addOne({ type: 'arrow', data: { color: vs.queryConfigKey(namespace + '_renderthreatsundefendedcolor'), from: undefended.substring(0, 2), to: undefended.substring(2, 4) } });
    }

    for (let underdefended of threats.underdefended) {
      board.game.markings.addOne({ type: 'arrow', data: { color: vs.queryConfigKey(namespace + '_renderthreatsunderdefendedcolor'), from: underdefended.substring(0, 2), to: underdefended.substring(2, 4) } });
    }

    for (let mate of threats.mates) {
      board.game.markings.addOne({ type: 'arrow', data: { color: vs.queryConfigKey(namespace + '_renderthreatsmatecolor'), from: mate.substring(0, 2), to: mate.substring(2, 4) } });
    }
  }

  const resolveAfterMs = (ms = 1000) => {
    if (ms <= 0) return new Promise(res => res());
    return new Promise(res => setTimeout(res, ms));
  }

  const mergeMoveToUCI = (move) => move.from + move.to + (move.promotion ? move.promotion : '');

  const cccpEngine = () => {
    const board = document.querySelector('wc-chess-board');

    const legalMoves = board.game.getLegalMoves();

    if (legalMoves.length === 0) return;

    const checkmates = legalMoves.filter(m => m.san.includes('#'));

    if (checkmates.length > 0) {
      return mergeMoveToUCI(checkmates[0]);
    }


    const checks = legalMoves.filter(m => m.san.includes('+'));
    const captureMoves = legalMoves.filter(m => m.san.includes('x'));

    const goodCaptureExists = captureMoves.some(m => {
      const capturedValue = getPieceValue(m.captured, true);
      return capturedValue > 4 || getPieceValue(m.piece, true) < capturedValue;
    });

    if (checks.length > 0 && !goodCaptureExists) {
      return mergeMoveToUCI(checks[0]);
    }

    if (captureMoves.length > 0) {
      return mergeMoveToUCI(captureMoves.sort((a, b) => (getPieceValue(b.captured) - getPieceValue(b.piece) + getPieceValue(b.captured) * 0.1) - (getPieceValue(a.captured) - getPieceValue(b.piece) + getPieceValue(a.captured) * 0.1))[0]);
    }

    const pushes = legalMoves.sort((a, b) => {
      let scoreA = getPieceValue(a.piece, true);
      let scoreB = getPieceValue(b.piece, true);

      const columnScores = { 'a': -1, 'b': 0, 'c': 1, 'd': 3, 'e': 3, 'f': 1, 'g': 0, 'h': -1 };

      scoreA += columnScores[a.to[0]];
      scoreB += columnScores[b.to[0]];

      const scorePush = (to, isWhite) => {
        const toRow = parseInt(to[1]);

        return isWhite ? toRow : 9 - toRow;
      }

      scoreA += scorePush(a.to, a.color === 1);
      scoreB += scorePush(b.to, b.color === 1);

      a.score = scoreA;
      b.score = scoreB;
      return scoreB - scoreA;
    });

    return mergeMoveToUCI(pushes[0]);
  }

  const isMyTurn = () => {
    const board = document.querySelector('wc-chess-board');
    const fen = board.game.getFEN();

    if (vs.queryConfigKey(namespace + '_playingas') !== 'both') {
      if ((vs.queryConfigKey(namespace + '_playingas') === 'white' && fen.split(' ')[1] === 'b') ||
        (vs.queryConfigKey(namespace + '_playingas') === 'black' && fen.split(' ')[1] === 'w')) {
        return false;
      }
    }

    if (vs.queryConfigKey(namespace + '_playingas') === 'auto') {
      const playingAs = board.game.getPlayingAs() === 1 ? 'w' : board.game.getPlayingAs() === 2 ? 'b' : null;
      return playingAs === null || fen.split(' ')[1] === playingAs;
    }

    return true;
  }

  let lastEngineMoveCalcStartTime = performance.now();

  let engineLastKnownFEN = null;
  const getEngineMove = () => {
    const board = document.querySelector('wc-chess-board');

    const fen = board.game.getFEN();
    if (!fen || engineLastKnownFEN === fen) return;
    engineLastKnownFEN = board.game.getFEN();

    if (!isMyTurn()) return;

    addToConsole(`Calculating move based on engine: ${vs.queryConfigKey(namespace + '_whichengine')}...`);

    if (vs.queryConfigKey(namespace + '_automoveinstamovestart') && parseInt(fen.split(' ')[5]) < 6) lastEngineMoveCalcStartTime = 0;
    else lastEngineMoveCalcStartTime = performance.now();

    if (vs.queryConfigKey(namespace + '_whichengine') === 'betafish') {
      betafishWorker.postMessage({ type: 'FEN', payload: fen });
      betafishWorker.postMessage({ type: 'GETMOVE' });
    } else if (vs.queryConfigKey(namespace + '_whichengine') === 'external') {
      if (!externalEngineName) {
        addToConsole('External engine appears to be disconnected. Please check the config.');
        return;
      }
      let goCommand = vs.queryConfigKey(namespace + '_externalengineautogocommand');
      if (!vs.queryConfigKey(namespace + '_externalengineautogocommand') && (!goCommand || !goCommand.includes('go'))) {
        addToConsole('External engine go command is invalid. Please check the config.');
        return;
      } else if (vs.queryConfigKey(namespace + '_externalengineautogocommand')) {
        goCommand = 'go';
        if (board?.game?.timeControl && board.game.timeControl.get() && board.game.timestamps.get) {
          const increment = board.game.timeControl.get().increment;
          const baseTime = board.game.timeControl.get().baseTime;
          let whiteTime = baseTime
          let blackTime = baseTime;
          const timestamps = board.game.timestamps.get();
          for (let i in timestamps) {
            if (i % 2 === 0) {
              whiteTime -= timestamps[i] * 100;
              whiteTime += increment;
            } else {
              blackTime -= timestamps[i] * 100;
              blackTime += increment;
            }
          }
          goCommand += ` wtime ${whiteTime} btime ${blackTime} winc ${increment} binc ${increment}`;
        } else {
          goCommand += ' depth 20';
        }
      }
      addToConsole('External engine is: ' + externalEngineName);
      externalEngineWorker.postMessage({ type: 'GETMOVE', payload: { fen: fen, go: goCommand } });
    } else if (vs.queryConfigKey(namespace + '_whichengine') === 'random') {
      const legalMoves = document.querySelector('wc-chess-board').game.getLegalMoves()
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];

      addToConsole(`Random computed move: ${randomMove.san}`);
      handleEngineMove(randomMove.from + randomMove.to + (randomMove.promotion ? randomMove.promotion : ''));
    } else if (vs.queryConfigKey(namespace + '_whichengine') === 'cccp') {
      const move = cccpEngine();
      if (!move) return;

      addToConsole(`CCCP computed move: ${move}`);
      handleEngineMove(move);
    }
  }

  const calculateDOMSquarePosition = (square, fromDoc = true) => {
    const board = document.getElementsByTagName('wc-chess-board')[0];
    if (!board?.game) return;

    const { left, top, width } = board.getBoundingClientRect();
    const squareWidth = width / 8;
    const correction = squareWidth / 2;

    const coords = coordToYX(square);
    if (!board.game.getOptions().flipped) {
      return {
        x: left + squareWidth * coords[0] - correction,
        y: top + width - squareWidth * coords[1] + correction,
      };
    } else {
      return {
        x: left + width - squareWidth * coords[0] + correction,
        y: top + squareWidth * coords[1] - correction,
      };
    }
  }

  let handleMoveLastKnownMarking = null;

  const handleEngineMove = (uciMove) => {
    const board = document.querySelector('wc-chess-board');
    if (!board?.game) return false;

    if (!vs.queryConfigKey(namespace + '_renderthreats')) board.game.markings.removeAll();

    const marking = { type: 'arrow', data: { color: vs.queryConfigKey(namespace + '_enginemovecolor'), from: uciMove.substring(0, 2), to: uciMove.substring(2, 4) } };
    if (handleMoveLastKnownMarking) board.game.markings.removeOne(handleMoveLastKnownMarking);
    board.game.markings.addOne(marking);
    handleMoveLastKnownMarking = marking;

    if (!vs.queryConfigKey(namespace + '_automove')) {
      return;
    }

    let max = vs.queryConfigKey(namespace + '_automovemaxrandomdelay'), min = vs.queryConfigKey(namespace + '_automoveminrandomdelay');
    if (min > max) {
      min = max;
    }

    const delay = (Math.floor(Math.random() * (max - min)) + min) - (performance.now() - lastEngineMoveCalcStartTime);

    resolveAfterMs(delay).then(() => {
      if (['/play/computer', '/analysis'].some(p => document.location.pathname.startsWith(p))) {
        board.game.move(uciMove);
      } else {
        if (uciMove.length > 4) {
          board.game.move({
            from: uciMove.substring(0, 2),
            to: uciMove.substring(2, 4),
            promotion: uciMove.substring(4, 5),
            animate: false,
            userGenerated: true
          });
        } else {
          const fromPos = calculateDOMSquarePosition(uciMove.substring(0, 2));
          const toPos = calculateDOMSquarePosition(uciMove.substring(2, 4));
          board.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: fromPos.x,
            clientY: fromPos.y,
          }));
          board.dispatchEvent(new PointerEvent('pointerup', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: toPos.x,
            clientY: toPos.y,
          }));
        }
      }
    });
  }

  const requestNextPuzzle = () => {
    addToConsole(`[${namespace}] Requesting next puzzle`);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://www.chess.com/rpc/chesscom.puzzles.v1.PuzzleService/GetNextRated', true);

      xhr.setRequestHeader('accept', 'application/json');
      xhr.setRequestHeader('accept-language', 'en-US,en;q=0.9');
      xhr.setRequestHeader('content-type', 'application/json');
      xhr.withCredentials = true;

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);

            if (result && result.userPuzzle && result.userPuzzle.puzzle) {
              addToConsole(`[${namespace}] Successfully retrieved next puzzle: ${result.userPuzzle.puzzle.legacyPuzzleId}`);
              resolve(result);
            } else {
              const errorMsg = `Failed to get next puzzle: ${result.error || 'No puzzle data in response'}`;
              addToConsole(`[${namespace}] ${errorMsg}`);
              reject(new Error(errorMsg));
            }
          } catch (e) {
            addToConsole(`[${namespace}] Error parsing response:`, e);
            reject(e);
          }
        } else {
          addToConsole(`[${namespace}] Request failed:`, xhr.status, xhr.statusText);
          reject(new Error(`Request failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = function () {
        addToConsole(`[${namespace}] Network error occurred`);
        reject(new Error('Network error'));
      };

      xhr.ontimeout = function () {
        addToConsole(`[${namespace}] Request timed out`);
        reject(new Error('Request timed out'));
      };

      xhr.send('{}');
    });
  }

  const submitPuzzleSolution = async (puzzleId, moves) => {
    try {
      const payload = {
        legacyPuzzleId: puzzleId,
        moves: moves,
        attemptDuration: `0.2s`
      };

      switch(vs.queryConfigKey(namespace + '_apipuzzletimemode')) {
        case 'hour':
          payload.attemptDuration = `${(3600 + Math.random() * 1800).toFixed(3)}s`;
          break;
        case 'legit':
          payload.attemptDuration = `${(15 + Math.random() * 30).toFixed(3)}s`;
          break;
        case 'zero':
          payload.attemptDuration = `${0.1 + Math.random() * 0.3}s`;
          break;
      }

      addToConsole(`[${namespace}] Submitting solution for puzzle ${puzzleId}`);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.chess.com/rpc/chesscom.puzzles.v1.PuzzleService/SubmitRatedSolution', true);

        xhr.setRequestHeader('accept', 'application/json');
        xhr.setRequestHeader('accept-language', 'en-US,en;q=0.9');
        xhr.setRequestHeader('content-type', 'application/json');

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              addToConsole(`[${namespace}] Successfully submitted solution for puzzle ${puzzleId}. ELO: ${result.userRatings[0].rating} (+${result.userRatings[0].ratingChange})`);
              requestNextPuzzle();
              resolve(result);
            } catch (e) {
              addToConsole(`[${namespace}] Error parsing response:`, e);
              reject(e);
            }
          } else {
            addToConsole(`[${namespace}] XHR request failed:`, xhr.status, xhr.statusText, xhr.responseText);
            reject(new Error(`XHR request failed: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.onerror = function () {
          addToConsole(`[${namespace}] Network error occurred`);
          reject(new Error('Network error'));
        };

        xhr.ontimeout = function () {
          addToConsole(`[${namespace}] Request timed out`);
          reject(new Error('Request timed out'));
        };

        xhr.send(JSON.stringify(payload));
      });
    } catch (error) {
      addToConsole(`[${namespace}] Error submitting puzzle solution:`, error);
    }
  };

  const handlePuzzleMove = (moveObj) => {
    const board = document.querySelector('wc-chess-board');
    if (!board?.game) return false;

    if (moveObj.promotion) {
      board.game.move({
        from: moveObj.from,
        to: moveObj.to,
        promotion: moveObj.promotion,
        animate: false,
        userGenerated: true
      });
    } else {
      const fromPos = calculateDOMSquarePosition(moveObj.from);
      const toPos = calculateDOMSquarePosition(moveObj.to);
      board.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: fromPos.x,
        clientY: fromPos.y,
      }));
      board.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: toPos.x,
        clientY: toPos.y,
      }));
    }
  }

  let requeueLastGamePath = null;
  let requeueAttempts = 0;

  const handleRequeue = () => {
    if (requeueLastGamePath === null) {
      requeueLastGamePath = window.location.pathname;
      requeueAttempts = 0;
    } else if (requeueLastGamePath !== window.location.pathname) {
      requeueLastGamePath = null;
    }

    if (requeueLastGamePath === window.location.pathname) {
      try {
        document.querySelector('div.tabs-tab:nth-child(2)').click();
        document.querySelector('.create-game-component > button:nth-child(2)').click();
      } catch {
        if (requeueAttempts.requeueAttempts > 10) {
          requeueLastGamePath = null;
          requeueAttempts = 0;
        } else {
          requeueAttempts.requeueAttempts++;
        }
      }
    }
  }

  const fuzzyFensEqual = (fen1, fen2) => fen1.split(' ').slice(0, 1).join(' ') === fen2.split(' ').slice(0, 1).join(' ');

  const puzzleQueue = [];
  let lastPuzzleFEN = null;
  let playerTurn = false;

  window[namespace].getPuzzleQueue = () => puzzleQueue;

  const manualPuzzleHandler = () => {
    const board = document.querySelector('wc-chess-board');
    if (!board) return;

    const currentFEN = board.game.getFEN();

    for (let i = 0; i < puzzleQueue.length; i++) {
      const puzzle = puzzleQueue[i];

      if (fuzzyFensEqual(puzzle.fen, currentFEN)) {
        puzzle.tagged = true;
      }

      if (puzzle.tagged) {
        if (lastPuzzleFEN && fuzzyFensEqual(currentFEN, lastPuzzleFEN)) return;

        while (puzzle.moves.length > 0 && !playerTurn) {
          puzzle.moves.shift();
          playerTurn = !playerTurn;
        }

        if (puzzle.moves.length > 0 && playerTurn) {
          const move = puzzle.moves.shift();
          handlePuzzleMove(move);
          lastPuzzleFEN = currentFEN;
          playerTurn = !playerTurn;
          return;
        } else {
          puzzleQueue.splice(i, 1);
          lastPuzzleFEN = null;
          playerTurn = false;
          break;
        }
      }
    }
  }

  const clickPuzzleNext = () => {
    const nextButton = document.querySelector('#sidebar > section > div.rated-sidebar-footer-component > div.primary-control-buttons-component > button.cc-button-component.cc-button-primary.cc-button-large.cc-bg-primary.primary-control-buttons-half');
    const arrowIcon = nextButton?.querySelector('.arrow-right');
    if (arrowIcon) {
      nextButton.click();
    }
  }

  const updateLoop = () => {
    const board = document.querySelector('wc-chess-board');

    if (!board?.game) return;

    if (board.game.getPositionInfo().gameOver) {
      externalEngineWorker.postMessage({ type: 'STOP' });

      if (vs.queryConfigKey(namespace + '_autoqueue')) {
        handleRequeue();
      }
    }

    if (document.location.pathname.startsWith('/puzzles')) {
      if (vs.queryConfigKey(namespace + '_puzzlemode')) {
        manualPuzzleHandler();
        if (!document.location.pathname.includes('battle')) {
          clickPuzzleNext();
        }
      }
    }

    if (vs.queryConfigKey(namespace + '_renderthreats')) {
      renderThreats();
    }

    if (!vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_whichengine') !== 'none') {
      getEngineMove();
    }
  }

  window[namespace].updateLoop = setInterval(updateLoop, 20);

  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'interactive') {
      init();
    }
  });
})();
