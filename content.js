chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'performExport') {
    performExportSequence()
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error('Export error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

async function performExportSequence() {
  try {

    // Step 2: Click Export button
    await clickExportButton();
    await wait(1000);

    // Step 3: Select JSON radio button
    await clickJsonRadio();
    await wait(500);

    // Step 3.5: Deselect specific checkbox
    await deselectMetadataCheckbox();
    await wait(250);

    // Step 4: Check "Include translation" checkbox
    await clickIncludeTranslation();
    await wait(250);

    // Step 5: Click final export button
    await clickExportAsJson();
    await wait(2000);

    return true;
  } catch (error) {
    console.error('Error in export sequence:', error);
    throw error;
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickExportButton() {
  const exportButtons = Array.from(document.querySelectorAll('button.app-button.button.clear'));
  const exportButton = exportButtons.find(btn => btn.textContent.includes('Export'));
  
  if (!exportButton) {
    throw new Error('Export button not found');
  }
  exportButton.click();
  console.log('Clicked export button');
}

async function clickJsonRadio() {
  const jsonRadio = document.querySelector('input[type="radio"][name="exportType"][value="json"]');
  if (!jsonRadio) {
    throw new Error('JSON radio button not found');
  }
  jsonRadio.click();
  console.log('Selected JSON format');
}

async function deselectMetadataCheckbox() {
  // Look for the "Include metadata" text and find the associated checkbox
  const labels = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent.includes('Include metadata') && 
    el.children.length === 0 // Only text nodes, not parent containers
  );
  if (labels.length > 0) {
    // Find the closest checkbox to this label
    let current = labels[0];
    while (current) {
      const checkbox = current.querySelector('.checkbox.blue-theme');
      if (checkbox) {
        // Only click if it is selected
        if (checkbox.classList.contains('selected')) {
          checkbox.click();
          console.log('Deselected the metadata checkbox');
          return;
        } else {
          console.log('Metadata checkbox already deselected');
          return;
        }
      }
      current = current.parentElement;
    }
  }
  // Fallback: try to find by looking for the checkbox near "Include metadata" text
  const allElements = document.querySelectorAll('.checkbox.blue-theme');
  for (let i = 0; i < allElements.length; i++) {
    const elem = allElements[i];
    const parent = elem.closest('*');
    if (parent && parent.innerText.includes('Include metadata')) {
      if (elem.classList.contains('selected')) {
        elem.click();
        console.log('Deselected the metadata checkbox (fallback)');
        return;
      } else {
        console.log('Metadata checkbox already deselected (fallback)');
        return;
      }
    }
  }
  console.warn('Metadata checkbox to deselect not found');
}

async function clickIncludeTranslation() {
  // Find all option sections
  const allText = document.body.innerText;
  
  // Look for the "Include translations" text and find the associated checkbox
  const labels = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent.includes('Include translations') && 
    el.children.length === 0 // Only text nodes, not parent containers
  );
  
  if (labels.length > 0) {
    // Find the closest checkbox to this label
    let current = labels[0];
    while (current) {
      const checkbox = current.querySelector('.checkbox.blue-theme');
      if (checkbox) {
        // Check if it's already checked
        const checkmark = checkbox.querySelector('.checkmark');
        if (checkmark && checkmark.style.display !== 'none') {
          console.log('Include translation already checked');
          return;
        }
        checkbox.click();
        console.log('Clicked include translation checkbox');
        return;
      }
      current = current.parentElement;
    }
  }
  
  // Fallback: try to find by looking for the checkbox near "Include translations" text
  const allElements = document.querySelectorAll('.checkbox.blue-theme');
  for (let i = 0; i < allElements.length; i++) {
    const elem = allElements[i];
    const parent = elem.closest('*');
    if (parent && parent.innerText.includes('Include translations')) {
      elem.click();
      console.log('Clicked include translation checkbox (fallback)');
      return;
    }
  }
  
  throw new Error('Include translation checkbox not found');
}

async function clickExportAsJson() {
  const exportButtons = Array.from(document.querySelectorAll('button.app-button.button.primary'));
  const finalButton = exportButtons.find(btn => btn.textContent.includes('Export as JSON'));
  
  if (!finalButton) {
    throw new Error('Export as JSON button not found');
  }
  finalButton.click();
  console.log('Clicked final export button');
}