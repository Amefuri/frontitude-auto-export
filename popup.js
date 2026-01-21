document.getElementById('forceStopBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'forceStopExport' });
  addLog('Force Stop requested.');
});
// --- Console Log UI Logic ---
const logs = [];

function renderLogs() {
  const logContainer = document.getElementById('log-container');
  logContainer.innerHTML = '';
  logs.forEach(log => {
    const div = document.createElement('div');
    div.textContent = log;
    logContainer.appendChild(div);
  });
  // Auto-scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;
}

function addLog(message) {
  logs.push(message);
  renderLogs();
}

document.getElementById('clear-log-btn').addEventListener('click', () => {
  logs.length = 0;
  renderLogs();
});

// Listen for log messages from background.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'log' && message.message) {
    addLog(message.message);
  }
});
let projectLinks = [];
let workbook = null;
let sheetNames = [];
let selectedSheet = null;


document.getElementById('excelFile').addEventListener('change', handleFileSelect);
document.getElementById('startBtn').addEventListener('click', startExport);
document.getElementById('sheetSelect').addEventListener('change', handleSheetSelect);

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) {
    showStatus('No file selected', 'error');
    document.getElementById('sheetSelectGroup').style.display = 'none';
    return;
  }

  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    showStatus('Please select a valid Excel file (.xlsx or .xls)', 'error');
    document.getElementById('sheetSelectGroup').style.display = 'none';
    return;
  }

  if (typeof XLSX === 'undefined') {
    showStatus('XLSX library not loaded. Please check your extension setup.', 'error');
    document.getElementById('sheetSelectGroup').style.display = 'none';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      workbook = XLSX.read(data, {type: 'array'});
      sheetNames = workbook.SheetNames;
      // Populate dropdown
      const sheetSelect = document.getElementById('sheetSelect');
      sheetSelect.innerHTML = '';
      sheetNames.forEach((name, idx) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sheetSelect.appendChild(opt);
      });
      document.getElementById('sheetSelectGroup').style.display = '';
      // Auto-select first sheet
      selectedSheet = sheetNames[0];
      sheetSelect.value = selectedSheet;
      loadLinksFromSheet(selectedSheet);
    } catch (error) {
      showStatus('Error reading Excel file: ' + error.message, 'error');
      document.getElementById('sheetSelectGroup').style.display = 'none';
      document.getElementById('startBtn').disabled = true;
    }
  };
  reader.readAsArrayBuffer(file);
}

function handleSheetSelect(e) {
  selectedSheet = e.target.value;
  loadLinksFromSheet(selectedSheet);
}

function loadLinksFromSheet(sheetName) {
  if (!workbook || !sheetName) {
    projectLinks = [];
    document.getElementById('startBtn').disabled = true;
    return;
  }
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1});
  // Use row 3 (index 2) as header
  const headerRow = jsonData[1] || [];
  const linkColIdx = headerRow.findIndex(h => h && h.toString().toLowerCase() === 'link');

  showStatus(headerRow);

  if (linkColIdx === -1) {
    // showStatus('No "Link" column found in row 3 of sheet', 'error');
    projectLinks = [];
    document.getElementById('startBtn').disabled = true;
    return;
  }
  // Data starts after header (row 4, index 3)
  projectLinks = jsonData.slice(2)
    .map(row => row[linkColIdx])
    .filter(link => link && typeof link === 'string' && link.trim().length > 0);
  if (projectLinks.length === 0) {
    showStatus('No links found in "Link" column', 'error');
    document.getElementById('startBtn').disabled = true;
  } else {
    showStatus(`Loaded ${projectLinks.length} project links from sheet "${sheetName}"`, 'success');
    document.getElementById('startBtn').disabled = false;
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status-${type}`;
  statusDiv.style.display = 'block';
}

function showProgress(current, total) {
  const progressDiv = document.getElementById('progress');
  progressDiv.textContent = `Processing: ${current} of ${total}`;
  progressDiv.style.display = 'block';
}

async function startExport() {
  if (projectLinks.length === 0) {
    showStatus('Please select an Excel file first', 'error');
    return;
  }

  document.getElementById('startBtn').disabled = true;
  showStatus('Starting export process...', 'info');

  // Store links in chrome storage and send message to background script
  await chrome.storage.local.set({ 
    projectLinks: projectLinks,
    currentIndex: 0,
    totalLinks: projectLinks.length
  });

  // Send message to background script to start processing
  chrome.runtime.sendMessage({ action: 'startExport' });

  // Listen for progress updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'progress') {
      showProgress(message.current, message.total);
      showStatus(`Exporting project ${message.current} of ${message.total}`, 'info');
    } else if (message.action === 'complete') {
      showStatus('All exports completed!', 'success');
      document.getElementById('startBtn').disabled = false;
    } else if (message.action === 'error') {
      showStatus('Error: ' + message.error, 'error');
    }
  });
}