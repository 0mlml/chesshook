// ==UserScript==
// @name        Chesshook
// @include    	https://www.chess.com/*
// @grant       none
// @require		https://raw.githubusercontent.com/0mlml/chesshook/master/betafish.js
// @version     0.8
// @author      0mlml
// @description QOL
// @updateURL   https://raw.githubusercontent.com/0mlml/chesshook/master/chesshook.user.js
// @downloadURL   https://raw.githubusercontent.com/0mlml/chesshook/master/chesshook.user.js
// @run-at      document-start
// ==/UserScript==

(() => {
	/**
	 * @description Handles config changes, either manually with and object that has a key and value, or from an event.
	 * @param {{key: string, value:string}|Event} input 
	 * @returns {void}
	 */
	const configChangeHandler = (input) => {
		// If the input is an event, find the key that matches the target id, otherwise use the key from the input object.
		const configKey = input.target ? Object.keys(config).find(k => namespace + config[k].key === input.target.id) : input.key;

		// If the key is not found, exit.
		if (!configKey) return;

		// Handle the different types of config options.
		switch (config[configKey].type) {
			case 'checkbox':
				config[configKey].value = input.target.checked;
				break;
			case 'text':
				config[configKey].value = input.target.value;
				break;
			case 'dropdown':
				if (config[configKey].options.includes(input.target.value))
					config[configKey].value = input.target.value;
				break;
			case 'hidden':
				config[configKey].value = input.value;
				break;
		}

		// Update the config key in localstorage.
		window.localStorage.setItem(config[configKey].key, config[configKey].value);

		// Sloppy way of updating the display status of the main window.
		if (config.renderWindow.value === 'true') document.getElementById(namespace + '_windowmain').style.display = 'flex';
		else document.getElementById(namespace + '_windowmain').style.display = 'none';

		// If we are not rendering hanging pieces, and on chess.com, remove all markings.
		if (!config.renderHanging.value) {
			if (document.location.hostname === 'www.chess.com') {
				let board = document.getElementsByTagName('chess-board')[0];
				if (board?.game?.markings?.removeAll) {
					board.game.markings.removeAll();
				}
			}
		}
	}

	/**
	 * @description Function to be called when a key is pressed. Will toggle the main window if alt+k is pressed.
	 * @param {KeyboardEvent} e 
	 */
	const keyPressEventListener = e => {
		if (e.altKey && e.key === 'k') {
			e.preventDefault();
			toggleMainDisplay();
		}
	}

	/**
	 * @description Initializes the config object with default values from localstorage.
	 * @returns {void}
	 */
	const configInitializer = () => {
		for (const k of Object.keys(config)) {
			const stored = window.localStorage.getItem(config[k].key);
			if (stored)
				// This ternary must exist because localstorage stores booleans as strings.
				config[k].value =
					config[k].type === 'checkbox'
						? (stored === 'true' ? true : false)
						: stored;

		}
	}

	/**
	 * @description Toggles the visibility of the main window.
	 * @returns {void}
	 */
	const toggleMainDisplay = () => {
		// Get the main window element, and if it does not exist, exit.
		const main = document.getElementById(namespace + '_windowmain');
		if (!main) return;

		// Toggle the display style of the main window.
		if (main.style.display === 'flex') main.style.display = 'none';
		else main.style.display = 'flex';

		// Update the config value for renderWindow.
		configChangeHandler({ key: 'renderWindow', value: main.style.display === 'flex' ? 'true' : 'false' });
	}

	/**
	 * @description Adds to the console of the main window. If the main window does not exist, will log to console instead.
	 * @param {String} text Input text
	 * @param {Boolean} isTrustedInput If the input is trusted, will use innerHTML. Otherwise, will use innerText.
	 * @returns {void}
	 */
	const addToConsole = (text, isTrustedInput = true) => {
		// Get the console element, and if it does not exist, log to console instead and exit.
		let consoleElement = document.getElementById(namespace + '_consolevp');
		if (!consoleElement) {
			console.log(text);
			return;
		}

		// Create a new div element, and set the style.
		const logEntryElement = document.createElement('div');
		logEntryElement.style = 'border-bottom:2px solid #333;padding-left:3px;';

		// If the input is trusted, set the innerHTML to the input text. Otherwise, set the innerText to the input text.
		if (isTrustedInput) logEntryElement.innerHTML = text;
		else logEntryElement.innerText = text;

		document.getElementById(namespace + '_consolevp').appendChild(logEntryElement);
	}

	/**
	 * @description Makes and element draggable. Will attempt to find a child element with id "parent.id + '_headerbar'" to make draggable.
	 * @param {HTMLElement} elem The element to make draggable.
	 * @param {String} configKey The key of the config object to update when the element is dragged.
	 * @returns {void}
	 */
	const makeDraggable = (elem, configKey = null) => {
		let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

		// The eventlistener for the mouse down event.
		const draggable_mouseDown = (e) => {
			e = e || window.event;
			e.preventDefault();

			x2 = e.clientX;
			y2 = e.clientY;
			document.addEventListener('mouseup', draggable_endDrag);
			document.addEventListener('mousemove', draggable_handleDrag);
		}

		// The eventlistener for the mouse move event.
		const draggable_handleDrag = (e) => {
			e = e || window.event;
			e.preventDefault();

			x1 = x2 - e.clientX;
			y1 = y2 - e.clientY;
			x2 = e.clientX;
			y2 = e.clientY;

			elem.style.top = (elem.offsetTop - y1) + 'px';
			elem.style.left = (elem.offsetLeft - x1) + 'px';

			// If we have a config key, update the config value.
			if (!configKey) return;
			configChangeHandler({ key: configKey, value: `${elem.style.left};${elem.style.top};${elem.style.width};${elem.style.height}` });
		}

		// The eventlistener for the mouse up event.
		const draggable_endDrag = () => {
			document.removeEventListener('mousedown', draggable_endDrag);
			document.removeEventListener('mousemove', draggable_handleDrag);
		}

		// The eventlistener for the resize event, only used if we have a config key.
		const draggable_handleResize = () => {
			configChangeHandler({ key: configKey, value: `${elem.style.left};${elem.style.top};${elem.style.width};${elem.style.height}` });
		}
		if (configKey) elem.addEventListener('resize', draggable_handleResize);

		// Add the eventlistener for the mouse down event. If we have a headerbar, add the eventlistener to that instead.
		if (document.getElementById(elem.id + '_headerbar')) document.getElementById(elem.id + '_headerbar').addEventListener('mousedown', draggable_mouseDown);
		else elem.addEventListener('mousedown', draggable_mouseDown);
	}

	/**
	 * @description Changes the viewport to the one specified
	 * @param {String} viewport 
	 * @returns {void}
	 */
	const switchToViewport = (viewport) => {
		// Get the viewport container and the viewport element, and if they do not exist, exit.
		const viewportContainerDiv = document.getElementById(namespace + '_windowmain_viewportcontainer');
		const viewportDiv = document.getElementById(namespace + '_' + viewport);

		if (!viewportContainerDiv || !viewportDiv) return;

		// Hide all the viewports, and show the one we want.
		viewportContainerDiv.childNodes.forEach(el => {
			el.style.display = 'none';
		});
		viewportDiv.style.display = 'flex';

		// Update the config value for lastViewport.
		configChangeHandler({ key: 'lastViewport', value: viewport });
	}

	/**
	 * @description Creates the main window.
	 * @returns {HTMLDivElement} The main window element.
	 */
	const createMainWindow = () => {
		let css = `div#chesshook_windowmain{overflow:auto;resize:both;position:fixed;min-height:30vh;min-width:30vw;aspect-ratio:1.7;background:#000;display:none;flex-direction:column;align-items:center;z-index:10000990;box-shadow:0 0 10px #000;border-radius:2px;border:2px solid #222;color:#ccc;font-family:monospace}div#chesshook_windowmain button{background-color:#000;color:#ccc;margin:0 0 0 .5vw}span#chesshook_windowmain_headerbar{top:0;left:0;margin:0;width:100%;height:3vh;background:#828282;display:flex;flex-direction:column;cursor:move}span#chesshook_windowmain_topdecoline{width:100%;height:10%;margin:0;padding:0;background:linear-gradient(to right,red,orange,#ff0,green,#00f,indigo,violet)}div#chesshook_windowmain_tabs{width:100%;height:90%;margin:0;padding:0;background-color:#000;border-bottom:2px solid #222;display:flex;flex-direction:row;cursor:move}div#chesshook_windowmain_tabs_title{margin:0;padding:0;display:flex;align-items:center;align-content:center;user-select:none;flex-grow:1000}div#chesshook_windowmain_tabs_x{height:calc(100%-3px);background:#222;aspect-ratio:1;margin:0;padding:0;display:flex;align-items:center;align-content:center;justify-content:center;cursor:pointer;border:2px solid #222;border-radius:5px}div#chesshook_windowmain_menutoggle{display:block;-webkit-user-select:none;user-select:none;height:calc(100%-3px);aspect-ratio:1;margin:0;padding:3px}div#chesshook_windowmain_menutoggle input{display:block;width:40px;height:32px;position:absolute;top:-7px;left:-5px;cursor:pointer;opacity:0;z-index:10000994;-webkit-touch-callout:none}ul#chesshook_windowmain_menutoggle_menu{margin:0;list-style-type:none;-webkit-font-smoothing:antialiased;opacity:0;transition:opacity .5s cubic-bezier(.77, .2, .05, 1);width:7vw;background-color:#000;position:absolute;top:3vh;left:0;border:2px solid #222;border-radius:5px;padding:0;flex-direction:column;align-items:stretch;z-index:10000991;visibility:hidden}ul#chesshook_windowmain_menutoggle_menu>li{height:3.5vh;background-color:#000;border-bottom:2px solid #222;text-align:center;line-height:3.5vh;font-size:1.75vh;color:#fff;font-family:monospace;user-select:none;cursor:pointer;text-decoration:none}div#chesshook_windowmain_menutoggle span{display:block;width:24px;height:3px;margin-bottom:3px;position:relative;background:#cdcdcd;border-radius:3px;z-index:10000992;transform-origin:4px 0px;transition:transform .5s cubic-bezier(.77, .2, .05, 1),background .5s cubic-bezier(.77, .2, .05, 1),opacity .55s}div#chesshook_windowmain_menutoggle span:first-child{transform-origin:0% 0%}div#chesshook_windowmain_menutoggle span:nth-last-child(2){transform-origin:0% 100%}div#chesshook_windowmain_menutoggle input:checked~span{opacity:1;transform:rotate(45deg) translate(-2px,-1px)}div#chesshook_windowmain_menutoggle input:checked~span:nth-last-child(3){opacity:0;transform:rotate(0) scale(.2,.2)}div#chesshook_windowmain_menutoggle input:checked~span:nth-last-child(2){transform:rotate(-45deg) translate(0,-1px)}div#chesshook_windowmain_menutoggle input:checked~ul{opacity:1;visibility:visible}div#chesshook_windowmain_viewportcontainer{width:100%;height:90%;position:absolute;margin:0;padding:0;top:10%;left:0}div#chesshook_consolevp{width:100%;height:100%;overflow-y:scroll;flex-direction:column}div#chesshook_settingsvp{width:100%;height:100%;overflow-y:scroll;display:none;flex-direction:row;align-items:stretch;align-content:stretch;justify-content:center}div#chesshook_settingsvp_left{padding:13px;display:flex;flex-direction:column;align-items:left;align-content:stretch;justify-content:center}div#chesshook_settingsvp_right{padding:12px;display:flex;flex-direction:column;align-items:center;align-content:stretch;justify-content:center}`;
		const styleSheetNode = document.createElement('style');

		// Compatibility hack
		if (styleSheetNode.styleSheet) styleSheetNode.styleSheet.cssText = css;
		else styleSheetNode.appendChild(document.createTextNode(css));

		const mainDiv = document.createElement('div');
		mainDiv.id = namespace + '_windowmain';

		mainDiv.appendChild(styleSheetNode);

		if (config.renderWindow.value === 'true') mainDiv.style.display = 'flex';
		else mainDiv.style.display = 'none';

		// Restore window position
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

		const exploitsViewportDiv = document.createElement('div');
		exploitsViewportDiv.id = namespace + '_exploitsvp';
		viewportContainerDiv.appendChild(exploitsViewportDiv);

		const forceScholarsMateButton = document.createElement('button');
		forceScholarsMateButton.id = namespace + '_exploitsvp_forcescholarsmate';
		forceScholarsMateButton.innerText = 'Force Bot Scholars Mate';
		forceScholarsMateButton.title = 'This feature simply does not work online. It will only work on the computer play page, and can be used to three crown all bots.';
		forceScholarsMateButton.addEventListener('click', e => {
			e.preventDefault();
			if (document.location.hostname !== 'www.chess.com') return alert('You must be on chess.com to use this feature.');
			if (document.location.pathname !== '/play/computer') return alert('You must be on the computer play page to use this feature.');
			const board = document.getElementsByTagName('chess-board')[0];
			if (!board?.game?.move || !board?.game?.getFEN) return alert('You must be in a game to use this feature.');
			if (parseInt(board.game.getFEN().split(' ')[5]) > 1 || board.game.getFEN().split(' ')[1] !== 'w') return alert('It must be turn 1 and white to move to use this feature.');

			// Play the moves for scholar's mate.
			// This exploits the fact that chess.com does not enforce anti-tampering on the computer play page.
			board.game.move('e4');
			board.game.move('e5');
			board.game.move('Qf3');
			board.game.move('Nc6');
			board.game.move('Bc4');
			board.game.move('Nb8');
			board.game.move('Qxf7#');
		});
		exploitsViewportDiv.appendChild(forceScholarsMateButton);

		const forceDrawButton = document.createElement('button');
		forceDrawButton.id = namespace + '_exploitsvp_forcedraw';
		forceDrawButton.innerText = 'Force Draw Against Bot';
		forceDrawButton.addEventListener('click', e => {
			e.preventDefault();
			if (document.location.hostname !== 'www.chess.com') return alert('You must be on chess.com to use this feature.');
			if (document.location.pathname !== '/play/computer') return alert('You must be on the computer play page to use this feature.');
			const board = document.getElementsByTagName('chess-board')[0];
			if (!board?.game?.move) return alert('You must be in a game to use this feature.');

			// This once again exploits the fact that chess.com does not enforce any sort of anti-tampering on the computer play page.
			board.game.agreeDraw();
		});
		exploitsViewportDiv.appendChild(forceDrawButton);


		const settingsViewportDiv = document.createElement('div');
		settingsViewportDiv.id = namespace + '_settingsvp';
		viewportContainerDiv.appendChild(settingsViewportDiv);

		const settingsLeftContentDiv = document.createElement('div');
		settingsLeftContentDiv.id = namespace + '_settingsvp_left';
		const settingsRightContentDiv = document.createElement('div');
		settingsRightContentDiv.id = namespace + '_settingsvp_right';
		settingsViewportDiv.appendChild(settingsLeftContentDiv);
		settingsViewportDiv.appendChild(settingsRightContentDiv);

		// Add settings to the settings viewport.
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
				case 'dropdown':
					elem = document.createElement('select');
					for (const opt of config[k].options) {
						const optElem = document.createElement('option');
						optElem.value = opt;
						optElem.innerText = opt;
						elem.appendChild(optElem);
					}
					elem.value = config[k].value;
					break;

			}
			elem.title = config[k].helptext;
			elem.id = namespace + config[k].key;
			elem.addEventListener('change', configChangeHandler);
			settingsRightContentDiv.appendChild(elem);
		}

		navMenuUnorderedList.addButton('Console').addEventListener('click', _ => {
			switchToViewport('consolevp');
		});

		navMenuUnorderedList.addButton('Config').addEventListener('click', _ => {
			switchToViewport('settingsvp');
		});

		navMenuUnorderedList.addButton('Exploits').addEventListener('click', _ => {
			switchToViewport('exploitsvp');
		});


		document.body.appendChild(mainDiv);

		switchToViewport(config.lastViewport.value);
		makeDraggable(mainDiv, 'windowPlot');

		return mainDiv;
	}

	// Used to prevent conflict with other scripts.
	const namespace = 'chesshook';
	const displayname = 'ChessHook';

	// The window object is used to store the script's data for easy access with devtools.
	window[namespace] = {};

	// The config object is used to store the settings for the script.
	// Saving and restoring settings is handled automatically, and all non-hidden settings are displayed in the settings viewport.
	const config = {
		renderHanging: {
			key: namespace + '_renderhanging',
			type: 'checkbox',
			display: 'Render Hanging Pieces',
			helptext: 'Render hanging pieces',
			value: true
		},
		playingAs: {
			key: namespace + '_playingas',
			type: 'dropdown',
			display: 'Playing As',
			helptext: 'What color to calculate moves for',
			value: 'both',
			options: ['both', 'white', 'black']
		},
		whichEngine: {
			key: namespace + '_whichengine',
			type: 'dropdown',
			display: 'Which Engine',
			helptext: 'Which engine to use',
			value: 'betafish',
			options: ['none', 'betafish', 'random', 'cccp']
		},
		autoMove: {
			key: namespace + '_automove',
			type: 'checkbox',
			display: 'Auto Move',
			helptext: 'Automatically move the engine move',
			value: true
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
		},
		lastViewport: {
			key: namespace + '_lastviewport',
			type: 'hidden',
			value: 'consolevp'
		}
	};

	/**
	 * @description The webworker function for the betafish engine.  Data should be inputted as { type: string, payload: any }. Valid types are: FEN, GETMOVE. The payload for FEN should be a FEN string. The payload for GETMOVE should be null. The webworker will respond with { type: string, payload: any }. Valid types are: MESSAGE, DEBUG, ERROR.
	 * @returns {void}
	 */
	const betafishWebWorkerFunc = () => {
		let betafish = betafishEngine();
		let working = false;
		self.addEventListener('message', e => {
			if (e.data.type === 'FEN') {
				if (!betafish) return self.postMessage({ type: 'ERROR', payload: 'Betafish not initialized.' });
				if (!e.data.payload) return self.postMessage({ type: 'ERROR', payload: 'No FEN provided.' });
				self.postMessage({ type: 'DEBUG', payload: 'Betafish recieved FEN.' });
				betafish.setFEN(e.data.payload);
			} else if (e.data.type === 'GETMOVE') {
				if (!betafish) return self.postMessage({ type: 'ERROR', payload: 'Betafish not initialized.' });
				if (working) return self.postMessage({ type: 'ERROR', payload: 'Betafish is already calculating.' });
				self.postMessage({ type: 'MESSAGE', payload: 'Betafish recieved request for best move. Calculating...' });
				working = true;
				const move = betafish.getBestMove();
				working = false;
				self.postMessage({ type: 'DEBUG', payload: 'Betafish has finished calculating.' })
				self.postMessage({ type: 'MOVE', payload: { move: move, toMove: betafish.getFEN().split(' ')[1] } })
			}
		});
	}

	// Hacky way of loading a webworker from a function. Also prepends the betafish engine to the webworker.
	const betafishWorkerBlob = new Blob([`const betafishEngine=${betafishEngine.toString()};(${betafishWebWorkerFunc.toString()})();`], { type: 'application/javascript' });
	const betafishWorkerURL = URL.createObjectURL(betafishWorkerBlob);
	window[namespace].betafishWebWorker = new Worker(betafishWorkerURL);

	/**
	 * @description The listener for the betafish webworker. Data should be inputted as { type: string, payload: any }. Valid types are: 'DEBUG', 'ERROR', 'MESSAGE', 'MOVE'.
	 * @param {MessageEvent} e The message event.
	 */
	window[namespace].betafishWebWorker.onmessage = e => {
		if (e.data.type === 'DEBUG') {
			console.log(e.data.payload);
		} else if (e.data.type === 'ERROR') {
			console.error(e.data.payload);
		} else if (e.data.type === 'MESSAGE') {
			addToConsole(e.data.payload);
		} else if (e.data.type === 'MOVE') {
			let move = e.data.payload.move;
			const squareToRankFile = (sq) => [Math.floor((sq - 21) / 10), sq - 21 - Math.floor((sq - 21) / 10) * 10];

			from = squareToRankFile(move & 0x7f);
			to = squareToRankFile((move >> 7) & 0x7f);

			addToConsole(`Betafish computed best for ${e.data.payload.toMove === 'w' ? 'white' : 'black'}: ${xyToCoordInverted(from[0], from[1])}->${xyToCoordInverted(to[0], to[1])}`);

			if (document.location.hostname === 'www.chess.com') {
				chesscomProcessMove(from, to, window[namespace].lastPos);
			} else if (document.location.hostname === 'lichess.org') {
				lichessRenderMove(from, to);
			}
		}
	}

	/**
	 * @description The init function. This is called when the script is loaded. It does not handle time-sensitive matters such as script injection.
	 * @returns {void}
	 */
	const init = () => {
		createMainWindow();
		addToConsole(`Loaded! This is version ${GM_info.script.version}`);
		addToConsole(`Github: https://github.com/0mlml/chesshook`);
		if (config.renderWindow.value !== 'true') console.log('Chesshook has initialized in the background. To open the window, use the hotkey alt+k')
	}

	// Last FEN and position. Mostly for debug, but also for automove.
	window[namespace].lastFEN = '';
	window[namespace].lastPos = {};

	// Map of piece values.
	const pieceValueMap = {
		'p': 1,
		'n': 3,
		'b': 3,
		'r': 5,
		'q': 9,
		'k': 0
	}

	/**
	 * @description Gets the value of a piece by letter.
	 * @param {String} piece The piece letter. 
	 * @returns {Number} The value of the piece.
	 */
	const getPieceValue = (piece) => {
		return pieceValueMap[piece.toLowerCase()];
	}

	/**
	 * @description Gets the standard notation coordinate from an x and y coordinate.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @returns {String} The standard notation coordinate.
	 */
	const xyToCoord = (x, y) => {
		const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
		const file = letters[y];
		const rank = 8 - x;
		return file + rank;
	}

	/**
	 * @description Gets the standard notation coordinate from an x and y coordinate, but with the Y coordinate inverted.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @returns {String} The standard notation coordinate.
	 */
	const xyToCoordInverted = (x, y) => {
		const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
		const file = letters[y];
		const rank = x + 1;
		return file + rank;
	}

	let didWarnCalcHangingOverride = false;

	/**
	 * @description Renders hanging pieces on the board.
	 * @param {String} fen The FEN of the position.
	 * @returns {void}
	 */
	const renderHanging = (fen) => {
		addToConsole('Marking unprotected...');

		let position = parsePositionPieceRelations(fen);
		if (!position) return false;

		if (document.location.hostname === 'www.chess.com') {
			chesscomRenderHanging(fen, position);
		} else if (document.location.hostname === 'lichess.org') {
			lichessRenderHanging(position);
		}
	}

	/**
	 * @description Renders hanging pieces on the board for chess.com.
	 * @param {String} fen The FEN of the position.
	 * @param {{piece: String, isProtected: boolean, protectedBy: String[], isThreatened: boolean, threatenedBy: String[]}[][]} position The position object.
	 * @returns {void}
	 */
	const chesscomRenderHanging = (fen, position) => {
		const toMove = fen.split(' ')[1];

		// Check that the board is loaded and that the markings API is available.
		let board = document.getElementsByTagName('chess-board')[0];
		if (!board?.game?.markings?.addMany || !board?.game?.markings?.removeAll) return false;

		// Remove all markings.
		board.game.markings.removeAll();

		let markings = [];
		for (let i = 0; i < position.length; i++) {
			for (let j = 0; j < position[i].length; j++) {
				const tile = position[i][j];

				// If the tile is empty, continue.
				if (!tile) continue;

				// If the tile is hanging, highlight it.
				if (!tile.isProtected) {
					markings.push({ type: 'highlight', data: { square: xyToCoord(i, j) } });
				}

				// If the tile is not threatened, or is protected, continue.
				if (!tile.isThreatened || tile.isProtected) continue;

				if (!config.whichEngine.value !== 'none') {
					let isWhite = tile.piece === tile.piece.toUpperCase();
					if ((isWhite && toMove === 'w' || !isWhite && toMove === 'b')) continue;

					for (const threat of tile.threatenedBy) {
						markings.push({ type: 'arrow', data: { color: '#ff7777', from: xyToCoord(threat[0], threat[1]), to: xyToCoord(i, j) } });
					}
				} else if (!didWarnCalcHangingOverride) {
					addToConsole('calcBestMove will override the arrows from renderHanging');
					didWarnCalcHangingOverride = true;
				}
			}
		}
		board.game.markings.addMany(markings);
	}

	const lichessRenderHanging = (fen, position) => {
		// not impl
	}

	/**
	 * @description Gets the distance from the end of the board.
	 * @param {Number} yCoord The y coordinate.
	 * @param {Boolean} isWhite Whether the piece is white.
	 * @returns {Number} The distance from the end of the board.
	 */
	const distanceToEnd = (yCoord, isWhite) => {
		return isWhite ? 7 - yCoord : yCoord;
	}

	/**
	 * @description The Checkmate, Check, Capture, Push engine.
	 * @param {String} fen The FEN of the position. 
	 * @returns 
	 */
	const cccpEngine = (fen) => {
		const position = parsePositionPieceRelations(fen);
		const isWhite = fen.split(' ')[1] === 'w';

		const checkMateMoves = getCheckmateMoves(fen);
		if (checkMateMoves.length > 0) return checkMateMoves[0];

		const legalMoves = getAllLegalMoves(fen);

		const checkMoves = legalMoves.filter(move => isKingInCheckAfterMove(position, move[0], move[1], move[2], move[3], isWhite));
		if (checkMoves.length > 0) return checkMoves[0];

		const captureMoves = legalMoves.filter(move => position[move[2]][move[3]]).sort((a, b) => getPieceValue(position[b[2]][b[3]].piece) - getPieceValue(position[a[2]][a[3]].piece));
		if (captureMoves.length > 0) return captureMoves[0];

		const pushMoves = legalMoves.sort((a, b) => distanceToEnd(b[3], isWhite) - distanceToEnd(a[3], isWhite));
		if (pushMoves.length > 0) return pushMoves[0];
	}

	/**
	 * @description Calculates a move based on the engine selected in the config.
	 * @param {String} fen The FEN of the position.
	 * @return {void}
	 */
	const calcEngineMove = (fen) => {
		const toMove = fen.split(' ')[1];
		if (config.playingAs.value !== 'both' && (config.playingAs.value === 'white') !== (toMove === 'w')) return false;

		addToConsole(`Calculating move based on engine: ${config.whichEngine.value}...`);

		let from, to;

		if (config.whichEngine.value === 'betafish') {
			window[namespace].betafishWebWorker.postMessage({ type: 'FEN', payload: fen });
			window[namespace].betafishWebWorker.postMessage({ type: 'GETMOVE' });
			return;
		} else if (config.whichEngine.value === 'random') {
			const legalMoves = getAllLegalMoves(fen);
			const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
			from = [randomMove[0], randomMove[1]];
			to = [randomMove[2], randomMove[3]];

			from[0] = 7 - from[0];
			to[0] = 7 - to[0];

			addToConsole(`Random computed move for ${toMove === 'w' ? 'white' : 'black'}: ${xyToCoordInverted(from[0], from[1])}->${xyToCoordInverted(to[0], to[1])}`);
		} else if (config.whichEngine.value === 'cccp') {
			const move = cccpEngine(fen);
			if (!move) return;
			from = [move[0], move[1]];
			to = [move[2], move[3]];

			from[0] = 7 - from[0];
			to[0] = 7 - to[0];

			addToConsole(`CCCP computed move for ${toMove === 'w' ? 'white' : 'black'}: ${xyToCoordInverted(from[0], from[1])}->${xyToCoordInverted(to[0], to[1])}`);
		}

		if (!from || !to) return;

		if (document.location.hostname === 'www.chess.com') {
			chesscomProcessMove(from, to, window[namespace].lastPos);
		} else if (document.location.hostname === 'lichess.org') {
			lichessRenderMove(from, to);
		}
	}

	/**
	 * @description Processes a move on chess.com.
	 * @param {Array} from The from coordinates.
	 * @param {Array} to The to coordinates.
	 * @param {{piece: String, isProtected: boolean, protectedBy: String[], isThreatened: boolean, threatenedBy: String[]}[][]} position The position.
	 * @returns {void}
	 */
	const chesscomProcessMove = (from, to, position) => {
		let board = document.getElementsByTagName('chess-board')[0];
		if (!board?.game?.markings?.addOne || !board?.game?.markings?.removeAll) return false;

		if (!config.renderHanging.value) board.game.markings.removeAll();

		board.game.markings.addOne({ type: 'arrow', data: { color: '#77ff77', from: xyToCoordInverted(from[0], from[1]), to: xyToCoordInverted(to[0], to[1]) } });

		if (config.autoMove.value && position) {
			if (document.location.pathname !== '/play/computer') {
				configChangeHandler({ key: 'autoMove', value: false });
				alert('You must be on the computer play page to use this feature.');
				return;
			}

			const piece = position[7 - from[0]][from[1]]?.piece.toUpperCase();
			if (!piece) return;

			board.game.move(piece + xyToCoordInverted(to[0], to[1]));

			addToConsole(piece + xyToCoordInverted(to[0], to[1]))
		}
	}

	const lichessRenderMove = (from, to) => {
		// not impl
	}

	/**
	 * @description The main loop that runs every 100ms.
	 * @returns {void}
	 */
	const updateLoop = () => {
		let fen;
		if (document.location.hostname === 'www.chess.com') {
			const board = document.getElementsByTagName('chess-board')[0];
			if (board?.game?.getFEN) fen = board.game.getFEN();
		} else if (document.location.hostname === 'lichess.org') {
			// Yet to find a way to get the FEN on lichess
		}

		if (!fen) return;

		window[namespace].lastPos = parsePositionPieceRelations(fen);


		if (config.renderHanging.value && fen !== window[namespace].lastFEN) {
			renderHanging(fen);
		}

		if (config.whichEngine.value !== 'none' && fen !== window[namespace].lastFEN) {
			calcEngineMove(fen);
		}

		window[namespace].lastFEN = fen;
	}

	window[namespace].updateLoop = setInterval(updateLoop, 100);

	/**
	 * @description Gets all legal moves for a given piece in a given position.
	 * @param {{piece: String, isProtected: boolean, protectedBy: String[], isThreatened: boolean, threatenedBy: String[]}[][]} position The position.
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 * @param {Boolean} isWhite Whether the piece is white.
	 * @returns {Array} The legal moves.
	 */
	const getAllMovesForPiece = (position, x, y, isWhite) => {
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
						if (!isKingInCheckAfterMove(position, x, y, x + i, y + j)) {
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

	/**
	 * @description Returns all legal moves for a given position that checkmate
	 * @param {string} fen The FEN string of the position
	 * @returns {Array} An array of legal moves that checkmate
	 */
	const getCheckmateMoves = (fen) => {
		const legalMoves = getAllLegalMoves(fen);
		const position = parsePositionPieceRelations(fen);
		const checkmateMoves = [];
		const isWhite = fen.split(' ')[1] === 'w';

		for (let i = 0; i < legalMoves.length; i++) {
			const [startX, startY, endX, endY] = legalMoves[i];
			const tempPiece = position[endX][endY];
			position[endX][endY] = position[startX][startY];
			position[startX][startY] = null;
			const isCheckmate = isKingInCheckmate(position, !isWhite, 0);
			position[startX][startY] = position[endX][endY];
			position[endX][endY] = tempPiece;

			if (isCheckmate) {
				checkmateMoves.push(legalMoves[i]);
			}

		}

		return checkmateMoves;
	}

	const isKingInCheckmate = (position, isWhite, depth) => {
		if (depth >= 3) return false; // Max depth reached, consider it a draw
		const kingPosition = findKing(position, isWhite);
		const kingMoves = getAllMovesForPiece(position, kingPosition[0], kingPosition[1], isWhite);
		const isInCheck = isKingInCheck(position, kingPosition[0], kingPosition[1], isWhite);

		if (!isInCheck) return false; // Not in check, can't be checkmate
		if (kingMoves.length > 0) return false; // King can move out of check, not checkmate

		const allMoves = getAllLegalMovesFromPosition(position, isWhite);
		for (let i = 0; i < allMoves.length; i++) {
			const [startX, startY, endX, endY] = allMoves[i];
			const tempPiece = position[endX][endY];
			position[endX][endY] = position[startX][startY];
			position[startX][startY] = null;
			const isCheckmate = isKingInCheckmate(position, !isWhite, depth + 1);
			position[startX][startY] = position[endX][endY];
			position[endX][endY] = tempPiece;

			if (!isCheckmate) {
				return false;
			}
		}

		return true;
	}

	const getAllLegalMovesFromPosition = (position, isWhite) => {
		const legalMoves = [];

		for (let i = 0; i < position.length; i++) {
			for (let j = 0; j < position[i].length; j++) {
				const piece = position[i][j];
				if (piece && piece.piece.toUpperCase() === (isWhite ? 'K' : 'k')) {
					const moves = getAllMovesForPiece(position, i, j, piece.piece.toUpperCase() === piece.piece);
					moves.forEach(move => {
						const [x, y] = move;
						if (isValidMove(position, i, j, x, y, piece.piece.toUpperCase() === piece.piece)) {
							legalMoves.push([i, j, x, y]);
						}
					});
				}
			}
		}

		return legalMoves;
	}

	/**
	 * @description Returns all legal moves for a given FEN
	 * @param {string} fen The FEN string of the position
	 * @returns {Array} An array of legal moves
	 */
	const getAllLegalMoves = (fen) => {
		const position = parsePositionPieceRelations(fen);
		const toMove = fen.split(' ')[1];
		const legalMoves = [];

		for (let i = 0; i < position.length; i++) {
			for (let j = 0; j < position[i].length; j++) {
				const piece = position[i][j];
				if (piece && piece.piece) {
					if (!(piece.piece.toUpperCase() === piece.piece === (toMove === 'w'))) continue;
					const moves = getAllMovesForPiece(position, i, j, piece.piece.toUpperCase() === piece.piece);
					moves.forEach(move => {
						const [x, y] = move;
						if (isValidMove(position, i, j, x, y, piece.piece.toUpperCase() === piece.piece)) {
							legalMoves.push([i, j, x, y]);
						}
					});
				}
			}
		}

		return legalMoves;
	}

	/**
	 * @description Returns whether a given move is valid
	 * @param {{piece: String, isProtected: boolean, protectedBy: String[], isThreatened: boolean, threatenedBy: String[]}[][]} position The position array
	 * @param {number} startX The starting X position
	 * @param {number} startY The starting Y position
	 * @param {number} endX The ending X position
	 * @param {number} endY The ending Y position
	 * @param {boolean} isWhite Whether the piece is white
	 */
	const isValidMove = (position, startX, startY, endX, endY, isWhite) => {
		if (startX === endX && startY === endY) return false; // Can't move to the same position
		const piece = position[startX][startY];
		const targetPiece = position[endX][endY];

		if (targetPiece && isWhite === (targetPiece.piece.toUpperCase() === targetPiece.piece)) return false; // Can't capture same color piece
		if (!getAllMovesForPiece(position, startX, startY, isWhite).some(([x, y]) => x === endX && y === endY)) return false; // Invalid move for piece
		if (isKingInCheckAfterMove(position, startX, startY, endX, endY, isWhite)) return false; // Can't move king into check

		return true;
	}

	/**
	 * @description Returns whether a king is in check after a move
	 * @param {{piece: String, isProtected: boolean, protectedBy: String[], isThreatened: boolean, threatenedBy: String[]}[][]} position The position array
	 * @param {number} startX The starting X position
	 * @param {number} startY The starting Y position
	 * @param {number} endX The ending X position
	 * @param {number} endY The ending Y position
	 * @param {boolean} isWhite Whether the piece is white
	 * @returns {boolean} Whether the king is in check
	 */
	const isKingInCheckAfterMove = (position, startX, startY, endX, endY, isWhite) => {
		const tempPiece = position[endX][endY];
		position[endX][endY] = position[startX][startY];
		position[startX][startY] = null;
		const kingPosition = findKing(position, isWhite);
		const result = isKingInCheck(position, kingPosition[0], kingPosition[1], !isWhite);
		position[startX][startY] = position[endX][endY];
		position[endX][endY] = tempPiece;
		return result;
	}

	/**
	 * @description Returns the location of the king
	 * @param {{piece: String, isProtected: boolean, protectedBy: String[], isThreatened: boolean, threatenedBy: String[]}[][]} position The position array
	 * @param {boolean} isWhite Whether the piece is white
	 * @returns {number[]} The location of the king
	 */
	const findKing = (position, isWhite) => {
		for (let i = 0; i < position.length; i++) {
			for (let j = 0; j < position[i].length; j++) {
				const piece = position[i][j];
				if (piece && piece.piece === (isWhite ? 'K' : 'k')) {
					return [i, j];
				}
			}
		}
	}

	/**
	 * @description Returns whether a king is in check
	 * @param {{piece: String, isProtected: boolean, protectedBy: String[], isThreatened: boolean, threatenedBy: String[]}[][]} position The position array
	 * @param {number} x The X position
	 * @param {number} y The Y position
	 * @param {boolean} isWhite Whether the piece is white
	 * @returns {boolean} Whether the king is in check
	 */
	const isKingInCheck = (position, x, y, isWhite) => {
		for (let i = 0; i < position.length; i++) {
			for (let j = 0; j < position[i].length; j++) {
				const piece = position[i][j];
				if (piece && piece.piece.toUpperCase() !== 'K' && isWhite === (piece.piece.toUpperCase() === piece.piece)) {
					const moves = getAllMovesForPiece(position, i, j, isWhite);
					if (moves.some(([x2, y2]) => x2 === x && y2 === y)) {
						return true;
					}
				}
			}
		}
		return false;
	}

	/**
	 * @description Parse the position piece relations from a FEN string
	 * @param {string} fen The FEN string
	 * @returns {{piece: String, isProtected: boolean, protectedBy: String[], isThreatened: boolean, threatenedBy: String[]}[][]} The position array
	 */
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
					const moves = getAllMovesForPiece(position, i, j, isWhite);
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