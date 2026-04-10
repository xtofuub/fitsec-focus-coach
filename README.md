# Fitsec Focus Coach

A Pomodoro-style focus timer built as an Electron desktop app.
<img width="1095" height="721" alt="image" src="https://github.com/user-attachments/assets/3383b9af-5ae1-434f-bb29-edf31fdbff44" />

---

## Features

### Cycle Editor
Configure your work/break sequence before starting a session.
- Toggle between short and long breaks
- Add or remove cycle segments
- See total session duration in real time

### Timer
- Automatic phase transitions with optional auto-start for work and break segments
- Manual numeric input or slider for setting durations
- End-of-cycle prompt when the session completes

### Session History
- Log qualitative notes per session ("did it go well?")
- View daily summaries
- Delete individual session entries

---

## Stack

- **Framework**: React + Vite
- **Shell**: Electron
- **Animation**: Framer Motion
- **Styling**: Vanilla CSS + Tailwind
- **Icons**: Lucide React

---

## Installation

**Requirements**: Node.js v18+, npm

### Development
```bash
npm run electron:dev
```

### Build (Windows)
```bash
npm install
npm run make:exe
```

Output is in `release/`:
- `release/Fitsec Focus Coach Setup 1.0.0.exe` — NSIS installer
- `release/win-unpacked/Fitsec Focus Coach.exe` — portable executable

> Note: `public/icon.ico` must be a valid multi-size `.ico` file for the build to succeed.
