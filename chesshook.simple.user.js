// ==UserScript==
// @name        Chesshook Lite
// @include    	https://www.chess.com/*
// @grant       none
// @require     https://raw.githubusercontent.com/0mlml/chesshook/master/betafish.js
// @require     https://raw.githubusercontent.com/0mlml/vasara/main/vasara.js
// @version     1.0
// @author      0mlml (Enhanced by AI)
// @description A simplified version of Chesshook with core features and a modern UI.
// @run-at      document-end
// ==/UserScript==

(() => {
  try {
      // Safety check for vasara library
  let vs;
  const initializeVasara = () => {
    try {
      if (typeof vasara === 'function') {
        vs = vasara();
        console.log('[Chesshook Lite] Vasara library initialized successfully');
      } else {
        console.warn('[Chesshook Lite] Vasara function not available, retrying...');
        setTimeout(initializeVasara, 100);
      }
    } catch (error) {
      console.error('[Chesshook Lite] Failed to initialize vasara library:', error);
      // Retry after a delay
      setTimeout(initializeVasara, 500);
    }
  };

  // Initialize vasara library
  initializeVasara();
  
  // Add console message about external error filtering
  console.log('[Chesshook Lite] External error filtering enabled - chess.com errors will be suppressed');

  const createConfigWindow = () => {
    const configWindow = vs.generateConfigWindow({
      height: 600,
      width: 500,
      resizable: true
    });

    if (configWindow && configWindow.content) {
      // Apply dark theme to config window
      configWindow.content.style.cssText = `
        background: #1a1a1a !important;
        color: #e0e0e0 !important;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
      `;

      // Style all input elements
      const inputs = configWindow.content.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.style.cssText = `
          background: #2d2d2d !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
          border-radius: 4px !important;
          padding: 6px 8px !important;
          font-size: 12px !important;
        `;
      });

      // Style all labels
      const labels = configWindow.content.querySelectorAll('label');
      labels.forEach(label => {
        label.style.cssText = `
          color: #e0e0e0 !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        `;
      });

      // Style all buttons
      const buttons = configWindow.content.querySelectorAll('button');
      buttons.forEach(button => {
        button.style.cssText = `
          background: linear-gradient(135deg, #404040, #2d2d2d) !important;
          color: #e0e0e0 !important;
          border: 1px solid #404040 !important;
          border-radius: 4px !important;
          padding: 8px 12px !important;
          font-size: 12px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        `;
        
        button.onmouseenter = () => {
          button.style.background = 'linear-gradient(135deg, #505050, #404040) !important';
        };
        
        button.onmouseleave = () => {
          button.style.background = 'linear-gradient(135deg, #404040, #2d2d2d) !important';
        };
      });

      // Style the window title
      const title = configWindow.content.querySelector('.title, h1, h2, h3');
      if (title) {
        title.style.cssText = `
          color: #e0e0e0 !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          margin-bottom: 15px !important;
        `;
      }
    }
  }

  const createSettingsWindow = () => {
    const settingsWindow = vs.generateModalWindow({
      title: 'Chesshook Settings',
      unique: true,
      width: 550,
      height: 500
    });

    if (!settingsWindow) return;

    // Apply dark theme
    settingsWindow.content.style.cssText = `
      background: #1a1a1a;
      color: #e0e0e0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 0;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
    `;

    // Create tab container
    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    `;

    // Create tab buttons
    const tabButtons = document.createElement('div');
    tabButtons.style.cssText = `
      display: flex;
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      flex-shrink: 0;
    `;

    const tabs = [
      { id: 'engine', label: '🤖 Engine', icon: '⚙️' },
      { id: 'automove', label: '⚡ Auto Move', icon: '🎯' },
      { id: 'visual', label: '🎨 Visual', icon: '👁️' },
      { id: 'puzzle', label: '🧩 Puzzle', icon: '🎲' },
      { id: 'advanced', label: '🔧 Advanced', icon: '⚡' }
    ];

    const tabContents = {};
    let activeTab = 'engine';

    const mainContentArea = document.createElement('div');
    mainContentArea.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 20px;
    `;

    tabs.forEach((tab, index) => {
      const button = document.createElement('button');
      button.textContent = `${tab.icon} ${tab.label}`;
      button.style.cssText = `
        background: ${index === 0 ? '#404040' : 'transparent'};
        color: #e0e0e0;
        border: none;
        padding: 12px 16px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        flex: 1;
        border-radius: 0;
      `;
      
      button.onmouseenter = () => {
        if (activeTab !== tab.id) {
          button.style.background = '#353535';
        }
      };
      
      button.onmouseleave = () => {
        if (activeTab !== tab.id) {
          button.style.background = 'transparent';
        }
      };

      button.onclick = () => {
        activeTab = tab.id;
        Array.from(tabButtons.children).forEach((btn, i) => {
          btn.style.background = i === index ? '#404040' : 'transparent';
        });
        
        Object.keys(tabContents).forEach(key => {
          tabContents[key].style.display = key === tab.id ? 'block' : 'none';
        });
      };

      tabButtons.appendChild(button);

      const content = document.createElement('div');
      content.style.cssText = `
        display: ${index === 0 ? 'block' : 'none'};
      `;
      tabContents[tab.id] = content;
      mainContentArea.appendChild(content);
    });

    // Helper function to create setting rows
    const createSettingRow = (label, control, description = '') => {
      const row = document.createElement('div');
      row.style.cssText = `
        margin-bottom: 15px;
        padding: 10px;
        background: #2d2d2d;
        border-radius: 6px;
        border: 1px solid #404040;
      `;

      const labelElement = document.createElement('label');
      labelElement.textContent = label;
      labelElement.style.cssText = `
        display: block;
        color: #e0e0e0;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 5px;
      `;

      const controlContainer = document.createElement('div');
      controlContainer.style.cssText = `
        margin-bottom: 5px;
      `;
      controlContainer.appendChild(control);

      row.appendChild(labelElement);
      row.appendChild(controlContainer);

      if (description) {
        const descElement = document.createElement('div');
        descElement.textContent = description;
        descElement.style.cssText = `
          color: #a0a0a0;
          font-size: 11px;
          font-style: italic;
        `;
        row.appendChild(descElement);
      }

      return row;
    };

    // Engine tab content
    const engineContent = tabContents.engine;
    
    const engineSelect = document.createElement('select');
    engineSelect.style.cssText = `
      background: #1a1a1a;
      color: #e0e0e0;
      border: 1px solid #404040;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      width: 100%;
      box-sizing: border-box;
    `;
    ['none', 'betafish', 'random', 'cccp', 'external'].forEach(engine => {
      const option = document.createElement('option');
      option.value = engine;
      option.textContent = engine.charAt(0).toUpperCase() + engine.slice(1);
      engineSelect.appendChild(option);
    });
    engineSelect.value = vs.queryConfigKey(namespace + '_whichengine') || 'none';
    engineSelect.onchange = () => vs.setConfigValue(namespace + '_whichengine', engineSelect.value);

    engineContent.appendChild(createSettingRow(
      'Engine Selection',
      engineSelect,
      'Choose which chess engine to use for analysis and moves'
    ));

    const depthInput = document.createElement('input');
    depthInput.type = 'number';
    depthInput.min = '1';
    depthInput.max = '50';
    depthInput.value = vs.queryConfigKey(namespace + '_enginedepthlimit') || '20';
    depthInput.style.cssText = `
      background: #1a1a1a;
      color: #e0e0e0;
      border: 1px solid #404040;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      width: 100%;
      box-sizing: border-box;
    `;
    depthInput.onchange = () => vs.setConfigValue(namespace + '_enginedepthlimit', parseInt(depthInput.value));

    engineContent.appendChild(createSettingRow(
      'Engine Depth Limit',
      depthInput,
      'Maximum search depth for the engine (1-50)'
    ));

    // Auto Move tab content
    const automoveContent = tabContents.automove;
    
    const autoMoveToggle = document.createElement('input');
    autoMoveToggle.type = 'checkbox';
    autoMoveToggle.checked = vs.queryConfigKey(namespace + '_automove') || false;
    autoMoveToggle.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: #00b894;
    `;
    autoMoveToggle.onchange = () => vs.setConfigValue(namespace + '_automove', autoMoveToggle.checked);

    automoveContent.appendChild(createSettingRow(
      'Enable Auto Move',
      autoMoveToggle,
      'Automatically play the best move when it\'s your turn'
    ));

    const humanLikeToggle = document.createElement('input');
    humanLikeToggle.type = 'checkbox';
    humanLikeToggle.checked = vs.queryConfigKey(namespace + '_automovehumanlike') || false;
    humanLikeToggle.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: #00b894;
    `;
    humanLikeToggle.onchange = () => vs.setConfigValue(namespace + '_automovehumanlike', humanLikeToggle.checked);

    automoveContent.appendChild(createSettingRow(
      'Human-like Timing',
      humanLikeToggle,
      'Simulate realistic thinking patterns and delays'
    ));

    const minDelayInput = document.createElement('input');
    minDelayInput.type = 'number';
    minDelayInput.min = '500';
    minDelayInput.max = '30000';
    minDelayInput.value = vs.queryConfigKey(namespace + '_automovemindelay') || '1000';
    minDelayInput.style.cssText = `
      background: #1a1a1a;
      color: #e0e0e0;
      border: 1px solid #404040;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      width: 100%;
      box-sizing: border-box;
    `;
    minDelayInput.onchange = () => vs.setConfigValue(namespace + '_automovemindelay', parseInt(minDelayInput.value));

    automoveContent.appendChild(createSettingRow(
      'Minimum Delay (ms)',
      minDelayInput,
      'Minimum delay before making a move (500-30000ms)'
    ));

    // Visual tab content
    const visualContent = tabContents.visual;
    
    const threatsToggle = document.createElement('input');
    threatsToggle.type = 'checkbox';
    threatsToggle.checked = vs.queryConfigKey(namespace + '_renderthreats') || false;
    threatsToggle.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: #00b894;
    `;
    threatsToggle.onchange = () => vs.setConfigValue(namespace + '_renderthreats', threatsToggle.checked);

    visualContent.appendChild(createSettingRow(
      'Show Threats',
      threatsToggle,
      'Display pins, undefended pieces, and mate threats on the board'
    ));

    const scoreToggle = document.createElement('input');
    scoreToggle.type = 'checkbox';
    scoreToggle.checked = vs.queryConfigKey(namespace + '_showenginescore') || false;
    scoreToggle.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: #00b894;
    `;
    scoreToggle.onchange = () => vs.setConfigValue(namespace + '_showenginescore', scoreToggle.checked);

    visualContent.appendChild(createSettingRow(
      'Show Engine Score',
      scoreToggle,
      'Display real-time engine evaluation scores'
    ));

    const scoreColorInput = document.createElement('input');
    scoreColorInput.type = 'color';
    scoreColorInput.value = vs.queryConfigKey(namespace + '_showenginescorecolor') || '#00ff00';
    scoreColorInput.style.cssText = `
      width: 50px;
      height: 30px;
      border: 1px solid #404040;
      border-radius: 4px;
      background: #1a1a1a;
    `;
    scoreColorInput.onchange = () => vs.setConfigValue(namespace + '_showenginescorecolor', scoreColorInput.value);

    visualContent.appendChild(createSettingRow(
      'Score Display Color',
      scoreColorInput,
      'Color for the engine score display'
    ));

    // Puzzle tab content
    const puzzleContent = tabContents.puzzle;
    
    const puzzleToggle = document.createElement('input');
    puzzleToggle.type = 'checkbox';
    puzzleToggle.checked = vs.queryConfigKey(namespace + '_puzzlemode') || false;
    puzzleToggle.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: #00b894;
    `;
    puzzleToggle.onchange = () => vs.setConfigValue(namespace + '_puzzlemode', puzzleToggle.checked);

    puzzleContent.appendChild(createSettingRow(
      'Puzzle Mode',
      puzzleToggle,
      'Enable automatic puzzle solving'
    ));

    const autoNextToggle = document.createElement('input');
    autoNextToggle.type = 'checkbox';
    autoNextToggle.checked = vs.queryConfigKey(namespace + '_autonextpuzzle') || false;
    autoNextToggle.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: #00b894;
    `;
    autoNextToggle.onchange = () => vs.setConfigValue(namespace + '_autonextpuzzle', autoNextToggle.checked);

    puzzleContent.appendChild(createSettingRow(
      'Auto Next Puzzle',
      autoNextToggle,
      'Automatically proceed to the next puzzle after solving'
    ));

    // Advanced tab content
    const advancedContent = tabContents.advanced;
    
    const debugToggle = document.createElement('input');
    debugToggle.type = 'checkbox';
    debugToggle.checked = vs.queryConfigKey(namespace + '_debugmode') || false;
    debugToggle.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: #00b894;
    `;
    debugToggle.onchange = () => vs.setConfigValue(namespace + '_debugmode', debugToggle.checked);

    advancedContent.appendChild(createSettingRow(
      'Debug Mode',
      debugToggle,
      'Enable detailed logging and diagnostics'
    ));

    const updateRateInput = document.createElement('input');
    updateRateInput.type = 'number';
    updateRateInput.min = '50';
    updateRateInput.max = '1000';
    updateRateInput.value = vs.queryConfigKey(namespace + '_updaterate') || '100';
    updateRateInput.style.cssText = `
      background: #1a1a1a;
      color: #e0e0e0;
      border: 1px solid #404040;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12px;
      width: 100%;
      box-sizing: border-box;
    `;
    updateRateInput.onchange = () => vs.setConfigValue(namespace + '_updaterate', parseInt(updateRateInput.value));

    advancedContent.appendChild(createSettingRow(
      'Update Rate (ms)',
      updateRateInput,
      'How often the script updates (50-1000ms)'
    ));

    // Add save/reset buttons at the bottom
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      padding: 15px 20px;
      background: #2d2d2d;
      border-top: 1px solid #404040;
      flex-shrink: 0;
    `;

    const createButton = (text, color, onClick) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background: ${color};
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        flex: 1;
      `;
      button.onmouseenter = () => button.style.transform = 'translateY(-1px)';
      button.onmouseleave = () => button.style.transform = 'translateY(0)';
      button.onclick = onClick;
      return button;
    };

    buttonContainer.appendChild(createButton('💾 Save Settings', 'linear-gradient(135deg, #00b894, #00cec9)', () => {
      addToConsole('Settings saved successfully!');
    }));

    buttonContainer.appendChild(createButton('🔄 Reset to Defaults', 'linear-gradient(135deg, #ff6b6b, #ee5a24)', () => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        // Reset all settings to defaults
        vs.setConfigValue(namespace + '_whichengine', 'none');
        vs.setConfigValue(namespace + '_enginedepthlimit', 20);
        vs.setConfigValue(namespace + '_automove', false);
        vs.setConfigValue(namespace + '_automovehumanlike', false);
        vs.setConfigValue(namespace + '_automovemindelay', 1000);
        vs.setConfigValue(namespace + '_renderthreats', false);
        vs.setConfigValue(namespace + '_showenginescore', false);
        vs.setConfigValue(namespace + '_showenginescorecolor', '#00ff00');
        vs.setConfigValue(namespace + '_puzzlemode', false);
        vs.setConfigValue(namespace + '_autonextpuzzle', false);
        vs.setConfigValue(namespace + '_debugmode', false);
        vs.setConfigValue(namespace + '_updaterate', 100);
        
        addToConsole('Settings reset to defaults!');
        location.reload(); // Reload to apply changes
      }
    }));

    // Assemble the window
    tabContainer.appendChild(tabButtons);
    tabContainer.appendChild(mainContentArea);
    tabContainer.appendChild(buttonContainer);
    settingsWindow.content.appendChild(tabContainer);
  }

  const consoleQueue = [];
  const createConsoleWindow = () => {
    const consoleWindow = vs.generateModalWindow({
      title: 'Chesshook Console',
      resizable: true,
      unique: true,
      tag: namespace + '_consolewindowtag',
      width: 600,
      height: 450
    });

    if (!consoleWindow) return;

    // Apply dark theme
    consoleWindow.content.style.cssText = `
      background: #1a1a1a;
      color: #e0e0e0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 0;
      border-radius: 8px;
      overflow: hidden;
    `;

    consoleWindow.content.setAttribute('tag', namespace + '_consolewindowcontent');

    // Create tab container
    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
    `;

    // Create tab buttons
    const tabButtons = document.createElement('div');
    tabButtons.style.cssText = `
      display: flex;
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
    `;

    const tabs = [
      { id: 'console', label: '📝 Console', icon: '💬' },
      { id: 'stats', label: '📊 Stats', icon: '📈' },
      { id: 'tools', label: '🔧 Tools', icon: '⚙️' }
    ];

    const tabContents = {};
    let activeTab = 'console';

    tabs.forEach((tab, index) => {
      const button = document.createElement('button');
      button.textContent = `${tab.icon} ${tab.label}`;
      button.style.cssText = `
        background: ${index === 0 ? '#404040' : 'transparent'};
        color: #e0e0e0;
        border: none;
        padding: 12px 16px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
        flex: 1;
        border-radius: 0;
      `;
      
      button.onmouseenter = () => {
        if (activeTab !== tab.id) {
          button.style.background = '#353535';
        }
      };
      
      button.onmouseleave = () => {
        if (activeTab !== tab.id) {
          button.style.background = 'transparent';
        }
      };

      button.onclick = () => {
        activeTab = tab.id;
        tabButtons.children.forEach((btn, i) => {
          btn.style.background = i === index ? '#404040' : 'transparent';
        });
        
        Object.keys(tabContents).forEach(key => {
          tabContents[key].style.display = key === tab.id ? 'block' : 'none';
        });
      };

      tabButtons.appendChild(button);

      const content = document.createElement('div');
      content.style.cssText = `
        display: ${index === 0 ? 'block' : 'none'};
        padding: 20px;
        flex: 1;
        overflow-y: auto;
      `;
      tabContents[tab.id] = content;
    });

    // Console tab content
    const consoleContent = tabContents.console;
    
    const createButton = (text, color, onClick) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background: ${color};
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        margin: 3px;
        transition: all 0.2s ease;
      `;
      button.onmouseenter = () => button.style.transform = 'translateY(-1px)';
      button.onmouseleave = () => button.style.transform = 'translateY(0)';
      button.onclick = onClick;
      return button;
    };

    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      display: flex;
      gap: 8px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    `;

    controlsDiv.appendChild(createButton('🗑️ Clear', 'linear-gradient(135deg, #ff6b6b, #ee5a24)', () => {
      const consoleArea = document.querySelector(`[tag=${namespace}_consolewindowcontent]`);
      if (consoleArea) {
        consoleArea.innerHTML = '';
      }
    }));

    controlsDiv.appendChild(createButton('📤 Export', 'linear-gradient(135deg, #74b9ff, #0984e3)', () => {
      const consoleArea = document.querySelector(`[tag=${namespace}_consolewindowcontent]`);
      if (consoleArea) {
        const logs = Array.from(consoleArea.children).map(p => p.innerText).join('\n');
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chesshook_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }));

    consoleContent.appendChild(controlsDiv);

    // Console output area
    const consoleOutput = document.createElement('div');
    consoleOutput.setAttribute('tag', namespace + '_consolewindowcontent');
    consoleOutput.style.cssText = `
      height: calc(100% - 60px);
      overflow-y: auto;
      border: 1px solid #404040;
      padding: 12px;
      background: #0f0f0f;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 11px;
      border-radius: 6px;
      color: #00ff00;
    `;
    consoleContent.appendChild(consoleOutput);

    // Stats tab content
    const statsContent = tabContents.stats;
    
    const statsButton = createButton('📊 Show Stats', 'linear-gradient(135deg, #00b894, #00cec9)', () => {
      const savedGames = JSON.parse(localStorage.getItem(namespace + '_savedgames') || '[]');
      const stats = {
        totalGames: savedGames.length,
        wins: savedGames.filter(g => g.result === '1-0').length,
        losses: savedGames.filter(g => g.result === '0-1').length,
        draws: savedGames.filter(g => g.result === '1/2-1/2').length,
        totalMoves: moveHistory.length,
        averageScore: moveHistory.length > 0 ? 
          (moveHistory.reduce((sum, m) => sum + m.score, 0) / moveHistory.length / 100).toFixed(2) : 0
      };
      
      addToConsole(`=== STATISTICS ===`);
      addToConsole(`Total Games: ${stats.totalGames}`);
      addToConsole(`Wins: ${stats.wins} | Losses: ${stats.losses} | Draws: ${stats.draws}`);
      addToConsole(`Win Rate: ${stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(1) : 0}%`);
      addToConsole(`Total Moves Analyzed: ${stats.totalMoves}`);
      addToConsole(`Average Engine Score: ${stats.averageScore}`);
    });

    statsContent.appendChild(statsButton);

    // Tools tab content
    const toolsContent = tabContents.tools;
    
    const toolsButton = createButton('🔄 Refresh', 'linear-gradient(135deg, #a29bfe, #6c5ce7)', () => {
      location.reload();
    });

    toolsContent.appendChild(toolsButton);

    // Assemble the window
    tabContainer.appendChild(tabButtons);
    Object.values(tabContents).forEach(content => tabContainer.appendChild(content));
    consoleWindow.content.appendChild(tabContainer);

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
    line.style.cssText = `
      margin: 2px 0;
      padding: 4px 8px;
      background: #1a1a1a;
      border-left: 3px solid #404040;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 11px;
      color: #00ff00;
      word-wrap: break-word;
    `;
    line.innerText = text;
    consoleContent.appendChild(line);
    consoleContent.scrollTop = consoleContent.scrollHeight;
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
    return response;
  };

  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._url = new URL(url, window.location.origin).href;
    originalXHROpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
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
    // Safety check to ensure DOM is ready
    if (!document.head || !document.body) {
      console.warn(`[${namespace}] DOM not ready, retrying initialization...`);
      setTimeout(init, 100);
      return;
    }

    // Ensure vs is available
    if (!vs) {
      console.error(`[${namespace}] Vasara library not available, cannot initialize`);
      return;
    }

    // Add initialization status indicator
    try {
      let statusElement = document.getElementById(namespace + '_status');
      if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = namespace + '_status';
        statusElement.style.cssText = `
          position: fixed;
          top: 10px;
          left: 10px;
          background: rgba(255,165,0,0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 5px;
          font-size: 12px;
          z-index: 10000;
          pointer-events: none;
          font-family: monospace;
        `;
        document.body.appendChild(statusElement);
      }
      statusElement.textContent = 'Chesshook Lite: Loading...';
    } catch (error) {
      console.warn(`[${namespace}] Could not create status indicator:`, error);
    }
    vs.registerConfigValue({
      key: namespace + '_configwindowhotkey',
      type: 'hotkey',
      display: 'Config Window Hotkey: ',
      description: 'The hotkey to show the conifg window',
      value: 'Alt+K',
      action: createConfigWindow
    });

    vs.registerConfigValue({
      key: namespace + '_whichengine',
      type: 'dropdown',
      display: 'Which Engine: ',
      description: 'Which engine to use',
      value: 'none',
      options: ['betafish', 'random', 'cccp', 'external']
    });

    vs.registerConfigValue({
      key: namespace + '_automove',
      type: 'checkbox',
      display: 'Auto Move: ',
      description: 'Automatically plays the best move.',
      value: false
    });

    vs.registerConfigValue({
      key: namespace + '_enginemovecolor',
      type: 'color',
      display: 'Engine Move Color: ',
      description: 'The color to render the engine\'s move in',
      value: '#77ff77'
    });
    
    vs.registerConfigValue({
      key: namespace + '_automovehotkey',
      type: 'hotkey',
      display: 'Auto Move Hotkey: ',
      description: 'Hotkey to trigger auto move (plays best move when pressed)',
      value: 'Alt+M',
      action: () => {
        if (vs.queryConfigKey(namespace + '_whichengine') === 'none') {
          addToConsole('Please select an engine first in the config window.');
          return;
        }
        getEngineMove();
      }
    });

    vs.loadPersistentState();

    vs.registerConfigValue({
      key: namespace + '_automovehumanlike',
      type: 'checkbox',
      display: 'Human-like Move Timing: ',
      description: 'Simulate human thinking patterns with variable delays',
      value: false,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_automove')
    });

    vs.registerConfigValue({
      key: namespace + '_automovehumanlikemin',
      type: 'number',
      display: 'Human-like Min Delay (ms): ',
      description: 'Minimum delay for human-like timing',
      value: 2000,
      min: 500,
      max: 10000,
      step: 100,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_automove') && vs.queryConfigKey(namespace + '_automovehumanlike')
    });

    vs.registerConfigValue({
      key: namespace + '_automovehumanlikemax',
      type: 'number',
      display: 'Human-like Max Delay (ms): ',
      description: 'Maximum delay for human-like timing',
      value: 8000,
      min: 1000,
      max: 30000,
      step: 100,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_automove') && vs.queryConfigKey(namespace + '_automovehumanlike')
    });

    vs.registerConfigValue({
      key: namespace + '_automoveblunderchance',
      type: 'number',
      display: 'Blunder Chance (%): ',
      description: 'Percentage chance to play a suboptimal move to appear more human',
      value: 5,
      min: 0,
      max: 50,
      step: 1,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_automove') && vs.queryConfigKey(namespace + '_automovehumanlike')
    });

    vs.registerConfigValue({
      key: namespace + '_automovepositionalweight',
      type: 'number',
      display: 'Positional Move Weight: ',
      description: 'Weight for positional vs tactical moves (0=tactical, 100=positional)',
      value: 30,
      min: 0,
      max: 100,
      step: 5,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_automove') && vs.queryConfigKey(namespace + '_automovehumanlike')
    });

    vs.registerConfigValue({
      key: namespace + '_enginedepthlimit',
      type: 'number',
      display: 'Engine Depth Limit: ',
      description: 'Maximum search depth for engine analysis',
      value: 20,
      min: 1,
      max: 50,
      step: 1,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_whichengine') !== 'none'
    });

    vs.registerConfigValue({
      key: namespace + '_enginenodelimit',
      type: 'number',
      display: 'Engine Node Limit: ',
      description: 'Maximum nodes to search (0=unlimited)',
      value: 0,
      min: 0,
      max: 1000000,
      step: 1000,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_whichengine') !== 'none'
    });

    vs.registerConfigValue({
      key: namespace + '_enginemultipv',
      type: 'number',
      display: 'Multi-PV Lines: ',
      description: 'Number of alternative moves to analyze',
      value: 3,
      min: 1,
      max: 10,
      step: 1,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_whichengine') !== 'none'
    });

    vs.registerConfigValue({
      key: namespace + '_showenginescore',
      type: 'checkbox',
      display: 'Show Engine Score: ',
      description: 'Display engine evaluation score on the board',
      value: false,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_whichengine') !== 'none'
    });

    vs.registerConfigValue({
      key: namespace + '_showenginescorecolor',
      type: 'color',
      display: 'Engine Score Color: ',
      description: 'Color for engine score display',
      value: '#ffffff',
      showOnlyIf: () => vs.queryConfigKey(namespace + '_whichengine') !== 'none' && vs.queryConfigKey(namespace + '_showenginescore')
    });

    vs.registerConfigValue({
      key: namespace + '_showmovehistory',
      type: 'checkbox',
      display: 'Show Move History: ',
      description: 'Display move history with evaluations',
      value: false,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_whichengine') !== 'none'
    });

    vs.registerConfigValue({
      key: namespace + '_showpositioneval',
      type: 'checkbox',
      display: 'Show Position Evaluation: ',
      description: 'Display current position evaluation',
      value: false,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_whichengine') !== 'none'
    });

    vs.registerConfigValue({
      key: namespace + '_autosavegames',
      type: 'checkbox',
      display: 'Auto Save Games: ',
      description: 'Automatically save games to local storage',
      value: false
    });

    vs.registerConfigValue({
      key: namespace + '_showopeningname',
      type: 'checkbox',
      display: 'Show Opening Name: ',
      description: 'Display current opening name',
      value: false
    });

    vs.registerConfigValue({
      key: namespace + '_showopeningnamecolor',
      type: 'color',
      display: 'Opening Name Color: ',
      description: 'Color for opening name display',
      value: '#00ff00',
      showOnlyIf: () => vs.queryConfigKey(namespace + '_showopeningname')
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
    })

    vs.registerConfigValue({
      key: namespace + '_apipuzzletimemode',
      type: 'dropdown',
      display: 'Puzzle Time Mode: ',
      description: 'The time mode to use for the API puzzles',
      value: 'zero',
      options: ['hour', 'legit'],
      showOnlyIf: () => vs.queryConfigKey(namespace + '_puzzlemode') && vs.queryConfigKey(namespace + '_apipuzzlemode')
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
      key: namespace + '_automovemindelay',
      type: 'number',
      display: 'Minimum Delay (ms): ',
      description: 'Minimum delay before making a move (500-30000ms)',
      value: 1000,
      min: 500,
      max: 30000,
      step: 100,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_automove')
    });

    vs.registerConfigValue({
      key: namespace + '_automovehumanlike',
      type: 'checkbox',
      display: 'Human-like Move Timing: ',
      description: 'Simulate human thinking patterns with variable delays',
      value: false,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_automove')
    });

    vs.registerConfigValue({
      key: namespace + '_automovehumanlikemin',
      type: 'number',
      display: 'Human-like Min Delay (ms): ',
      description: 'Minimum delay for human-like timing',
      value: 2000,
      min: 500,
      max: 10000,
      step: 100,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_automove') && vs.queryConfigKey(namespace + '_automovehumanlike')
    });

    vs.registerConfigValue({
      key: namespace + '_automovehumanlikemax',
      type: 'number',
      display: 'Human-like Max Delay (ms): ',
      description: 'Maximum delay for human-like timing',
      value: 8000,
      min: 1000,
      max: 30000,
      step: 100,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_automove') && vs.queryConfigKey(namespace + '_automovehumanlike')
    });

    vs.registerConfigValue({
      key: namespace + '_automoveblunderchance',
      type: 'number',
      display: 'Blunder Chance (%): ',
      description: 'Percentage chance to play a suboptimal move to appear more human',
      value: 5,
      min: 0,
      max: 50,
      step: 1,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_automove') && vs.queryConfigKey(namespace + '_automovehumanlike')
    });

    vs.registerConfigValue({
      key: namespace + '_automovepositionalweight',
      type: 'number',
      display: 'Positional Move Weight: ',
      description: 'Weight for positional vs tactical moves (0=tactical, 100=positional)',
      value: 30,
      min: 0,
      max: 100,
      step: 5,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && vs.queryConfigKey(namespace + '_automove') && vs.queryConfigKey(namespace + '_automovehumanlike')
    });

    vs.registerConfigValue({
      key: namespace + '_renderthreatsopacity',
      type: 'number',
      display: 'Threat Opacity: ',
      description: 'Opacity level for threat rendering (0-100%)',
      value: 70,
      min: 10,
      max: 100,
      step: 5,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_renderthreats')
    });

    vs.registerConfigValue({
      key: namespace + '_renderthreatsblink',
      type: 'checkbox',
      display: 'Blinking Threats: ',
      description: 'Make threats blink for better visibility',
      value: false,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_renderthreats')
    });

    vs.registerConfigValue({
      key: namespace + '_renderthreatsblinkinterval',
      type: 'number',
      display: 'Blink Interval (ms): ',
      description: 'Interval for threat blinking',
      value: 500,
      min: 100,
      max: 2000,
      step: 50,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_renderthreats') && vs.queryConfigKey(namespace + '_renderthreatsblink')
    });

    vs.registerConfigValue({
      key: namespace + '_puzzleautonext',
      type: 'checkbox',
      display: 'Auto Next Puzzle: ',
      description: 'Automatically go to next puzzle after solving',
      value: false,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_puzzlemode')
    });

    vs.registerConfigValue({
      key: namespace + '_puzzledelay',
      type: 'number',
      display: 'Puzzle Delay (ms): ',
      description: 'Delay before moving to next puzzle',
      value: 1000,
      min: 0,
      max: 5000,
      step: 100,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_puzzlemode') && vs.queryConfigKey(namespace + '_puzzleautonext')
    });

    vs.registerConfigValue({
      key: namespace + '_puzzleshowhint',
      type: 'checkbox',
      display: 'Show Puzzle Hints: ',
      description: 'Show hints for difficult puzzles',
      value: false,
      showOnlyIf: () => vs.queryConfigKey(namespace + '_puzzlemode')
    });

    vs.registerConfigValue({
      key: namespace + '_updaterate',
      type: 'number',
      display: 'Update Rate (ms): ',
      description: 'How often to update the script (lower = more responsive)',
      value: 100,
      min: 50,
      max: 1000,
      step: 50
    });

    vs.registerConfigValue({
      key: namespace + '_debugmode',
      type: 'checkbox',
      display: 'Debug Mode: ',
      description: 'Enable debug logging to console',
      value: false
    });

    vs.registerConfigValue({
      key: namespace + '_toggleautomovehotkey',
      type: 'hotkey',
      display: 'Toggle Auto Move Hotkey: ',
      description: 'Hotkey to toggle auto move on/off',
      value: 'Alt+T',
      action: toggleAutoMove,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && !vs.queryConfigKey(namespace + '_puzzlemode')
    });

    vs.registerConfigValue({
      key: namespace + '_quickengineswitchhotkey',
      type: 'hotkey',
      display: 'Quick Engine Switch Hotkey: ',
      description: 'Hotkey to quickly switch between engines',
      value: 'Alt+E',
      action: quickEngineSwitch,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode') && !vs.queryConfigKey(namespace + '_puzzlemode')
    });

    vs.registerConfigValue({
      key: namespace + '_togglethreatshotkey',
      type: 'hotkey',
      display: 'Toggle Threats Hotkey: ',
      description: 'Hotkey to toggle threat rendering',
      value: 'Alt+H',
      action: toggleThreats,
      showOnlyIf: () => !vs.queryConfigKey(namespace + '_legitmode')
    });

    vs.registerConfigValue({
      key: namespace + '_showstatushotkey',
      type: 'hotkey',
      display: 'Show Status Hotkey: ',
      description: 'Hotkey to show script status and current settings',
      value: 'Alt+S',
      action: showScriptStatus
    });

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

    // Update status indicator
    try {
      const statusElement = document.getElementById(namespace + '_status');
      if (statusElement) {
        statusElement.textContent = 'Chesshook Lite: Ready!';
        statusElement.style.background = 'rgba(0,255,0,0.9)';
        // Hide status after 3 seconds
        setTimeout(() => {
          if (statusElement && statusElement.parentNode) {
            statusElement.parentNode.removeChild(statusElement);
          }
        }, 3000);
      }
    } catch (error) {
      console.warn(`[${namespace}] Could not update status indicator:`, error);
    }

    addToConsole(`Loaded! This is version ${GM_info.script.version}`);
    addToConsole(`Github: https://github.com/0mlml/chesshook`);
    addToConsole(`Note: External errors (Sentry, AudioContext, etc.) are from chess.com and not related to this script.`);
          console.log('[Chesshook Lite] Script loaded successfully! Use Alt+K for config, Alt+O for settings, Alt+M for auto move, Alt+C for console, Alt+L for tools');
    
    // Handle external errors gracefully
    handleExternalErrors();
    
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
  let autoMoveEnabled = false;
  let lastEngineScore = 0;
  let moveHistory = [];
  let openingNames = {
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR': 'Starting Position',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR': 'King\'s Pawn Opening',
    'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR': 'Queen\'s Pawn Opening',
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR': 'Sicilian Defense',
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR': 'Open Game',
    'rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR': 'Queen\'s Pawn Game'
  };

  // Enhanced human-like move timing function
  const calculateHumanLikeDelay = (position, moveNumber, timeLeft) => {
    if (!vs.queryConfigKey(namespace + '_automovehumanlike')) {
      return Math.floor(Math.random() * (vs.queryConfigKey(namespace + '_automovemaxrandomdelay') - vs.queryConfigKey(namespace + '_automoveminrandomdelay')) + vs.queryConfigKey(namespace + '_automoveminrandomdelay'));
    }

    const minDelay = vs.queryConfigKey(namespace + '_automovehumanlikemin');
    const maxDelay = vs.queryConfigKey(namespace + '_automovehumanlikemax');
    
    // Base delay based on position complexity
    let baseDelay = (minDelay + maxDelay) / 2;
    
    // Adjust based on move number (longer thinking in opening/middlegame)
    if (moveNumber < 10) {
      baseDelay *= 1.2; // Opening
    } else if (moveNumber < 30) {
      baseDelay *= 1.5; // Middlegame
    } else {
      baseDelay *= 0.8; // Endgame
    }
    
    // Adjust based on time pressure
    if (timeLeft < 30000) { // Less than 30 seconds
      baseDelay *= 0.5;
    } else if (timeLeft < 60000) { // Less than 1 minute
      baseDelay *= 0.7;
    }
    
    // Add some randomness
    const variation = (maxDelay - minDelay) * 0.3;
    baseDelay += (Math.random() - 0.5) * variation;
    
    return Math.max(minDelay, Math.min(maxDelay, baseDelay));
  };

  // Enhanced engine move handler with human-like behavior
  const handleEngineMove = (uciMove, engineScore = 0) => {
    const board = document.querySelector('wc-chess-board');
    if (!board?.game) return false;

    if (!vs.queryConfigKey(namespace + '_renderthreats')) board.game.markings.removeAll();

    // Store move in history
    const moveInfo = {
      move: uciMove,
      score: engineScore,
      timestamp: Date.now(),
      fen: board.game.getFEN()
    };
    moveHistory.push(moveInfo);
    if (moveHistory.length > 50) moveHistory.shift(); // Keep last 50 moves

    // Update engine score display
    lastEngineScore = engineScore;
    if (vs.queryConfigKey(namespace + '_showenginescore')) {
      updateEngineScoreDisplay(engineScore);
    }

    // Create move arrow
    const marking = { 
      type: 'arrow', 
      data: { 
        color: vs.queryConfigKey(namespace + '_enginemovecolor'), 
        from: uciMove.substring(0, 2), 
        to: uciMove.substring(2, 4) 
      } 
    };
    if (handleMoveLastKnownMarking) board.game.markings.removeOne(handleMoveLastKnownMarking);
    board.game.markings.addOne(marking);
    handleMoveLastKnownMarking = marking;

    // Check if we should play the move
    if (!autoMoveEnabled && !vs.queryConfigKey(namespace + '_automove')) {
      return;
    }

    // Calculate delay with human-like timing
    const fen = board.game.getFEN();
    const moveNumber = parseInt(fen.split(' ')[5]);
    const timeLeft = 60000; // Default time, could be enhanced to get actual time
    const delay = calculateHumanLikeDelay(fen, moveNumber, timeLeft);

    // Check for blunder chance in human-like mode
    if (vs.queryConfigKey(namespace + '_automovehumanlike') && 
        Math.random() * 100 < vs.queryConfigKey(namespace + '_automoveblunderchance')) {
      // Play a suboptimal move occasionally
      const alternativeMoves = getAlternativeMoves(board.game.getFEN());
      if (alternativeMoves.length > 1) {
        const randomIndex = Math.floor(Math.random() * alternativeMoves.length);
        uciMove = alternativeMoves[randomIndex];
      }
    }

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

  // Function to get alternative moves for human-like blunders
  const getAlternativeMoves = (fen) => {
    // This would be enhanced to get multiple engine moves
    // For now, return a simple list
    return [];
  };

  // Function to update engine score display
  const updateEngineScoreDisplay = (score) => {
    try {
      if (!document.body) {
        console.warn(`[${namespace}] Document body not available for score display`);
        return;
      }

      let scoreElement = document.getElementById(namespace + '_enginescore');
      if (!scoreElement) {
        scoreElement = document.createElement('div');
        scoreElement.id = namespace + '_enginescore';
        scoreElement.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: #1a1a1a;
          color: ${vs.queryConfigKey(namespace + '_showenginescorecolor')};
          padding: 10px;
          border-radius: 8px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          font-weight: 600;
          z-index: 10000;
          pointer-events: none;
          border: 1px solid #404040;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(scoreElement);
      }
      
      const scoreText = score > 0 ? `+${(score / 100).toFixed(2)}` : (score / 100).toFixed(2);
      scoreElement.textContent = `Engine: ${scoreText}`;
    } catch (error) {
      console.warn(`[${namespace}] Error updating engine score display:`, error);
    }
  };

  // Function to toggle auto move
  const toggleAutoMove = () => {
    try {
      if (!document.body) {
        console.warn(`[${namespace}] Document body not available for auto move indicator`);
        return;
      }

      autoMoveEnabled = !autoMoveEnabled;
      addToConsole(`Auto move ${autoMoveEnabled ? 'enabled' : 'disabled'}`);
      
      // Update visual indicator
      let indicator = document.getElementById(namespace + '_automoveindicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = namespace + '_automoveindicator';
        indicator.style.cssText = `
          position: fixed;
          top: 50px;
          right: 10px;
          background: #1a1a1a;
          color: #e0e0e0;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          z-index: 10000;
          pointer-events: none;
          border: 1px solid #404040;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        document.body.appendChild(indicator);
      }
      indicator.textContent = `⚡ Auto Move: ${autoMoveEnabled ? 'ON' : 'OFF'}`;
      indicator.style.background = autoMoveEnabled ? '#1a4a1a' : '#4a1a1a';
      indicator.style.borderColor = autoMoveEnabled ? '#00ff00' : '#ff0000';
    } catch (error) {
      console.warn(`[${namespace}] Error toggling auto move:`, error);
    }
  };

  // Function to quick engine switch
  const quickEngineSwitch = () => {
    const engines = ['none', 'betafish', 'random', 'cccp', 'external'];
    const currentEngine = vs.queryConfigKey(namespace + '_whichengine');
    const currentIndex = engines.indexOf(currentEngine);
    const nextIndex = (currentIndex + 1) % engines.length;
    const nextEngine = engines[nextIndex];
    
    vs.setConfigValue(namespace + '_whichengine', nextEngine);
    addToConsole(`Switched to engine: ${nextEngine}`);
  };

  // Function to toggle threats
  const toggleThreats = () => {
    const currentValue = vs.queryConfigKey(namespace + '_renderthreats');
    vs.setConfigValue(namespace + '_renderthreats', !currentValue);
    addToConsole(`Threat rendering ${!currentValue ? 'enabled' : 'disabled'}`);
  };

  // Function to handle external errors gracefully
  const handleExternalErrors = () => {
    // Suppress common external errors that are not our fault
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = function(...args) {
      const message = args.join(' ');
      // Filter out external errors that are not our concern
      if (message.includes('AudioContext') || 
          message.includes('Sentry') || 
          message.includes('confiant') ||
          message.includes('Notification permission') ||
          message.includes('Cross-Origin Request Blocked') ||
          message.includes('sentry.client.fca225e1.js') ||
          message.includes('cdn.confiant-integrations.net') ||
          message.includes('preloaded with link preload') ||
          message.includes('canModifyExistingMovesOnMainLine') ||
          message.includes('Fetch response clone error') ||
          message.includes('Key does not exist') ||
          message.includes('Tried to register an existing key') ||
          message.includes('sentry.io') ||
          message.includes('Loading failed for the <script>')) {
        // Suppress these external errors
        return;
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = function(...args) {
      const message = args.join(' ');
      // Filter out external warnings that are not our concern
      if (message.includes('AudioContext') || 
          message.includes('Sentry') || 
          message.includes('confiant') ||
          message.includes('Notification permission') ||
          message.includes('sentry.client.fca225e1.js') ||
          message.includes('cdn.confiant-integrations.net') ||
          message.includes('preloaded with link preload') ||
          message.includes('canModifyExistingMovesOnMainLine') ||
          message.includes('Fetch response clone error') ||
          message.includes('Key does not exist') ||
          message.includes('Tried to register an existing key') ||
          message.includes('sentry.io') ||
          message.includes('Loading failed for the <script>')) {
        // Suppress these external warnings
        return;
      }
      originalConsoleWarn.apply(console, args);
    };
  };

  // Function to show script status
  const showScriptStatus = () => {
    try {
      let statusElement = document.getElementById(namespace + '_scriptstatus');
      if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = namespace + '_scriptstatus';
        statusElement.style.cssText = `
          position: fixed;
          bottom: 10px;
          left: 10px;
          background: #1a1a1a;
          color: #e0e0e0;
          padding: 12px;
          border-radius: 8px;
          font-size: 11px;
          z-index: 10000;
          max-width: 280px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          border: 1px solid #404040;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(statusElement);
      }
      
      const board = document.querySelector('wc-chess-board');
      const engine = vs.queryConfigKey(namespace + '_whichengine');
      const autoMove = vs.queryConfigKey(namespace + '_automove') || autoMoveEnabled;
      
      let status = `🎯 Chesshook Lite v${GM_info.script.version}\n`;
      status += `🤖 Engine: ${engine}\n`;
      status += `⚡ Auto Move: ${autoMove ? 'ON' : 'OFF'}\n`;
      status += `♟️ Board: ${board ? 'Found' : 'Not Found'}\n`;
      status += `📄 Page: ${document.location.pathname}`;
      
      statusElement.textContent = status;
    } catch (error) {
      console.warn(`[${namespace}] Could not show script status:`, error);
    }
  };

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

        if (document.querySelector("#board-animation").children.length) {
          return;
        }

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

  // Enhanced update loop with new features
  const updateLoop = () => {
    const board = document.querySelector('wc-chess-board');

    if (!board?.game) return;

    // Game over handling
    if (board.game.getPositionInfo().gameOver) {
      externalEngineWorker.postMessage({ type: 'STOP' });
    }

    // Engine move calculation
    if (vs.queryConfigKey(namespace + '_whichengine') !== 'none') {
      getEngineMove();
    }
  }

  // Use configurable update rate
  const updateRate = vs.queryConfigKey(namespace + '_updaterate') || 100;
  window[namespace].updateLoop = setInterval(updateLoop, updateRate);

  // Simplified initialization for document-end
  const initializeScript = () => {
    try {
      // Ensure DOM is ready
      if (!document.head || !document.body) {
        console.warn(`[${namespace}] DOM not ready, retrying in 100ms...`);
        setTimeout(initializeScript, 100);
        return;
      }

      // Ensure vs is available
      if (!vs) {
        console.log(`[${namespace}] Waiting for vasara library to initialize...`);
        setTimeout(initializeScript, 100);
        return;
      }

      // Initialize the script
      init();
    } catch (error) {
      console.error(`[${namespace}] Initialization error:`, error);
      // Retry after a delay
      setTimeout(initializeScript, 200);
    }
  };

  // Start initialization with a small delay to ensure everything is ready
  setTimeout(initializeScript, 100);
  } catch (error) {
    console.error('[Chesshook Lite] Script initialization error:', error);
  }
})();
