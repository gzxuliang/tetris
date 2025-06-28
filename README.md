[简体中文](README.zh-CN.md)

# Modern Minimalist Tetris

A classic Tetris web game implemented using HTML, CSS, and JavaScript with modern design and internationalization support.

## Features

- 🎮 Classic Tetris gameplay
- 🌍 Multi-language support (English/简体中文)
- 🎨 Modern minimalist design
- 📱 Responsive layout
- ⌨️ Keyboard controls
- 🏆 Score and level tracking

## How to Run

### Quick Start (Recommended)
Simply **double-click the `index.html` file** to open it in your browser. All features including language switching work perfectly!

### Alternative Methods
If you prefer to use a local server:

**Using Batch File:**
1. Double-click `start_tetris.bat`
2. Navigate to `http://localhost:8000` in your browser

**Manual Server Setup:**
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000`

## Game Controls

- **Move**: `←` / `→` Arrow keys
- **Accelerate**: `↓` Arrow key
- **Rotate**: `↑` Arrow key or `X`
- **Hard Drop**: `Space`
- **Pause**: `P`

## Language Switching

The game automatically detects your browser's language preference on first visit:
- Chinese browsers (zh-*) will default to 简体中文
- Other browsers will default to English

You can manually switch languages by clicking the language links in the top-right corner. Your language preference will be saved automatically and override the browser detection.

## Directory Structure

```
.
├── index.html              # Main HTML file
├── start_tetris.bat        # Quick start batch file
├── LICENSE                 # License file
├── README.md              # English documentation
├── README.zh-CN.md        # Chinese documentation
├── locales/               # Language files (optional, for reference)
│   ├── en.json           # English translations
│   └── zh-CN.json        # Chinese translations
└── src/
    ├── css/
    │   └── style.css     # Game styles
    └── js/
        └── script.js     # Game logic with embedded i18n data
```

## Requirements

- Modern web browser with JavaScript support
- Python 3.x (optional, only needed if using HTTP server)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
