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
