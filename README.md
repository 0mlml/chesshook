# Chesshook Enhanced 🚀

**Enhanced Chess.com Cheat Userscript with Advanced Features**

A powerful and feature-rich userscript for chess.com that provides advanced chess analysis, automation, and enhancement tools. This enhanced version includes human-like behavior simulation, extensive customization options, and professional-grade features.

## 🎯 Key Features

### 🧠 **Advanced Engine Integration**
- **Multiple Engine Support**: Betafish, Random, CCCP, External UCI engines
- **Human-like Move Timing**: Simulates realistic thinking patterns
- **Blunder Simulation**: Occasional suboptimal moves for authenticity
- **Positional vs Tactical Weighting**: Customizable move selection strategy
- **Multi-PV Analysis**: Analyze multiple candidate moves simultaneously

### 🎮 **Enhanced Automation**
- **Auto Move on Keybind**: Press `Alt+M` to instantly play the best move
- **Toggle Auto Move**: `Alt+T` to enable/disable continuous auto play
- **Quick Engine Switch**: `Alt+E` to cycle through available engines
- **Human-like Timing**: Variable delays based on position complexity
- **Smart Move Selection**: Position-aware move timing and selection

### 🎨 **Visual Enhancements**
- **Enhanced Threat Rendering**: Pins, undefended pieces, mates with custom colors
- **Blinking Threats**: Animated threat indicators for better visibility
- **Engine Score Display**: Real-time evaluation scores on screen
- **Opening Name Display**: Shows current opening names
- **Move History Tracking**: Complete game analysis with evaluations
- **Customizable Colors**: Full color customization for all visual elements

### 🔧 **Advanced Configuration**
- **50+ Settings**: Extensive customization options
- **Performance Tuning**: Adjustable update rates and engine limits
- **Debug Mode**: Comprehensive logging and diagnostics
- **Auto Save Games**: Automatic game storage to local storage
- **Puzzle Enhancements**: Auto-next, hints, and timing controls

### 📊 **Analysis Tools**
- **Game Statistics**: Win rates, move analysis, performance tracking
- **Export Capabilities**: PGN export, log export, statistics export
- **Real-time Evaluation**: Live position assessment
- **Move History**: Complete game replay with engine analysis
- **Performance Metrics**: Detailed performance analytics

## 🚀 Installation

1. **Install a userscript manager**:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Violentmonkey](https://violentmonkey.github.io/get-it/)
   - [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)

2. **Install the script**:
   - Create a new script in your userscript manager
   - Copy the contents of `chesshook.user.js`
   - Save and enable the script

3. **Navigate to chess.com** and enjoy!

## 🎮 **Hotkeys & Controls**

### **Primary Controls**
- `Alt+K` - Open Configuration Window
- `Alt+C` - Open Enhanced Console
- `Alt+L` - Open Exploits & Tools Window
- `Alt+R` - Refresh/Reset Script

### **Game Controls**
- `Alt+M` - **Auto Move** (Play best move instantly)
- `Alt+T` - **Toggle Auto Move** (Enable/disable continuous play)
- `Alt+E` - **Quick Engine Switch** (Cycle through engines)
- `Alt+H` - **Toggle Threats** (Show/hide threat rendering)
- `Alt+S` - **Show Status** (Display script status and current settings)

### **Visual Controls**
- `Alt+L` - Clear arrows and markings
- `Alt+U` - Toggle UI elements

## ⚙️ **Configuration Guide**

### **Engine Settings**
- **Which Engine**: Choose from Betafish, Random, CCCP, External, or None
- **Engine Depth Limit**: Maximum search depth (1-50)
- **Engine Node Limit**: Maximum nodes to search (0 = unlimited)
- **Multi-PV Lines**: Number of alternative moves to analyze (1-10)
- **Betafish Thinking Time**: Time allocation for Betafish engine (0-20000ms)

### **Auto Move Settings**
- **Auto Move**: Enable automatic move playing
- **Human-like Move Timing**: Simulate realistic thinking patterns
- **Min/Max Delay**: Timing range for human-like behavior (500-30000ms)
- **Blunder Chance**: Percentage chance to play suboptimal moves (0-50%)
- **Positional Weight**: Balance between tactical and positional play (0-100%)

### **Visual Settings**
- **Render Threats**: Show pins, undefended pieces, and mates
- **Threat Colors**: Customize colors for different threat types
- **Threat Opacity**: Adjust transparency (10-100%)
- **Blinking Threats**: Animated threat indicators
- **Engine Score Display**: Show real-time evaluations
- **Opening Name Display**: Display current opening names

### **Puzzle Settings**
- **Puzzle Mode**: Automatic puzzle solving
- **API Puzzle Mode**: Use chess.com API for puzzles
- **Auto Next Puzzle**: Automatically proceed to next puzzle
- **Puzzle Delay**: Delay before next puzzle (0-5000ms)
- **Puzzle Hints**: Show hints for difficult puzzles

### **Performance Settings**
- **Update Rate**: Script update frequency (50-1000ms)
- **Debug Mode**: Enable detailed logging
- **Auto Save Games**: Save games to local storage
- **Show Move History**: Track and display move history

## 🎯 **Advanced Features**

### **Human-like Behavior**
The enhanced version includes sophisticated human-like behavior simulation:

- **Variable Thinking Time**: Longer in complex positions, shorter in simple ones
- **Position Awareness**: Different timing for opening, middlegame, and endgame
- **Time Pressure Response**: Faster moves when time is limited
- **Blunder Simulation**: Occasional suboptimal moves for authenticity
- **Positional vs Tactical Balance**: Customizable move selection strategy

### **Enhanced Threat Rendering**
Advanced threat detection and visualization:

- **Pin Detection**: Shows pinned pieces with custom colors
- **Undefended Pieces**: Highlights pieces without protection
- **Underdefended Pieces**: Shows pieces with insufficient protection
- **Mate Threats**: Displays checkmate opportunities
- **Blinking Animation**: Animated threat indicators
- **Custom Opacity**: Adjustable transparency levels

### **Game Analysis Tools**
Comprehensive analysis and statistics:

- **Real-time Evaluation**: Live position assessment
- **Move History**: Complete game replay with engine analysis
- **Performance Tracking**: Win rates, average scores, move quality
- **Game Export**: PGN export with annotations
- **Statistics Dashboard**: Detailed performance analytics

### **Puzzle Enhancements**
Advanced puzzle solving capabilities:

- **Automatic Solving**: Instant puzzle solutions
- **API Integration**: Use chess.com's puzzle API
- **Auto Progression**: Automatic puzzle navigation
- **Timing Control**: Customizable solving delays
- **Hint System**: Assistance for difficult puzzles

## 🔧 **Technical Details**

### **Supported Engines**
- **Betafish**: High-strength JavaScript engine (2300+ ELO)
- **Random**: Random legal move generator
- **CCCP**: Checkmate, Check, Capture, Push engine
- **External**: Any UCI-compliant engine via intermediary

### **Browser Compatibility**
- Chrome/Chromium (Recommended)
- Firefox
- Safari
- Edge

### **Performance Optimization**
- Configurable update rates
- Efficient DOM manipulation
- Memory management for long sessions
- Background processing for engine analysis

## 🛡️ **Safety & Ethics**

### **Detection Avoidance**
- Human-like timing patterns
- Variable move selection
- Realistic thinking delays
- Position-aware behavior

### **Legitimate Use Cases**
- Learning and analysis
- Training and practice
- Game review and improvement
- Opening study and preparation

### **Responsible Usage**
- Use for educational purposes
- Respect fair play policies
- Avoid competitive abuse
- Maintain sportsmanship

## 📈 **Performance Metrics**

The enhanced version tracks comprehensive performance metrics:

- **Win Rate Analysis**: Overall and engine-specific win rates
- **Move Quality**: Average engine evaluation scores
- **Game Statistics**: Total games, wins, losses, draws
- **Performance Trends**: Improvement over time
- **Engine Comparison**: Performance across different engines

## 🔄 **Updates & Maintenance**

### **Version History**
- **v3.0**: Complete rewrite with 50+ new features
- **v2.3**: Original version with basic functionality
- **v2.0**: Initial release

### **Future Enhancements**
- Machine learning integration
- Advanced position analysis
- Cloud engine support
- Social features
- Tournament mode

## 🤝 **Contributing**

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ **Disclaimer**

This tool is for educational and analytical purposes only. Users are responsible for complying with chess.com's terms of service and fair play policies. The developers are not responsible for any consequences of misuse.

## 🆘 **Support**

For support and questions:

- Check the configuration guide
- Review the console logs
- Enable debug mode for detailed information
- Export logs for troubleshooting

### **Common Console Errors**

The following errors are **NOT** from this script and can be safely ignored:

- **AudioContext errors**: Chess.com's audio system trying to start automatically
- **Sentry errors**: Chess.com's error tracking service having issues
- **CORS errors**: External services (Confiant, Sentry) having network issues
- **Notification permission errors**: Browser blocking chess.com's notification requests

These are chess.com's internal issues and do not affect the functionality of Chesshook Enhanced.

### **Troubleshooting**

1. **Script not loading**: Check that your userscript manager is enabled
2. **Hotkeys not working**: Ensure no other extensions are using the same hotkeys
3. **Engine not responding**: Check engine settings in the configuration window
4. **Visual elements missing**: Try refreshing the page or toggling features on/off
5. **Performance issues**: Adjust the update rate in settings

---

**Chesshook Enhanced** - Making chess analysis accessible and powerful! 🎯♟️