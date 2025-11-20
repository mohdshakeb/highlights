// content.js

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SHOW_SAVE_MODAL') {
        showSaveModal(request.data, request.documents);
    }
});

function showSaveModal(highlightData, documents) {
    // Remove existing modal if any
    const existingModal = document.getElementById('highlight-extension-modal-host');
    if (existingModal) existingModal.remove();

    // Create host for Shadow DOM
    const host = document.createElement('div');
    host.id = 'highlight-extension-modal-host';
    host.style.position = 'fixed';
    host.style.zIndex = '2147483647';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '0';
    host.style.height = '0';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Styles
    const style = document.createElement('style');
    style.textContent = `
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(2px);
      animation: fadeIn 0.2s ease;
    }
    .modal {
      background: white;
      width: 400px;
      max-width: 90vw;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .header {
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #6b7280;
      padding: 4px;
      border-radius: 4px;
    }
    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }
    .body {
      padding: 20px;
    }
    .preview {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      margin-bottom: 16px;
      font-size: 14px;
      color: #374151;
      line-height: 1.5;
      max-height: 100px;
      overflow-y: auto;
      border-left: 3px solid #3b82f6;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    .select, .input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      color: #111827;
      box-sizing: border-box;
      outline: none;
    }
    .select:focus, .input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    .footer {
      padding: 16px 20px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
    }
    .btn-secondary {
      background: white;
      border-color: #d1d5db;
      color: #374151;
    }
    .btn-secondary:hover {
      background: #f3f4f6;
    }
    .btn-primary {
      background: #111827;
      color: white;
    }
    .btn-primary:hover {
      background: #000;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
    shadow.appendChild(style);

    // Modal HTML
    const container = document.createElement('div');
    container.className = 'overlay';

    // Document options
    const docOptions = documents.map(d => `<option value="${d.id}">${d.title}</option>`).join('');

    container.innerHTML = `
    <div class="modal">
      <div class="header">
        <h3 class="title">Save Highlight</h3>
        <button class="close-btn" id="close-btn">✕</button>
      </div>
      <div class="body">
        <div class="preview">
          "${highlightData.text.substring(0, 150)}${highlightData.text.length > 150 ? '...' : ''}"
        </div>
        
        <div class="form-group">
          <label class="label">Save to Document</label>
          <select class="select" id="doc-select">
            <option value="">-- Independent Highlight --</option>
            ${docOptions}
            <option value="new">+ Create New Document</option>
          </select>
        </div>

        <div class="form-group" id="new-doc-group" style="display: none;">
          <label class="label">New Document Title</label>
          <input type="text" class="input" id="new-doc-title" placeholder="Enter document title">
        </div>
      </div>
      <div class="footer">
        <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="save-btn">Save Highlight</button>
      </div>
    </div>
  `;

    shadow.appendChild(container);

    // Event Listeners
    const close = () => host.remove();

    shadow.getElementById('close-btn').onclick = close;
    shadow.getElementById('cancel-btn').onclick = close;

    // Handle click outside
    container.onclick = (e) => {
        if (e.target === container) close();
    };

    // Handle select change
    const docSelect = shadow.getElementById('doc-select');
    const newDocGroup = shadow.getElementById('new-doc-group');
    const newDocTitle = shadow.getElementById('new-doc-title');

    docSelect.onchange = () => {
        if (docSelect.value === 'new') {
            newDocGroup.style.display = 'block';
            newDocTitle.focus();
        } else {
            newDocGroup.style.display = 'none';
        }
    };

    // Handle Save
    shadow.getElementById('save-btn').onclick = () => {
        const selectedDoc = docSelect.value;
        let newTitle = null;
        let docId = null;

        if (selectedDoc === 'new') {
            newTitle = newDocTitle.value.trim();
            if (!newTitle) {
                newDocTitle.style.borderColor = '#ef4444';
                return;
            }
        } else if (selectedDoc) {
            docId = selectedDoc;
        }

        // Send message to background
        chrome.runtime.sendMessage({
            type: 'SAVE_HIGHLIGHT',
            data: highlightData,
            documentId: docId,
            newDocumentTitle: newTitle
        });

        close();
    };
}
