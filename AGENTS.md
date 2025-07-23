# Agent Guidelines for Youssef Ali Score Keeper

## Project Overview
This is a Progressive Web App (PWA) for multi-player score tracking, built with vanilla JavaScript, HTML, and CSS.

## Build/Test/Lint Commands
- No build system configured - direct file serving
- No test framework configured
- No linting tools configured
- To run: Open `index.html` in browser or serve via local server

## Code Style Guidelines
- **Language**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Classes**: Use PascalCase (e.g., `GameManager`, `ScoreKeeper`)
- **Methods**: Use camelCase (e.g., `addPlayer`, `saveGameState`)
- **Variables**: Use camelCase for variables, UPPER_CASE for constants
- **Naming**: Use descriptive names (e.g., `currentRoundInputs`, `midGameControlsInitialized`)
- **Error Handling**: Use try-catch blocks, log errors to console
- **Storage**: Use localStorage with prefixed keys (`yusufali-*`)
- **DOM**: Cache DOM elements in constructor, use getElementById
- **Events**: Use arrow functions for event handlers to maintain `this` context
- **Comments**: Minimal comments, focus on self-documenting code

## Architecture
- Single-page application with screen-based navigation
- GameManager class for data persistence and game lifecycle
- ScoreKeeper class for UI and game logic
- Service Worker for PWA functionality