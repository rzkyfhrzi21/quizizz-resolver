const pin = "130625"; // Ganti dengan pin yang diinginkan

(async function () {
  async function fetchAndCategorizeQuizizzAnswers(pin) {
    const url = `https://api.quizit.online/quizizz/answers?pin=${pin}`;
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Error fetching data: ${response.status}`);

      const data = await response.json();
      if (data.message !== "Ok") throw new Error("Invalid response from API");

      return data.data.answers.map((answerData) => {
        const questionText = answerData.question.text
          .replace(/<[^>]*>/g, "")
          .trim();
        const answers = answerData.answers.map((ans) =>
          ans.text.replace(/<[^>]*>/g, "").trim()
        );
        const type = answerData.type;

        const category =
          {
            MSQ: "Multiple",
            MCQ: answers.length > 1 ? "Multiple" : "Single",
            BLANK: "Blank",
          }[type] || "Unknown";

        return { question: questionText, answers, category };
      });
    } catch (error) {
      console.error("Error fetching answers:", error);
      return [];
    }
  }

  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const interval = 100;
      let elapsed = 0;

      const check = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(check);
          resolve(element);
        }
        elapsed += interval;
        if (elapsed >= timeout) {
          clearInterval(check);
          reject(new Error("Element not found: " + selector));
        }
      }, interval);
    });
  }

  function getCurrentQuestionText() {
    const questionTextElement = document.querySelector(
      '[data-testid="question-container-text"]'
    );
    return questionTextElement ? questionTextElement.textContent.trim() : "";
  }

  function clickTextAnswer(answer) {
    const options = [...document.querySelectorAll("button.option")];
    const option = options.find((opt) => {
      const textElement = opt.querySelector("p");
      return textElement && textElement.textContent.trim() === answer;
    });
    if (option) {
      option.click();
      console.log(`Clicked option: "${answer}"`);
    } else {
      console.error(`Answer not found: "${answer}"`);
    }
  }

  function clickCheckboxAnswers(expectedAnswers) {
    const checkboxContainers = [...document.querySelectorAll(".option")];
    expectedAnswers.forEach((expectedAnswer) => {
      const checkbox = checkboxContainers.find((container) => {
        const label = container
          .querySelector(".resizeable-text p")
          ?.textContent.trim();
        return label === expectedAnswer;
      });
      if (checkbox && !checkbox.classList.contains("selected")) {
        checkbox.click();
      }
    });
  }

  function typeBlankAnswer(answer) {
    const inputBoxes = [...document.querySelectorAll('input[data-cy^="box"]')];
    const chars = answer.split("");

    if (inputBoxes.length !== chars.length) {
      console.error("Mismatch between input boxes and answer length");
      return;
    }

    inputBoxes.forEach((input, index) => {
      input.value = chars[index];
      const event = new Event("input", { bubbles: true });
      input.dispatchEvent(event);
    });

    console.log("Typed answer:", answer);
  }

  function submitAnswer() {
    const submitButton = document.querySelector(
      'button[data-cy="submit-button"][data-testid="button"]'
    );
    if (submitButton && !submitButton.disabled) {
      submitButton.click();
      console.log("Clicked the submit button.");
    } else {
      console.error("Submit button not found or is disabled!");
    }
  }

  const questions = await fetchAndCategorizeQuizizzAnswers(pin);
  const answeredQuestions = new Set();

  while (answeredQuestions.size < questions.length) {
    try {
      await waitForElement('[data-testid="question-container"]');
      const currentQuestion = getCurrentQuestionText();

      const questionData = questions.find(
        (q) => q.question === currentQuestion
      );
      if (!questionData || answeredQuestions.has(currentQuestion)) {
        console.warn("Question mismatch or already answered. Skipping...");
        continue;
      }

      const { answers, category } = questionData;

      // Tambahkan jeda 2 detik setelah soal baru muncul
      console.log("Waiting for 2 seconds before answering...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (category === "Single") {
        clickTextAnswer(answers[0]);
      } else if (category === "Multiple") {
        clickCheckboxAnswers(answers);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        submitAnswer();
      } else if (category === "Blank") {
        typeBlankAnswer(answers[0]);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        submitAnswer();
      }

      answeredQuestions.add(currentQuestion);
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Tunggu sebelum soal selanjutnya muncul
    } catch (error) {
      console.error("Error while processing question:", error);
      break;
    }
  }

  console.log("All questions answered!");
})();
