// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-highlight",
    title: "Save Highlight",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-highlight" && info.selectionText) {
    const highlightData = {
      text: info.selectionText,
      url: tab.url,
      title: tab.title,
      favicon: tab.favIconUrl
    };

    try {
      // Fetch documents to show in the list
      const response = await fetch('http://localhost:3000/api/documents');
      const documents = await response.json();

      // Send message to content script to show modal
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_SAVE_MODAL',
        data: highlightData,
        documents: documents
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Fallback: just save without document if API fails or just show error
      showToast(tab.id, 'Error connecting to app', true);
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SAVE_HIGHLIGHT') {
    handleSaveHighlight(request.data, request.documentId, request.newDocumentTitle, sender.tab.id);
  }
});

async function handleSaveHighlight(data, documentId, newDocumentTitle, tabId) {
  try {
    let finalDocumentId = documentId;

    // If creating a new document
    if (newDocumentTitle) {
      const docResponse = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDocumentTitle })
      });

      if (!docResponse.ok) throw new Error('Failed to create document');
      const newDoc = await docResponse.json();
      finalDocumentId = newDoc.id;
    }

    // Save highlight
    const response = await fetch('http://localhost:3000/api/highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        documentId: finalDocumentId
      })
    });

    if (response.ok) {
      showToast(tabId, 'Highlight saved!');
    } else {
      showToast(tabId, 'Failed to save highlight', true);
    }
  } catch (error) {
    console.error('Error saving highlight:', error);
    showToast(tabId, 'Error saving highlight', true);
  }
}

function showToast(tabId, message, isError = false) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (msg, err) => {
      const toast = document.createElement('div');
      toast.textContent = msg;
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        backgroundColor: err ? '#ef4444' : '#10b981',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: '2147483647', // Max z-index
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: '0',
        transform: 'translateY(10px)',
        pointerEvents: 'none'
      });

      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    },
    args: [message, isError]
  });
}
