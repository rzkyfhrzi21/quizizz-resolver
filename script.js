async function fetchQuizizzQuestions(pin) {
  const url = `https://api.quizit.online/quizizz/answers?pin=${pin}`;
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Error fetching data: ${response.status}`);
    const data = await response.json();
    if (data.message !== "Ok") throw new Error("Invalid response from API");
    return data.data.answers.map((answerData) => ({
      question: answerData.question.text.replace(/<[^>]*>/g, "").trim(),
      answers: answerData.answers.map((ans) =>
        ans.text.replace(/<[^>]*>/g, "").trim()
      ),
      category:
        {
          MSQ: "Multiple",
          MCQ: answerData.answers.length > 1 ? "Multiple" : "Single",
          BLANK: "Blank",
        }[answerData.type] || "Unknown",
    }));
  } catch (error) {
    console.error("Error fetching answers:", error);
    throw new Error(
      "Gagal mengambil data. Pastikan kode yang dimasukkan benar."
    );
  }
}

async function displayQuestions(pin) {
  const container = document.getElementById("questions-container");
  const errorMessage = document.getElementById("error-message");
  try {
    const questions = await fetchQuizizzQuestions(pin);
    container.innerHTML = ""; // Bersihkan kontainer sebelumnya
    questions.forEach((q, index) => {
      const questionCard = document.createElement("div");
      questionCard.classList.add("col-md-6", "col-lg-4", "question-card");

      questionCard.innerHTML = `
                <div>
                    <p class="question-header">Soal ${index + 1}: ${
        q.question
      }</p>
                    <span class="badge bg-primary category-badge">${
                      q.category
                    }</span>
                    <ul class="answer-list">
                        ${q.answers
                          .map((answer) => `<li>✔️ ${answer}</li>`)
                          .join("")}
                    </ul>
                </div>
            `;

      container.appendChild(questionCard);
    });

    container.style.display = "flex";
    errorMessage.textContent = "";
  } catch (error) {
    errorMessage.textContent = error.message;
    container.style.display = "none";
  }
}

document.getElementById("fetch-button").addEventListener("click", () => {
  const pinInput = document.getElementById("quiz-pin").value.trim();
  const errorMessage = document.getElementById("error-message");

  if (!pinInput) {
    errorMessage.textContent = "Kode (PIN) tidak boleh kosong.";
    return;
  }

  if (!/^\d{6}$/.test(pinInput)) {
    errorMessage.textContent = "Kode (PIN) harus berupa 6 digit angka.";
    return;
  }

  errorMessage.textContent = "";
  displayQuestions(pinInput);
});

document.getElementById("quiz-pin").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    document.getElementById("fetch-button").click();
  }
});
