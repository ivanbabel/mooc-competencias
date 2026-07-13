document.addEventListener("DOMContentLoaded", function () {
  const correctPhrases = [
    "¡Sigue así!",
    "¡Buen trabajo!",
    "¡Excelente trabajo, sigue aprendiendo!",
  ];
  const incorrectPhrases = [
    "Vuelve a repasar el contenido y refuerza tu aprendizaje. ¡De los errores se aprende!",
    "No pasa nada, intenta nuevamente y sigue aprendiendo.",
    "¡Ánimo! Vuelve a repasar y prueba otra vez.",
  ];

  const evals = [
    {
      description: "Autoevaluación 1",
      id: "hLv2z2JSdUcNLBtf2Qee9Nyalp7S0RXH",
      message: "Enhorabuena, has demostrado tu aprendizaje sobre los comportamientos asociados de cooperación y colaboración. Continúa así. Ánimo.",
    },
    {
      description: "Autoevaluación 2",
      id: "3AAsftqFwfYC6j3Qx4ku_gPBcUjElC5c",
      message:
        "Enhorabuena, has demostrado tu aprendizaje sobre los comportamientos asociados de cooperación y colaboración. Continúa así. Ánimo.",
    },
  ];

  let currentLessonId = null; // Se actualizará dinámicamente

  function applyRandomFeedback(feedback) {
    try {
      const icon = feedback.querySelector(".quiz-card__feedback-icon");
      const label = feedback.querySelector(".quiz-card__feedback-label");

      if (icon && label) {
        if (icon.classList.contains("quiz-card__feedback-icon--correct")) {
          const randomPhrase =
            correctPhrases[Math.floor(Math.random() * correctPhrases.length)];
          label.style.setProperty("--feedback-correct", `"${randomPhrase}"`);
        } else {
          const randomPhrase =
            incorrectPhrases[
              Math.floor(Math.random() * incorrectPhrases.length)
            ];
          label.style.setProperty("--feedback-incorrect", `"${randomPhrase}"`);
        }
      }
    } catch (e) {
      console.warn("Error en applyRandomFeedback", e);
    }
  }

  function processQuizFeedback() {
    document
      .querySelectorAll(".quiz-card__feedback")
      .forEach(applyRandomFeedback);
  }

  function cleanLessonText(element) {
    const originalText = element.textContent;
    const cleanedText = originalText.replace(/^.*? - /, "");
    if (originalText !== cleanedText) {
      element.textContent = cleanedText;
    }
  }
 
  function processLessonNavLinks() {
    document
      .querySelectorAll(".lesson-nav__link-text")
      .forEach(cleanLessonText);
  }
 
  const observer = new MutationObserver(() => {
    processQuizFeedback();
    evaluateScore();
    processLessonNavLinks();
  });

  function evaluateScore() {
    try {
      const labelElement = document.querySelector(".odometer__pass-label");
      const footer = document.querySelector(".quiz-results__footer");
      const restartButton = document.querySelector(".restart-button");

      if (!labelElement || !footer) return;

      const match = labelElement.textContent.match(/(\d+)%/);
      if (!match) return;

      const score = parseInt(match[1], 10);
      if (isNaN(score)) return;

      // Detener observer para evitar bucles
      observer.disconnect();

      // Eliminar mensaje anterior
      const previousMsg = footer.querySelector(".score-evaluation-msg");
      if (previousMsg) previousMsg.remove();

      const msg = document.createElement("p");
      msg.className = "score-evaluation-msg";

      if (score < 80) {
        msg.textContent =
          "Tu calificación no ha llegado al 80%, que es la puntuación mínima necesaria para demostrar tu aprendizaje. Tienes que repetir de nuevo el cuestionario de autoevaluación para mejorar tu calificación. ¡Ánimo!";
        if (restartButton) restartButton.style.display = "";
      } else {
        const evalEntry = evals.find((e) => e.id === currentLessonId);
        if (evalEntry) {
          msg.textContent = evalEntry.message;
        } else {
          const evalEntry = evals.find((e) => e.id === currentLessonId);
          if (evalEntry) {
            msg.textContent = evalEntry.message;
          } else {
            msg.textContent = "Autoevaluación superada";
          }
        }

        if (score === 100 && restartButton) {
          restartButton.style.display = "none";
        } else if (restartButton) {
          restartButton.style.display = "";
        }
      }

      footer.appendChild(msg);
    } catch (e) {
      console.warn("Error en evaluateScore", e);
    } finally {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Observer para guardar lessonId dinámicamente
  const lessonIdTracker = new MutationObserver(() => {
    const newLesson = document.querySelector("div[data-lesson-id]");
    if (newLesson) {
      const newId = newLesson.getAttribute("data-lesson-id");
      if (newId && newId !== currentLessonId) {
        currentLessonId = newId;
        console.log("Lección actual actualizada:", currentLessonId);
      }
    }
  });

  // Detectar lessonId inicial si ya existe en el DOM
  const initialLesson = document.querySelector("div[data-lesson-id]");
  if (initialLesson) {
    const initialId = initialLesson.getAttribute("data-lesson-id");
    if (initialId) {
      currentLessonId = initialId;
      console.log("Lección inicial detectada:", currentLessonId);
    }
  }

  // Inicial
  processQuizFeedback();
  evaluateScore();

  // Activar observers
  observer.observe(document.body, { childList: true, subtree: true });
  lessonIdTracker.observe(document.body, { childList: true, subtree: true });
});
