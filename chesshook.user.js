// ==UserScript==
// @name        Chesshook
// @include    	https://www.chess.com/*
// @grant       none
// @require		https://raw.githubusercontent.com/0mlml/chesshook/master/betafish.js
// @version     1.6.1
// @author      0mlml
// @description Chess.com Cheat Userscript
// @updateURL   https://raw.githubusercontent.com/0mlml/chesshook/master/chesshook.user.js
// @downloadURL https://raw.githubusercontent.com/0mlml/chesshook/master/chesshook.user.js
// @run-at      document-start
// ==/UserScript==

(() => {
  const configChangeHandler = (input) => {
    const configKey = input.target ? Object.keys(config).find(k => namespace + config[k].key === input.target.id) : input.key;
    const overrideValue = input.value || null;

    if (!configKey) return;

    if (overrideValue !== null) {
      config[configKey].value = overrideValue;
    } else {
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
        case 'number':
          config[configKey].value = Number(input.target.value);
          break;
        case 'color':
          config[configKey].value = input.target.value;
          break;
        case 'hidden':
          config[configKey].value = input.value;
          break;
      }
    }

    window.localStorage.setItem(config[configKey].key, config[configKey].value);

    renderConfigChanges();
    if (overrideValue === null) {
      handleConfigChanges(configKey);
    }
  }

  const handleConfigChanges = (key) => {
    switch (key) {
      case 'betafishThinkingTime':
        betafishWorker.postMessage({ type: 'THINKINGTIME', payload: Number(config.betafishThinkingTime.value) });
        break;
      case 'whichEngine':
        if (config.whichEngine.value !== 'external') {
          break;
        }
        if (!config.externalEngineURL.value) {
          addToConsole('Please set the path to the external engine in the config.');
          break;
        }
        externalEngineWorker.postMessage({ type: 'INIT', payload: config.externalEngineURL.value });

        if (!config.hasWarnedAboutExternalEngine.value || config.hasWarnedAboutExternalEngine.value === 'false') {
          addToConsole('Please note that the external engine is not for the faint of heart. It requires tinkering and the user to host the chesshook intermediary server.');
          alert('Please note that the external engine is not for the faint of heart. It requires tinkering and the user to host the chesshook intermediary server.')
          config.hasWarnedAboutExternalEngine.value = 'true';
          window.localStorage.setItem(config.hasWarnedAboutExternalEngine.key, 'true');
        }
        break;
    }

    if (key === 'externalEngineURL' && config.whichEngine.value === 'external') {
      externalEngineWorker.postMessage({ type: 'INIT', payload: config.externalEngineURL.value });
    }

    if (key === 'externalEnginePasskey') {
      externalEngineWorker.postMessage({ type: 'AUTH', payload: config.externalEnginePasskey.value });
    }

    if (config.puzzleMode.value) {
      configChangeHandler({ key: 'whichEngine', value: 'none' });
      configChangeHandler({ key: 'autoMove', value: false });
    }

    if (config.legitMode.value) {
      configChangeHandler({ key: 'whichEngine', value: 'none' });
      configChangeHandler({ key: 'autoMove', value: false });
      configChangeHandler({ key: 'puzzleMode', value: false });
    }
  }

  const renderConfigChanges = () => {
    if (config.renderWindow.value === 'true') document.getElementById(namespace + '_windowmain').style.display = 'flex';
    else document.getElementById(namespace + '_windowmain').style.display = 'none';

    for (const k of Object.keys(config)) {
      const element = document.getElementById(namespace + config[k].key);
      if (!element || !config[k].showOnlyIf) continue;
      const parentRow = element.parentElement;
      if (config[k].showOnlyIf()) parentRow.style.display = 'block';
      else parentRow.style.display = 'none';
    }
  }

  const configInitializer = () => {
    for (const k of Object.keys(config)) {
      const stored = window.localStorage.getItem(config[k].key);
      if (stored)
        switch (config[k].type) {
          case 'checkbox':
            config[k].value = stored === 'true' ? true : false;
            break;
          case 'number':
            config[k].value = Number(stored);
            break;
          default:
            config[k].value = stored;
        }
    }
  }

  const toggleMainDisplay = () => {
    const main = document.getElementById(namespace + '_windowmain');
    if (!main) return;

    if (main.style.display === 'flex') main.style.display = 'none';
    else main.style.display = 'flex';

    configChangeHandler({ key: 'renderWindow', value: main.style.display === 'flex' ? 'true' : 'false' });
  }

  const addToConsole = (text, isTrustedInput = true) => {
    let consoleElement = document.getElementById(namespace + '_consolevp');
    if (!consoleElement) {
      console.info(text);
      return;
    }

    const logEntryElement = document.createElement('div');
    logEntryElement.style = 'border-bottom:2px solid #333;padding-left:3px;';

    if (isTrustedInput) logEntryElement.innerHTML = text;
    else logEntryElement.innerText = text;

    document.getElementById(namespace + '_consolevp').appendChild(logEntryElement);
  }

  const makeDraggable = (elem, configKey = null) => {
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
      configChangeHandler({ key: configKey, value: `${elem.style.left};${elem.style.top};${elem.style.width};${elem.style.height}` });
    }

    const draggable_endDrag = () => {
      document.removeEventListener('mousedown', draggable_endDrag);
      document.removeEventListener('mousemove', draggable_handleDrag);
    }

    const draggable_handleResize = () => {
      configChangeHandler({ key: configKey, value: `${elem.style.left};${elem.style.top};${elem.style.width};${elem.style.height}` });
    }
    if (configKey) elem.addEventListener('resize', draggable_handleResize);

    if (document.getElementById(elem.id + '_headerbar')) document.getElementById(elem.id + '_headerbar').addEventListener('mousedown', draggable_mouseDown);
    else elem.addEventListener('mousedown', draggable_mouseDown);
  }

  const switchToViewport = (viewport) => {
    const viewportContainerDiv = document.getElementById(namespace + '_windowmain_viewportcontainer');
    const viewportDiv = document.getElementById(namespace + '_' + viewport);

    if (!viewportContainerDiv || !viewportDiv) return;

    viewportContainerDiv.childNodes.forEach(el => {
      el.style.display = 'none';
    });
    viewportDiv.style.display = 'flex';

    configChangeHandler({ key: 'lastViewport', value: viewport });
  }

  const createMainWindow = () => {
    let css = `div#chesshook_windowmain{overflow:auto;resize:both;position:fixed;min-height:30vh;min-width:30vw;aspect-ratio:1.7;background:#000;display:none;flex-direction:column;align-items:center;z-index:10000990;box-shadow:0 0 10px #000;border-radius:2px;border:2px solid #222;color:#ccc;font-family:monospace}div#chesshook_windowmain button{background-color:#000;color:#ccc;margin:0 0 0 .5vw}span#chesshook_windowmain_headerbar{top:0;left:0;margin:0;width:100%;height:3vh;background:#828282;display:flex;flex-direction:column;cursor:move}span#chesshook_windowmain_topdecoline{width:100%;height:10%;margin:0;padding:0;background:linear-gradient(to right,red,orange,#ff0,green,#00f,indigo,violet)}div#chesshook_windowmain_tabs{width:100%;height:90%;margin:0;padding:0;background-color:#000;border-bottom:2px solid #222;display:flex;flex-direction:row;cursor:move}div#chesshook_windowmain_tabs_title{margin:0;padding:0;display:flex;align-items:center;align-content:center;user-select:none;flex-grow:1000}div#chesshook_windowmain_tabs_x{height:calc(100%-3px);background:#222;aspect-ratio:1;margin:0;padding:0;display:flex;align-items:center;align-content:center;justify-content:center;cursor:pointer;border:2px solid #222;border-radius:5px}div#chesshook_windowmain_menutoggle{display:block;-webkit-user-select:none;user-select:none;height:calc(100%-3px);aspect-ratio:1;margin:0;padding:3px}div#chesshook_windowmain_menutoggle input{display:block;width:40px;height:32px;position:absolute;top:-7px;left:-5px;cursor:pointer;opacity:0;z-index:10000994;-webkit-touch-callout:none}ul#chesshook_windowmain_menutoggle_menu{margin:0;list-style-type:none;-webkit-font-smoothing:antialiased;opacity:0;transition:opacity .5s cubic-bezier(.77, .2, .05, 1);width:7vw;background-color:#000;position:absolute;top:3vh;left:0;border:2px solid #222;border-radius:5px;padding:0;flex-direction:column;align-items:stretch;z-index:10000991;visibility:hidden}div#chesshook_consolevp,div#chesshook_controlpanelvp{flex-direction:column;height:100%;width:100%;overflow-y:scroll}ul#chesshook_windowmain_menutoggle_menu>li{height:3.5vh;background-color:#000;border-bottom:2px solid #222;text-align:center;line-height:3.5vh;font-size:1.75vh;color:#fff;font-family:monospace;user-select:none;cursor:pointer;text-decoration:none}div#chesshook_windowmain_menutoggle span{display:block;width:24px;height:3px;margin-bottom:3px;position:relative;background:#cdcdcd;border-radius:3px;z-index:10000992;transform-origin:4px 0px;transition:transform .5s cubic-bezier(.77, .2, .05, 1),background .5s cubic-bezier(.77, .2, .05, 1),opacity .55s}div#chesshook_windowmain_menutoggle span:first-child{transform-origin:0% 0%}div#chesshook_windowmain_menutoggle span:nth-last-child(2){transform-origin:0% 100%}div#chesshook_windowmain_menutoggle input:checked~span{opacity:1;transform:rotate(45deg) translate(-2px,-1px)}div#chesshook_windowmain_menutoggle input:checked~span:nth-last-child(3){opacity:0;transform:rotate(0) scale(.2,.2)}div#chesshook_windowmain_menutoggle input:checked~span:nth-last-child(2){transform:rotate(-45deg) translate(0,-1px)}div#chesshook_windowmain_menutoggle input:checked~ul{opacity:1;visibility:visible}div#chesshook_windowmain_viewportcontainer{width:100%;height:90%;position:absolute;margin:0;padding:0;top:10%;left:0}div#chesshook_settingsvp{width:100%;height:100%;overflow-y:scroll;display:none;flex-direction:row;align-items:stretch;align-content:stretch;justify-content:center}div#chesshook_controlpanelvp{display:none}table#chesshook_settingsvp_table{width:100%;height:100%;display:flex;flex-direction:column;align-items:stretch;align-content:stretch}table#chesshook_settingsvp_table>tr{display:flex;flex-direction:row;align-items:stretch;align-content:stretch;justify-content:flex-start;border-bottom:2px solid #222}table#chesshook_settingsvp_table>tr>label{padding-right:5px}div#chesshook_windowmain textarea{width:100%;height:45%;resize:none;overflow-y:scroll;background-color:#000;color:#fff;font-family:monospace;font-size:1.5vh;border:2px solid #222;border-radius:5px;padding:5px}div#chesshook_windowmain input[type=color]{-webkit-appearance:none;appearance:none;border:none;height:90%}div#chesshook_windowmain input[type=color]::-webkit-color-swatch-wrapper{padding:0}div#chesshook_windowmain input[type=color]::-webkit-color-swatch{border:none}`;
    const styleSheetNode = document.createElement('style');

    if (styleSheetNode.styleSheet) styleSheetNode.styleSheet.cssText = css;
    else styleSheetNode.appendChild(document.createTextNode(css));

    const mainDiv = document.createElement('div');
    mainDiv.id = namespace + '_windowmain';

    mainDiv.appendChild(styleSheetNode);

    if (config.renderWindow.value === 'true') mainDiv.style.display = 'flex';
    else mainDiv.style.display = 'none';

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

    const controlPanelViewportDiv = document.createElement('div');
    controlPanelViewportDiv.id = namespace + '_controlpanelvp';
    viewportContainerDiv.appendChild(controlPanelViewportDiv);

    const websocketOutputTextArea = document.createElement('textarea');
    websocketOutputTextArea.id = namespace + '_websocketoutput';
    websocketOutputTextArea.readOnly = true;
    controlPanelViewportDiv.appendChild(websocketOutputTextArea);

    const engineOutputTextArea = document.createElement('textarea');
    engineOutputTextArea.id = namespace + '_engineoutput';
    engineOutputTextArea.readOnly = true;
    controlPanelViewportDiv.appendChild(engineOutputTextArea);

    const requestBoardUpdateButton = document.createElement('button');
    requestBoardUpdateButton.id = namespace + '_requestboardupdate';
    requestBoardUpdateButton.innerText = 'Request Board Update';
    requestBoardUpdateButton.addEventListener('click', e => {
      e.preventDefault();
      engineLastKnownFEN = null;
    });
    controlPanelViewportDiv.appendChild(requestBoardUpdateButton);

    const requestEngineStopButton = document.createElement('button');
    requestEngineStopButton.id = namespace + '_requestenginestop';
    requestEngineStopButton.innerText = 'Request Engine Stop';
    requestEngineStopButton.addEventListener('click', e => {
      e.preventDefault();
      externalEngineWorker.postMessage({ type: 'STOP' });
    });
    controlPanelViewportDiv.appendChild(requestEngineStopButton);

    const exploitsViewportDiv = document.createElement('div');
    exploitsViewportDiv.id = namespace + '_exploitsvp';
    viewportContainerDiv.appendChild(exploitsViewportDiv);

    const forceScholarsMateButton = document.createElement('button');
    forceScholarsMateButton.id = namespace + '_exploitsvp_forcescholarsmate';
    forceScholarsMateButton.innerText = 'Force Bot Scholars Mate';
    forceScholarsMateButton.title = 'This feature simply does not work online. It will only work on the computer play page, and can be used to three crown all bots.';
    forceScholarsMateButton.addEventListener('click', e => {
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
    });
    exploitsViewportDiv.appendChild(forceScholarsMateButton);

    const forceDrawButton = document.createElement('button');
    forceDrawButton.id = namespace + '_exploitsvp_forcedraw';
    forceDrawButton.innerText = 'Force Draw Against Bot';
    forceDrawButton.addEventListener('click', e => {
      e.preventDefault();
      if (document.location.hostname !== 'www.chess.com') return alert('You must be on chess.com to use this feature.');
      if (document.location.pathname !== '/play/computer') return alert('You must be on the computer play page to use this feature.');
      const board = document.querySelector('wc-chess-board');
      if (!board?.game?.move) return alert('You must be in a game to use this feature.');

      board.game.agreeDraw();
    });
    exploitsViewportDiv.appendChild(forceDrawButton);


    const settingsViewportDiv = document.createElement('div');
    settingsViewportDiv.id = namespace + '_settingsvp';
    viewportContainerDiv.appendChild(settingsViewportDiv);

    const settingsTable = document.createElement('table');
    settingsTable.id = namespace + '_settingsvp_table';
    settingsViewportDiv.appendChild(settingsTable);

    for (const k of Object.keys(config)) {
      if (config[k].type === 'hidden') continue;
      const tableRow = document.createElement('tr');
      const label = document.createElement('label');
      label.htmlFor = config[k].key;
      label.innerText = config[k].display;
      label.title = config[k].helptext;
      tableRow.appendChild(label);

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
          elem.value = config[k].value;
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
        case 'number':
          elem = document.createElement('input');
          elem.type = 'number';
          elem.min = config[k].min;
          elem.max = config[k].max;
          elem.step = config[k].step;
          elem.value = config[k].value;
          break;
        case 'color':
          elem = document.createElement('input');
          elem.type = 'color';
          elem.value = config[k].value;
          break;
        case 'hotkey':
          elem = document.createElement('input');
          elem.type = 'text';
          elem.value = config[k].value;
          elem.readOnly = true;
          elem.addEventListener('focus', () => {
            const onKeydown = (e) => {
              if (['Control', 'Shift', 'Alt'].includes(e.key)) return;
              e.preventDefault();
              const key = (e.ctrlKey ? 'Ctrl+' : '') + (e.shiftKey ? 'Shift+' : '') + (e.altKey ? 'Alt+' : '') + e.key.toUpperCase();
              elem.value = key;
              config[k].value = key;
              elem.blur();
              document.removeEventListener('keydown', onKeydown);
            };
            document.addEventListener('keydown', onKeydown);
          });
          break;
      }
      elem.title = config[k].helptext;
      elem.id = namespace + config[k].key;
      elem.addEventListener('change', configChangeHandler);
      tableRow.appendChild(elem);
      settingsTable.appendChild(tableRow);
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

    navMenuUnorderedList.addButton('External').addEventListener('click', _ => {
      switchToViewport('controlpanelvp');
    });

    document.body.appendChild(mainDiv);

    switchToViewport(config.lastViewport.value);
    makeDraggable(mainDiv, 'windowPlot');

    return mainDiv;
  }

  const namespace = 'chesshook';
  const displayname = 'ChessHook';

  window[namespace] = {};

  const config = {
    windowHotkey: {
      key: namespace + '_windowhotkey',
      type: 'hotkey',
      display: 'Window Hotkey',
      helptext: 'The hotkey to toggle the window',
      value: 'Alt+K',
      action: toggleMainDisplay
    },
    renderThreats: {
      key: namespace + '_renderThreats',
      type: 'checkbox',
      display: 'Render Threats',
      helptext: 'Render mates, undefended pieces, underdefended pieces, and pins.',
      value: true
    },
    renderThreatsPinColor: {
      key: namespace + '_renderThreatsPinColor',
      type: 'color',
      display: 'Pin Color',
      helptext: 'The color to render pins in',
      value: '#3333ff',
      showOnlyIf: () => config.renderThreats.value
    },
    renderThreatsUndefendedColor: {
      key: namespace + '_renderThreatsUndefendedColor',
      type: 'color',
      display: 'Undefended Color',
      helptext: 'The color to render undefended pieces in',
      value: '#ffff00',
      showOnlyIf: () => config.renderThreats.value
    },
    renderThreatsUnderdefendedColor: {
      key: namespace + '_renderThreatsUnderdefendedColor',
      type: 'color',
      display: 'Underdefended Color',
      helptext: 'The color to render underdefended pieces in',
      value: '#ff6666',
      showOnlyIf: () => config.renderThreats.value
    },
    renderThreatsMateColor: {
      key: namespace + '_renderThreatsMateColor',
      type: 'color',
      display: 'Mate Color',
      helptext: 'The color to render mates in',
      value: '#ff0000',
      showOnlyIf: () => config.renderThreats.value
    },
    clearArrowsKey: {
      key: namespace + '_clearArrowsKey',
      type: 'hotkey',
      display: 'Clear Arrows Hotkey',
      helptext: 'The hotkey to clear arrows',
      value: 'Alt+L',
      action: () => {
        const board = document.querySelector('wc-chess-board');
        if (!board) return;

        board.game.markings.removeAll();
      }
    },
    autoQueue: {
      key: namespace + '_autoqueue',
      type: 'checkbox',
      display: 'Auto Queue',
      helptext: 'Attempts to automatically queue for games.',
      value: false,
    },
    legitMode: {
      key: namespace + '_legitmode',
      type: 'checkbox',
      display: 'Legit Mode',
      helptext: 'Prevents the script from doing anything that could be considered cheating.',
      value: false
    },
    playingAs: {
      key: namespace + '_playingas',
      type: 'dropdown',
      display: 'Playing As',
      helptext: 'What color to calculate moves for',
      value: 'both',
      options: ['both', 'white', 'black', 'auto'],
      showOnlyIf: () => !config.legitMode.value && !config.puzzleMode.value
    },
    engineMoveColor: {
      key: namespace + '_enginemovecolor',
      type: 'color',
      display: 'Engine Move Color',
      helptext: 'The color to render the engine\'s move in',
      value: '#77ff77',
      showOnlyIf: () => !config.legitMode.value && !config.puzzleMode.value
    },
    whichEngine: {
      key: namespace + '_whichengine',
      type: 'dropdown',
      display: 'Which Engine',
      helptext: 'Which engine to use',
      value: 'none',
      options: ['none', 'betafish', 'random', 'cccp', 'external'],
      showOnlyIf: () => !config.legitMode.value && !config.puzzleMode.value
    },
    betafishThinkingTime: {
      key: namespace + '_betafishthinkingtime',
      type: 'number',
      display: 'Betafish Thinking Time',
      helptext: 'The amount of time in ms to think for each move',
      value: 1000,
      min: 0,
      max: 20000,
      step: 100,
      showOnlyIf: () => !config.legitMode.value && config.whichEngine.value === 'betafish'
    },
    externalEngineURL: {
      key: namespace + '_externalengineurl',
      type: 'text',
      display: 'External Engine URL',
      helptext: 'The URL of the external engine',
      value: 'ws://localhost:8080/ws',
      showOnlyIf: () => !config.legitMode.value && config.whichEngine.value === 'external'
    },
    externalEngineAutoGoCommand: {
      key: namespace + '_externalengineautogocommand',
      type: 'checkbox',
      display: 'External Engine Auto Go Command',
      helptext: 'Automatically determine the go command based on the time left in the game',
      value: true,
      showOnlyIf: () => !config.legitMode.value && config.whichEngine.value === 'external'
    },
    externalEngineGoCommand: {
      key: namespace + '_externalenginegocommand',
      type: 'text',
      display: 'External Engine Go Command',
      helptext: 'The command to send to the external engine to start thinking',
      value: 'go movetime 1000',
      showOnlyIf: () => !config.legitMode.value && config.whichEngine.value === 'external' && !config.externalEngineAutoGoCommand.value
    },
    externalEnginePasskey: {
      key: namespace + '_externalenginepasskey',
      type: 'text',
      display: 'External Engine Passkey',
      helptext: 'The passkey to send to the external engine to authenticate',
      value: 'passkey',
      showOnlyIf: () => !config.legitMode.value && config.whichEngine.value === 'external'
    },
    autoMove: {
      key: namespace + '_automove',
      type: 'checkbox',
      display: 'Auto Move',
      helptext: 'Potentially bannable. Tries to randomize move times to avoid detection.',
      value: false,
      showOnlyIf: () => !config.legitMode.value && !config.puzzleMode.value
    },
    autoMoveMaxRandomDelay: {
      key: namespace + '_automovemaxrandomdelay',
      type: 'number',
      display: 'Move time target range max',
      helptext: 'The maximum delay in ms for automove to target',
      value: 1000,
      min: 0,
      max: 20000,
      step: 100,
      showOnlyIf: () => !config.legitMode.value && config.autoMove.value
    },
    autoMoveMinRandomDelay: {
      key: namespace + '_automoveminrandomdelay',
      type: 'number',
      display: 'Move time target range min',
      helptext: 'The minimum delay in ms for automove to target',
      value: 500,
      min: 0,
      max: 20000,
      step: 100,
      showOnlyIf: () => !config.legitMode.value && config.autoMove.value
    },
    autoMoveInstaMoveStart: {
      key: namespace + '_automoveinstamovestart',
      type: 'checkbox',
      display: 'Speed up game start',
      helptext: 'Instantly move first 5',
      value: true,
      showOnlyIf: () => !config.legitMode.value && config.autoMove.value
    },
    puzzleMode: {
      key: namespace + '_puzzleMode',
      type: 'checkbox',
      display: 'Solves puzzles',
      helptext: 'Solves puzzles automatically',
      value: false,
    },
    refreshHotkey: {
      key: namespace + '_refreshhotkey',
      type: 'hotkey',
      display: 'Refresh Hotkey',
      helptext: 'Force some values to reload in order to try to \'unstuck\' some features',
      value: 'Alt+R',
      action: () => {
        if (window.location.pathname.startsWith('/puzzles')) {
          window.location.reload();
        } else {
          engineLastKnownFEN = null;
        }
      }
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
    },
    hasWarnedAboutExternalEngine: {
      key: namespace + '_haswarnedaboutexternalengine',
      type: 'hidden',
      value: false
    },
  };

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
      externalEngineWorker.postMessage({ type: 'AUTH', payload: config.externalEnginePasskey.value });
      addToWebSocketOutput('Attempting to authenticate with passkey ' + config.externalEnginePasskey.value);
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
      case '/callback/tactics/rated/next':
        if (config.puzzleMode.value) {
          puzzleQueue.push({
            fen: res.initialFen,
            moves: decodeTCN(res.tcnMoveList),
            tagged: false,
          });
        }
        break;
    }
  }

  const init = () => {
    createMainWindow();
    addToConsole(`Loaded! This is version ${GM_info.script.version}`);
    addToConsole(`Github: https://github.com/0mlml/chesshook`);
    if (config.renderWindow !== 'true') console.info('Chesshook has initialized in the background. To open the window, use the hotkey alt+k');
    if (config.externalEngineURL.value && config.whichEngine.value === 'external') {
      externalEngineWorker.postMessage({ type: 'INIT', payload: config.externalEngineURL.value });
    }
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
      board.game.markings.addOne({ type: 'highlight', data: { color: config.renderThreatsPinColor.value, square: pin } });
    }

    for (let undefended of threats.undefended) {
      board.game.markings.addOne({ type: 'arrow', data: { color: config.renderThreatsUndefendedColor.value, from: undefended.substring(0, 2), to: undefended.substring(2, 4) } });
    }

    for (let underdefended of threats.underdefended) {
      board.game.markings.addOne({ type: 'arrow', data: { color: config.renderThreatsUnderdefendedColor.value, from: underdefended.substring(0, 2), to: underdefended.substring(2, 4) } });
    }

    for (let mate of threats.mates) {
      board.game.markings.addOne({ type: 'arrow', data: { color: config.renderThreatsMateColor.value, from: mate.substring(0, 2), to: mate.substring(2, 4) } });
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

    if (config.playingAs.value !== 'both') {
      if ((config.playingAs.value === 'white' && fen.split(' ')[1] === 'b') ||
        (config.playingAs.value === 'black' && fen.split(' ')[1] === 'w')) {
        return false;
      }
    }

    if (config.playingAs.value === 'auto') {
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

    addToConsole(`Calculating move based on engine: ${config.whichEngine.value}...`);

    if (config.autoMoveInstaMoveStart.value && parseInt(fen.split(' ')[5]) < 6) lastEngineMoveCalcStartTime = 0;
    else lastEngineMoveCalcStartTime = performance.now();

    if (config.whichEngine.value === 'betafish') {
      betafishWorker.postMessage({ type: 'FEN', payload: fen });
      betafishWorker.postMessage({ type: 'GETMOVE' });
    } else if (config.whichEngine.value === 'external') {
      if (!externalEngineName) {
        addToConsole('External engine appears to be disconnected. Please check the config.');
        return;
      }
      let goCommand = config.externalEngineGoCommand.value;
      if (!config.externalEngineAutoGoCommand.value && (!goCommand || !goCommand.includes('go'))) {
        addToConsole('External engine go command is invalid. Please check the config.');
        return;
      } else if (config.externalEngineAutoGoCommand.value) {
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
    } else if (config.whichEngine.value === 'random') {
      const legalMoves = document.querySelector('wc-chess-board').game.getLegalMoves()
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];

      addToConsole(`Random computed move: ${randomMove.san}`);
      handleEngineMove(randomMove.from + randomMove.to + (randomMove.promotion ? randomMove.promotion : ''));
    } else if (config.whichEngine.value === 'cccp') {
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

    if (!config.renderThreats.value) board.game.markings.removeAll();

    const marking = { type: 'arrow', data: { color: config.engineMoveColor.value, from: uciMove.substring(0, 2), to: uciMove.substring(2, 4) } };
    if (handleMoveLastKnownMarking) board.game.markings.removeOne(handleMoveLastKnownMarking);
    board.game.markings.addOne(marking);
    handleMoveLastKnownMarking = marking;

    if (!config.autoMove.value) {
      return;
    }

    let max = config.autoMoveMaxRandomDelay.value, min = config.autoMoveMinRandomDelay.value;
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
        document.querySelector('div.tabs-tab[data-tab=newGame]').click();
        document.querySelector('button[data-cy=new-game-index-play]').click();
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

  const puzzleHandler = () => {
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
    const nextButton = document.querySelector('button.ui_v5-button-component:nth-child(3)');
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

      if (config.autoQueue.value) {
        handleRequeue();
      }
    }

    if (document.location.pathname.startsWith('/puzzles')) {
      if (config.puzzleMode.value) {
        puzzleHandler();
        clickPuzzleNext();
      }
    }

    if (config.renderThreats.value) {
      renderThreats();
    }

    if (!config.legitMode.value && config.whichEngine.value !== 'none') {
      getEngineMove();
    }
  }

  window[namespace].updateLoop = setInterval(updateLoop, 20);

  const hotkeyHandler = (e) => {
    for (const key of Object.keys(config)) {
      const item = config[key];
      if (item.type !== 'hotkey') continue;

      const hotkeyParts = item.value.split('+');
      const keyName = hotkeyParts.pop();
      const modifiers = hotkeyParts.reduce((acc, part) => {
        acc[part.toLowerCase()] = true;
        return acc;
      }, {});

      if (
        (modifiers.alt && !e.altKey) ||
        (modifiers.ctrl && !e.ctrlKey) ||
        (modifiers.shift && !e.shiftKey) ||
        (keyName.toUpperCase() !== e.key.toUpperCase())
      ) {
        continue;
      }

      e.preventDefault();

      if (typeof item.action === 'function') {
        item.action();
      }
    }
  }

  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'interactive') {
      configInitializer();
      init();
      document.addEventListener('keydown', e => {
        hotkeyHandler(e);
      });
    }
  });
})();
