# Frontitude Auto Exporter

A Chrome extension to automate exporting projects from Frontitude using a list of project links from an Excel file.

## Features

- **Excel Import:** Upload an Excel file and select the sheet containing your Frontitude project links.
- **Automated Export:** Automatically navigates to each project and triggers the export process.
- **Progress & Logs:** View export progress and logs in a user-friendly popup UI.
- **Force Stop:** Stop the export process at any time.
- **Clear Logs:** Easily clear the log output.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/frontitude-auto-export.git
cd frontitude-auto-export
```

### 2. Load the Extension in Chrome

1. Open `chrome://extensions/` in your browser.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this project folder.

### 3. Usage

1. Click the extension icon to open the popup.
2. Select your Excel file containing Frontitude project links.
3. Choose the relevant sheet.
4. Click **Start Export** to begin.
5. Monitor progress and logs in the popup.

## File Structure

- `popup.html` – Main UI for the extension popup.
- `popup.js` – Handles UI logic and user interactions.
- `background.js` – Manages background tasks and communication.
- `content.js` – Injected into Frontitude pages to automate export.
- `xlsx.full.min.js` – Excel file parsing library.

## Screenshots

![Popup UI](./screenshot.png)

## Development

- Built with JavaScript, HTML, and CSS.
- Uses [SheetJS](https://sheetjs.com/) for Excel parsing.
- Chrome Extensions Manifest V3.

## License

MIT

---

**Note:** This project is not affiliated with or endorsed by Frontitude.