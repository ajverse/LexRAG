async function ask() {
  const question = document.getElementById("question").value;
  const chatBox = document.getElementById("chat_box");

  const response = await fetch("/chat", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  const data = await response.json();
  const p = document.createElement("p");
  p.textContent = data.answer || data.message;
  chatBox.appendChild(p);
}
