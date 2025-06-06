async function ask() {
  const question = document.getElementById("question").value.trim();
  const chatBox = document.getElementById("chat_box");
  if (!question) return;

  // Add user message with animation
  const userMsg = document.createElement("p");
  userMsg.textContent = `🧑‍💼 ${question}`;
  userMsg.style.background = "linear-gradient(90deg, #00ffe7 10%, #1a2636 100%)";
  userMsg.style.color = "#0f2027";
  userMsg.style.fontWeight = "bold";
  userMsg.style.textAlign = "right";
  userMsg.style.boxShadow = "0 0 8px #00ffe7a0";
  chatBox.appendChild(userMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Add loading animation for bot
  const botMsg = document.createElement("p");
  botMsg.innerHTML = '<span class="sci-fi-glow"><i class="fas fa-robot"></i> LexRAG is thinking<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>';
  botMsg.classList.add("bot-loading");
  chatBox.appendChild(botMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Animate dots
  let dots = botMsg.querySelectorAll('.dot');
  let dotIndex = 0;
  let loading = true;
  const dotInterval = setInterval(() => {
    dots.forEach((d, i) => d.style.opacity = i === dotIndex ? 1 : 0.3);
    dotIndex = (dotIndex + 1) % dots.length;
  }, 350);

  // Fetch answer
  try {
    const response = await fetch("/chat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    loading = false;
    clearInterval(dotInterval);
    botMsg.classList.remove("bot-loading");
    botMsg.innerHTML = `<span style='color:#00ffe7'><i class='fas fa-robot'></i> LexRAG:</span> ` + (data.answer || data.message || "No answer.");
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (e) {
    loading = false;
    clearInterval(dotInterval);
    botMsg.classList.remove("bot-loading");
    botMsg.innerHTML = `<span style='color:#ff4a4a'><i class='fas fa-exclamation-triangle'></i> Error:</span> Could not get a response.`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Drag & drop and browse file upload logic
const fileUploadArea = document.getElementById('file-upload-area');
const fileInput = document.getElementById('file-input');

fileUploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  fileUploadArea.classList.add('dragover');
});
fileUploadArea.addEventListener('dragleave', (e) => {
  e.preventDefault();
  fileUploadArea.classList.remove('dragover');
});
fileUploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  fileUploadArea.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    handleFiles(e.dataTransfer.files);
  }
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handleFiles(e.target.files);
  }
});

function handleFiles(files) {
  // Only accept PDFs
  const pdfs = Array.from(files).filter(f => f.type === 'application/pdf');
  if (pdfs.length === 0) {
    alert('Please upload PDF files only.');
    return;
  }
  // Show uploading message
  const chatBox = document.getElementById('chat_box');
  const uploadingMsg = document.createElement('p');
  uploadingMsg.textContent = `Uploading ${pdfs.length} PDF file(s)...`;
  uploadingMsg.style.color = '#00b4d8';
  chatBox.appendChild(uploadingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Prepare FormData and send to backend
  const formData = new FormData();
  pdfs.forEach((file, idx) => formData.append('pdfs', file));
  fetch('/upload', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      uploadingMsg.textContent = data.message || 'Upload complete.';
      uploadingMsg.style.color = '#00b4d8';
    })
    .catch(() => {
      uploadingMsg.textContent = 'Upload failed.';
      uploadingMsg.style.color = '#ff4a4a';
    });
}
