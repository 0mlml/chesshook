// ==UserScript==
// @name        Chesshook
// @include    	https://www.chess.com/*
// @include		https://lichess.org/*
// @grant       none
// @require		https://raw.githubusercontent.com/0mlml/chesshook/master/betafish.js
// @version     0.2
// @author      0mlml
// @description QOL
// @run-at      document-start
// ==/UserScript==

(() => {
	const configChangeCallback = (input) => {
		let configKey = input.target ? Object.keys(config).find(k => namespace + config[k].key === input.target.id) : input.key;
		if (configKey) {
			switch (config[configKey].type) {
				case 'checkbox':
					config[configKey].value = input.target.checked;
					break;
				case 'text':
					config[configKey].value = input.target.value;
					break;
				case 'hidden':
					config[configKey].value = input.value;
					break;
			}
			window.localStorage.setItem(config[configKey].key, config[configKey].value);
		}

		if (config.renderWindow.value) document.getElementById(namespace + '_windowmain').style.display = 'flex';
		else document.getElementById(namespace + '_windowmain').style.display = 'none';

		if (!config.renderHanging.value) {
			if (document.location.hostname === 'www.chess.com') {
				let board = document.getElementsByTagName('chess-board')[0];
				if (board?.game?.markings?.removeAll) {
					board.game.markings.removeAll();
				}
			}
		}
	}

	const keyPressEventListener = e => {
		if (e.altKey && e.key === 'k') {
			toggleMainDisplay();
			e.preventDefault();
		}
	}

	const configInitializer = () => {
		for (const k of Object.keys(config)) {
			const stored = window.localStorage.getItem(config[k].key);
			if (stored)
				config[k].value =
					config[k].type === 'checkbox'
						? (stored === 'true' ? true : false)
						: stored;
		}
	}

	const toggleMainDisplay = () => {
		const main = document.getElementById(namespace + '_windowmain');
		if (main) {
			if (main.style.display === 'flex') main.style.display = 'none';
			else main.style.display = 'flex';
			configChangeCallback({ key: 'renderWindow', value: main.style.display === 'flex' });
		}
	}

	const mdToDOM = (string) => {
		string = string.replace(/\*{2}(.*?)\*{2}/g, '<strong>$1</strong>');
		string = string.replace(/\*(.*?)\*/g, '<em>$1</em>');
		string = string.replace(/\n/g, '<br>');
		for (const m of string.matchAll(/!\[(.+?)\]\((.+?)\)/g)) {
			if (!config.doImages.value) string = string.replace(m[0], `<img alt="${m[1]}" src=""`);
			else string = string.replace(m[0], `<img alt="${m[1]}" src="${document.querySelectorAll(`[alt="${m[1]}"]`).src}"`);
		}
		return string;
	}

	const addToConsole = (text) => {
		let consoleElement = document.getElementById(namespace + '_consolevp');
		if (!consoleElement) return console.log(text);

		const next = document.createElement('div');
		next.style = 'border-bottom:2px solid #333;padding-left:3px;';
		next.innerHTML = mdToDOM(text);

		document.getElementById(namespace + '_consolevp').appendChild(next);
	}

	/**
	 * @param {HTMLElement} elem
	 * @param {String} configKey
	 */
	const makeDraggable = (elem, configKey) => {
		let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

		const draggable_mouseDown = (e) => {
			e = e || window.event;
			e.preventDefault();

			x2 = e.clientX;
			y2 = e.clientY;
			document.addEventListener('mouseup', draggable_endDrag);
			document.addEventListener('mousemove', draggable_handleDrag);
		}

		const draggable_handleDrag = (e) => {
			e = e || window.event;
			e.preventDefault();

			x1 = x2 - e.clientX;
			y1 = y2 - e.clientY;
			x2 = e.clientX;
			y2 = e.clientY;

			elem.style.top = (elem.offsetTop - y1) + 'px';
			elem.style.left = (elem.offsetLeft - x1) + 'px';

			if (!configKey) return;
			configChangeCallback({ key: configKey, value: `${elem.style.left};${elem.style.top};${elem.style.width};${elem.style.height}` });
		}

		const draggable_endDrag = () => {
			document.removeEventListener('mousedown', draggable_endDrag);
			document.removeEventListener('mousemove', draggable_handleDrag);
		}

		const draggable_handleResize = () => {
			if (!configKey) return;
			configChangeCallback({ key: configKey, value: `${elem.style.left};${elem.style.top};${elem.style.width};${elem.style.height}` });
		}

		elem.addEventListener('resize', draggable_handleResize);
		if (document.getElementById(elem.id + '_headerbar')) document.getElementById(elem.id + '_headerbar').addEventListener('mousedown', draggable_mouseDown);
		else elem.addEventListener('mousedown', draggable_mouseDown);
	}

	const makeConsole = () => {
		let css = `div#chesshook_windowmain{overflow:auto;resize:both;position:fixed;min-height:30vh;min-width:30vw;aspect-ratio:1.7;background:#000;display:none;flex-direction:column;align-items:center;z-index:10000990;box-shadow:0 0 10px #000;border-radius:2px;border:2px solid #222;color:#ccc;font-family:monospace}div#chesshook_windowmain button{background-color:#000;margin:0 0 0 .5vw;}span#chesshook_windowmain_headerbar{top:0;left:0;margin:0;width:100%;height:3vh;background:#828282;display:flex;flex-direction:column;cursor:move}span#chesshook_windowmain_topdecoline{width:100%;height:10%;margin:0;padding:0;background:linear-gradient(to right,red,orange,#ff0,green,#00f,indigo,violet)}div#chesshook_windowmain_tabs{width:100%;height:90%;margin:0;padding:0;background-color:#000;border-bottom:2px solid #222;display:flex;flex-direction:row;cursor:move}div#chesshook_windowmain_tabs_title{margin:0;padding:0;display:flex;align-items:center;align-content:center;user-select:none;flex-grow:1000}div#chesshook_windowmain_tabs_x{height:calc(100%-3px);background:#222;aspect-ratio:1;margin:0;padding:0;display:flex;align-items:center;align-content:center;justify-content:center;cursor:pointer;border:2px solid #222;border-radius:5px}div#chesshook_windowmain_menutoggle{display:block;-webkit-user-select:none;user-select:none;height:calc(100%-3px);aspect-ratio:1;margin:0;padding:3px}div#chesshook_windowmain_menutoggle input{display:block;width:40px;height:32px;position:absolute;top:-7px;left:-5px;cursor:pointer;opacity:0;z-index:10000994;-webkit-touch-callout:none}ul#chesshook_windowmain_menutoggle_menu{list-style-type:none;-webkit-font-smoothing:antialiased;opacity:0;transition:opacity .5s cubic-bezier(.77, .2, .05, 1);width:7vw;background-color:#000;position:absolute;top:3vh;left:0;border:2px solid #222;border-radius:5px;padding:0;flex-direction:column;align-items:stretch;z-index:10000991}ul#chesshook_windowmain_menutoggle_menu>li{height:3.5vh;background-color:#000;border-bottom:2px solid #222;text-align:center;line-height:3.5vh;font-size:1.75vh;color:#fff;font-family:monospace;user-select:none;cursor:pointer;text-decoration:none}div#chesshook_windowmain_menutoggle span{display:block;width:24px;height:3px;margin-bottom:3px;position:relative;background:#cdcdcd;border-radius:3px;z-index:10000992;transform-origin:4px 0px;transition:transform .5s cubic-bezier(.77, .2, .05, 1),background .5s cubic-bezier(.77, .2, .05, 1),opacity .55s}div#chesshook_windowmain_menutoggle span:first-child{transform-origin:0% 0%}div#chesshook_windowmain_menutoggle span:nth-last-child(2){transform-origin:0% 100%}div#chesshook_windowmain_menutoggle input:checked~span{opacity:1;transform:rotate(45deg) translate(-2px,-1px)}div#chesshook_windowmain_menutoggle input:checked~span:nth-last-child(3){opacity:0;transform:rotate(0) scale(.2,.2)}div#chesshook_windowmain_menutoggle input:checked~span:nth-last-child(2){transform:rotate(-45deg) translate(0,-1px)}div#chesshook_windowmain_menutoggle input:checked~ul{opacity:1}div#chesshook_windowmain_viewportcontainer{width:100%;height:90%;position:absolute;margin:0;padding:0;top:10%;left:0}div#chesshook_consolevp{width:100%;height:100%;overflow-y:scroll;flex-direction:column}div#chesshook_settingsvp{width:100%;height:100%;overflow-y:scroll;display:none;flex-direction:row;align-items:stretch;align-content:stretch;justify-content:center}div#chesshook_settingsvp_left{padding:13px;display:flex;flex-direction:column;align-items:left;align-content:stretch;justify-content:center}div#chesshook_settingsvp_right{padding:12px;display:flex;flex-direction:column;align-items:center;align-content:stretch;justify-content:center}`;
		const styleSheetNode = document.createElement('style');

		if (styleSheetNode.styleSheet) styleSheetNode.styleSheet.cssText = css;
		else styleSheetNode.appendChild(document.createTextNode(css));

		const mainDiv = document.createElement('div');
		mainDiv.id = namespace + '_windowmain';

		mainDiv.appendChild(styleSheetNode);

		if (config.renderWindow.value) mainDiv.style.display = 'flex';
		mainDiv.style.left = config.windowPlot.value.split(';')[0];
		mainDiv.style.top = config.windowPlot.value.split(';')[1];
		mainDiv.style.width = config.windowPlot.value.split(';')[2];
		mainDiv.style.height = config.windowPlot.value.split(';')[3];

		const headerSpan = document.createElement('span');
		headerSpan.id = namespace + '_windowmain_headerbar';

		const decoLineSpanNode = document.createElement('span');
		decoLineSpanNode.id = namespace + '_windowmain_topdecoline';

		headerSpan.appendChild(decoLineSpanNode);

		const tabsDiv = document.createElement('div');
		tabsDiv.id = namespace + '_windowmain_tabs';

		// https://codepen.io/erikterwan/pen/EVzeRP
		const menuToggleDiv = document.createElement('div');
		menuToggleDiv.id = namespace + '_windowmain_menutoggle';

		const menuToggleCheckbox = document.createElement('input');
		menuToggleCheckbox.id = namespace + '_windowmain_menutoggle_checkbox'
		menuToggleCheckbox.type = 'checkbox';
		menuToggleDiv.appendChild(menuToggleCheckbox);

		for (let i = 0; i < 3; i++) menuToggleDiv.appendChild(document.createElement('span'));

		const navMenuUnorderedList = document.createElement('ul');
		navMenuUnorderedList.id = namespace + '_windowmain_menutoggle_menu';
		menuToggleDiv.appendChild(navMenuUnorderedList);

		navMenuUnorderedList.addButton = (text) => {
			const elem = document.createElement('li');
			elem.innerText = text;
			navMenuUnorderedList.appendChild(elem);
			return elem;
		}

		menuToggleDiv.append(navMenuUnorderedList);
		tabsDiv.appendChild(menuToggleDiv);

		const tabsTitleDiv = document.createElement('div');
		tabsTitleDiv.id = namespace + '_windowmain_tabs_title';
		tabsTitleDiv.innerText = displayname + ' Console';
		tabsDiv.appendChild(tabsTitleDiv)

		const tabsXDiv = document.createElement('div');
		tabsXDiv.id = namespace + '_windowmain_tabs_x';
		tabsXDiv.innerText = 'x';
		tabsXDiv.addEventListener('click', toggleMainDisplay);
		tabsDiv.appendChild(tabsXDiv);

		headerSpan.appendChild(tabsDiv);
		mainDiv.appendChild(headerSpan);

		const viewportContainerDiv = document.createElement('div');
		viewportContainerDiv.id = namespace + '_windowmain_viewportcontainer';
		mainDiv.appendChild(viewportContainerDiv);

		viewportContainerDiv.addEventListener('click', (e) => {
			menuToggleCheckbox.checked = false;
		})

		const consoleViewportDiv = document.createElement('div');
		consoleViewportDiv.id = namespace + '_consolevp';
		viewportContainerDiv.appendChild(consoleViewportDiv);

		const settingsViewportDiv = document.createElement('div');
		settingsViewportDiv.id = namespace + '_settingsvp';
		viewportContainerDiv.appendChild(settingsViewportDiv);

		const settingsLeftContentDiv = document.createElement('div');
		settingsLeftContentDiv.id = namespace + '_settingsvp_left';
		const settingsRightContentDiv = document.createElement('div');
		settingsRightContentDiv.id = namespace + '_settingsvp_right';
		settingsViewportDiv.appendChild(settingsLeftContentDiv);
		settingsViewportDiv.appendChild(settingsRightContentDiv);

		for (const k of Object.keys(config)) {
			if (config[k].type === 'hidden') continue;
			const label = document.createElement('label');
			label.htmlFor = config[k].key;
			label.innerText = config[k].helptext;
			label.title = config[k].helptext;
			settingsLeftContentDiv.appendChild(label);

			let elem;
			switch (config[k].type) {
				case 'checkbox':
					elem = document.createElement('input');
					elem.type = 'checkbox';
					elem.checked = config[k].value;
					break;
				case 'text':
					elem = document.createElement('input');
					elem.type = 'text';
					break;
			}
			elem.title = config[k].helptext;
			elem.id = namespace + config[k].key;
			elem.addEventListener('change', configChangeCallback);
			settingsRightContentDiv.appendChild(elem);
		}

		navMenuUnorderedList.addButton('Console').addEventListener('click', e => {
			viewportContainerDiv.childNodes.forEach(el => {
				el.style.display = 'none';
			});
			consoleViewportDiv.style.display = 'flex';
		});

		navMenuUnorderedList.addButton('Config').addEventListener('click', e => {
			viewportContainerDiv.childNodes.forEach(el => {
				el.style.display = 'none';
			});
			settingsViewportDiv.style.display = 'flex';
		});

		navMenuUnorderedList.addButton('Chess.com').addEventListener('click', e => {
			viewportContainerDiv.childNodes.forEach(el => {
				el.style.display = 'none';
			});
			chesscomViewportDiv.style.display = 'flex';
		});

		document.body.appendChild(mainDiv);
		makeDraggable(mainDiv, 'windowPlot');

		return mainDiv;
	}

	const namespace = 'chesshook';
	const displayname = 'ChessHook';

	const config = {
		renderHanging: {
			key: namespace + '_renderhanging',
			type: 'checkbox',
			display: 'Render Hanging Pieces',
			helptext: 'Render hanging pieces',
			value: true
		},
		printBestMove: {
			key: namespace + '_printbestmove',
			type: 'checkbox',
			display: 'Print Best Move',
			helptext: 'Print best move',
			value: true
		},
		verbose: {
			key: namespace + '_verbosity',
			type: 'checkbox',
			display: '(Debug) Verbose',
			helptext: '(Debug) Be verbose',
			value: false
		},
		renderWindow: {
			key: namespace + '_renderwindow',
			type: 'hidden',
			value: true
		},
		windowPlot: {
			key: namespace + '_windowplot',
			type: 'hidden',
			value: '30px;60px;50vw;30vh'
		}
	}

	window[namespace] = {};
	window[namespace].engine = new engine();

	const init = () => {
		makeConsole();
		addToConsole(`Loaded! This is version ${GM_info.script.version}`);
	}

	window[namespace].lastFEN = '';
	window[namespace].lastPos = {};

	const pieceValueMap = {
		'p': 1,
		'n': 3,
		'b': 3,
		'r': 5,
		'q': 9,
		'k': 0
	}

	const getPieceValue = (piece) => {
		return pieceValueMap[piece.toLowerCase()];
	}

	const xyToCoord = (x, y) => {
		const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
		const file = letters[y];
		const rank = 8 - x;
		return file + rank;
	}

	const updateLoop = () => {
		let fen = '';
		if (document.location.hostname === 'www.chess.com') {
			let board = document.getElementsByTagName('chess-board')[0];
			if (board?.game?.getFEN) fen = board.game.getFEN();
		}

		if (config.renderHanging.value) {
			if (fen && fen !== window[namespace].lastFEN) {
				addToConsole('Marking unprotected...');
				const toMove = fen.split(' ')[1];
				let position = parsePositionPieceRelations(fen);

				if (position) {
					window[namespace].lastPos = position;
					if (document.location.hostname === 'www.chess.com') {
						let board = document.getElementsByTagName('chess-board')[0];
						if (board?.game?.markings?.addMany && board?.game?.markings?.removeAll) {
							board.game.markings.removeAll();
							let markings = [];
							for (let i = 0; i < position.length; i++) {
								for (let j = 0; j < position[i].length; j++) {
									const tile = position[i][j];
									if (tile) {
										if (!tile.isProtected) {
											markings.push({ type: 'highlight', data: { square: xyToCoord(i, j) } });
										}
										if (tile.isThreatened && !tile.isProtected) {
											let isWhite = tile.piece === tile.piece.toUpperCase();
											if ((isWhite && toMove === 'w' || !isWhite && toMove === 'b')) continue;

											for (const threat of tile.threatenedBy) {
												markings.push({ type: 'arrow', data: { from: xyToCoord(threat[0], threat[1]), to: xyToCoord(i, j) } });
											}
										}
									}
								}
							}
							board.game.markings.addMany(markings);
						}
					}
				}
				window[namespace].lastFEN = fen;
			}
		}
		if (config.printBestMove.value) {
			if (fen && fen !== window[namespace].lastFEN) {
				window[namespace].lastFEN = fen;
				addToConsole('Calculating best move...');
				window[namespace].engine.setFEN(fen);
				window[namespace].engine.makeAIMove();
				let move = findChessMove(fen, window[namespace].engine.getFEN());
				addToConsole('Computed: ' + move);
			}
		}
	}

	window[namespace].updateLoop = setInterval(updateLoop, 300);

	function getAllMoves(position, x, y, isWhite) {
		let moves = [];

		if (position[x][y].piece.toUpperCase() === 'P') {
			// Check for forward move
			let forwardX = x + (isWhite ? -1 : 1);
			if (position[forwardX][y] === null) {
				moves.push([forwardX, y]);

				// Check for double move from starting rank
				if ((isWhite && x === 6) || (!isWhite && x === 1)) {
					let doubleForwardX = forwardX + (isWhite ? -1 : 1);
					if (position[doubleForwardX][y] === null) {
						moves.push([doubleForwardX, y]);
					}
				}
			}

			// Check for diagonal capture
			let leftX = x + (isWhite ? -1 : 1);
			let leftY = y - 1;
			if (leftY >= 0 && position[leftX][leftY] !== null) {
				moves.push([leftX, leftY]);
			}

			let rightX = x + (isWhite ? -1 : 1);
			let rightY = y + 1;
			if (rightY < 8 && position[rightX][rightY] !== null) {
				moves.push([rightX, rightY]);
			}
		} else if (position[x][y].piece.toUpperCase() === 'R') {
			// Check for horizontal moves
			for (let i = y + 1; i < 8; i++) {
				if (position[x][i] === null) {
					moves.push([x, i]);
				} else {
					moves.push([x, i]);
					break;
				}
			}

			for (let i = y - 1; i >= 0; i--) {
				if (position[x][i] === null) {
					moves.push([x, i]);
				} else {
					moves.push([x, i]);
					break;
				}
			}

			// Check for vertical moves
			for (let i = x + 1; i < 8; i++) {
				if (position[i][y] === null) {
					moves.push([i, y]);
				} else {
					moves.push([i, y]);
					break;
				}
			}

			for (let i = x - 1; i >= 0; i--) {
				if (position[i][y] === null) {
					moves.push([i, y]);
				} else {
					moves.push([i, y]);
					break;
				}
			}
		} else if (position[x][y].piece.toUpperCase() === 'N') {
			// Check for L-shaped moves
			let knightMoves = [
				[x - 2, y - 1],
				[x - 2, y + 1],
				[x - 1, y - 2],
				[x - 1, y + 2],
				[x + 1, y - 2],
				[x + 1, y + 2],
				[x + 2, y - 1],
				[x + 2, y + 1],
			];

			knightMoves.forEach(move => {
				if (move[0] >= 0 && move[0] < 8 && move[1] >= 0 && move[1] < 8) {
					moves.push(move);
				}
			});
		} else if (position[x][y].piece.toUpperCase() === 'B') {
			// Check for diagonal moves
			for (let i = 1; i < 8; i++) {
				if (x + i > 7 || y + i > 7) break;
				if (position[x + i][y + i] === null) {
					moves.push([x + i, y + i]);
				} else {
					moves.push([x + i, y + i]);
					break;
				}
			}
			for (let i = 1; i < 8; i++) {
				if (x + i > 7 || y - i < 0) break;
				if (position[x + i][y - i] === null) {
					moves.push([x + i, y - i]);
				} else {
					moves.push([x + i, y - i]);
					break;
				}
			}
			for (let i = 1; i < 8; i++) {
				if (x - i < 0 || y + i > 7) break;
				if (position[x - i][y + i] === null) {
					moves.push([x - i, y + i]);
				} else {
					moves.push([x - i, y + i]);
					break;
				}
			}
			for (let i = 1; i < 8; i++) {
				if (x - i < 0 || y - i < 0) break;
				if (position[x - i][y - i] === null) {
					moves.push([x - i, y - i]);
				} else {
					moves.push([x - i, y - i]);
					break;
				}
			}
		} else if (position[x][y].piece.toUpperCase() === 'Q') {
			// Check for horizontal moves
			for (let i = y + 1; i < 8; i++) {
				if (position[x][i] === null) {
					moves.push([x, i]);
				} else {
					moves.push([x, i]);
					break;
				}
			}

			for (let i = y - 1; i >= 0; i--) {
				if (position[x][i] === null) {
					moves.push([x, i]);
				} else {
					moves.push([x, i]);
					break;
				}
			}

			// Check for vertical moves
			for (let i = x + 1; i < 8; i++) {
				if (position[i][y] === null) {
					moves.push([i, y]);
				} else {
					moves.push([i, y]);
					break;
				}
			}

			for (let i = x - 1; i >= 0; i--) {
				if (position[i][y] === null) {
					moves.push([i, y]);
				} else {
					moves.push([i, y]);
					break;
				}
			}

			// Check for diagonal moves
			for (let i = 1; i < 8; i++) {
				if (x + i > 7 || y + i > 7) break;
				if (position[x + i][y + i] === null) {
					moves.push([x + i, y + i]);
				} else {
					moves.push([x + i, y + i]);
					break;
				}
			}
			for (let i = 1; i < 8; i++) {
				if (x + i > 7 || y - i < 0) break;
				if (position[x + i][y - i] === null) {
					moves.push([x + i, y - i]);
				} else {
					moves.push([x + i, y - i]);
					break;
				}
			}
			for (let i = 1; i < 8; i++) {
				if (x - i < 0 || y + i > 7) break;
				if (position[x - i][y + i] === null) {
					moves.push([x - i, y + i]);
				} else {
					moves.push([x - i, y + i]);
					break;
				}
			}
			for (let i = 1; i < 8; i++) {
				if (x - i < 0 || y - i < 0) break;
				if (position[x - i][y - i] === null) {
					moves.push([x - i, y - i]);
				} else {
					moves.push([x - i, y - i]);
					break;
				}
			}
		} else if (position[x][y].piece.toUpperCase() === 'K') {
			// Check for possible moves that are one square away diagonally and horizontally/vertically
			for (let i = -1; i <= 1; i++) {
				for (let j = -1; j <= 1; j++) {
					// Check that move doesn't go out of the board and doesn't stay in the same place
					if ((x + i) >= 0 && (x + i) < 8 && (y + j) >= 0 && (y + j) < 8 && !(i === 0 && j === 0)) {
						if (position[x + i][y + j] === null) {
							moves.push([x + i, y + j]);
						}
					}
				}
			}
		} else {
			addToConsole('Unknown piece type: ' + position[x][y]);
		}

		return moves;
	}

	const parsePositionPieceRelations = (fen) => {
		const [boardState, activeColor, castlingAvailability, enPassantTarget, halfMoveClock, fullMoveNumber] = fen.split(' ');

		const ranks = boardState.split("/");
		let position = [];

		if (!ranks.length) return null;

		// Loop through the ranks and files to populate the board position
		for (let i = 0; i < ranks.length; i++) {
			let rank = ranks[i];
			let row = [];
			for (let j = 0; j < rank.length; j++) {
				const char = rank.charAt(j);
				if (!isNaN(char)) {
					for (let k = 0; k < parseInt(char); k++) {
						row.push(null);
					}
				} else {
					row.push({ piece: char, isProtected: false, protectedBy: [], isThreatened: false, threatenedBy: [] });
				}
			}
			position.push(row)
		}

		// Find the positions of unprotected and threatened pieces
		for (let i = 0; i < position.length; i++) {
			for (let j = 0; j < position[i].length; j++) {
				const tile = position[i][j];
				if (tile) {
					const isWhite = tile.piece.toUpperCase() === tile.piece;
					const moves = getAllMoves(position, i, j, isWhite);
					for (let move of moves) {
						const [x, y] = move;
						const targetTile = position[x][y];
						if (targetTile) {
							const isTargetWhite = targetTile.piece.toUpperCase() === targetTile.piece;
							if (isTargetWhite === isWhite) {
								targetTile.isProtected = true;
								targetTile.protectedBy.push([i, j, tile.piece.toLowerCase()]);
							} else {
								targetTile.isThreatened = true;
								targetTile.threatenedBy.push([i, j, tile.piece.toLowerCase()]);
							}
						}
					}
				}
			}
		}

		return position;
	}

	document.addEventListener('readystatechange', () => {
		if (document.readyState === 'interactive') {
			configInitializer();
			init();
			document.addEventListener('keydown', keyPressEventListener);
		}
	});
})();