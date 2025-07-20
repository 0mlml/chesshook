// ==UserScript==
// @name        Chesshook Minimal
// @include    	https://www.chess.com/*
// @grant       none
// @require     https://raw.githubusercontent.com/0mlml/chesshook/master/betafish.js
// @version     1.0
// @author      0mlml (Enhanced by AI)
// @description An ultra-minimal version of Chesshook with no UI.
// @run-at      document-end
// ==/UserScript==

(() => {
  // --- Configuration ---
  const config = {
    engine: 'betafish', // 'betafish', 'random', 'cccp', or 'external'
    autoMove: false,    // true to automatically play the best move
    arrowColor: '#77ff77' // Color of the suggestion arrow
  };
  // ---------------------

  try {
    const namespace = 'chesshook_minimal';
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

    externalEngineWorker.onmessage = e => {
      if (e.data.type === 'BESTMOVE') {
        handleEngineMove(e.data.payload);
      }
    };
    
    const handleEngineMove = (uciMove) => {
      const board = document.querySelector('wc-chess-board');
      if (!board?.game) return false;

      board.game.markings.removeAll();
      const marking = { 
        type: 'arrow', 
        data: { 
          color: config.arrowColor, 
          from: uciMove.substring(0, 2), 
          to: uciMove.substring(2, 4) 
        } 
      };
      board.game.markings.addOne(marking);

      if (config.autoMove) {
        board.game.move(uciMove);
      }
    }

    const getEngineMove = () => {
      const board = document.querySelector('wc-chess-board');
      const fen = board.game.getFEN();

      if (config.engine === 'betafish') {
        betafishWorker.postMessage({ type: 'FEN', payload: fen });
        betafishWorker.postMessage({ type: 'GETMOVE' });
      } else if (config.engine === 'random') {
        const legalMoves = board.game.getLegalMoves()
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        handleEngineMove(randomMove.from + randomMove.to + (randomMove.promotion ? randomMove.promotion : ''));
      } else if (config.engine === 'cccp') {
        const move = cccpEngine();
        if (move) handleEngineMove(move);
      } else if (config.engine === 'external') {
        externalEngineWorker.postMessage({ type: 'GETMOVE', payload: { fen: fen, go: 'go movetime 1000' } });
      }
    }

    const updateLoop = () => {
      const board = document.querySelector('wc-chess-board');
      if (!board?.game) return;

      if (board.game.getPositionInfo().gameOver) {
        externalEngineWorker.postMessage({ type: 'STOP' });
        return;
      }
      
      getEngineMove();
    }

    setInterval(updateLoop, 200);

  } catch (error) {
    console.error('[Chesshook Minimal] Script initialization error:', error);
  }
})();
