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

  // ▼▼▼ EDITAR POR UNIDAD (3/4 y 4/4): solo si el curso lleva autoevaluación tipo Quiz ▼▼▼
  //  - id: código de la lección Quiz. En Rise, abre el Quiz para editarlo; el id es lo
  //        que aparece en la URL tras "lesson/". OJO: solo cuentan las lecciones de tipo
  //        "quiz" (las de tipo "blocks", aunque se llamen "Autoevaluación N", NO puntúan).
  //  - message: mensaje de finalización al superar (≥80 %).
  //  - Si hay más (o menos) autoevaluaciones, duplica/elimina bloques manteniendo las comas.
  //  - Si el curso NO tiene autoevaluaciones, deja el array vacío: const evals = [];
  const evals = [
    {
      description: "Autoevaluación 1",
      id: "hLv2z2JSdUcNLBtf2Qee9Nyalp7S0RXH",
      message: "Enhorabuena, has demostrado tu aprendizaje sobre los comportamientos asociados de cooperación y colaboración. Continúa así. Ánimo.",
    },
	 {
      description: "Autoevaluación 2",
      id: "3AAsftqFwfYC6j3Qx4ku_gPBcUjElC5c",
      message: "Enhorabuena, has demostrado tu aprendizaje sobre los comportamientos asociados de cooperación y colaboración. Continúa así. Ánimo.",
    },
  ];
  // ▲▲▲ FIN ZONA EDITABLE POR UNIDAD ▲▲▲

  let currentLessonId = null; // Se actualizará dinámicamente

  // ─────────────────────────────────────────────────────────────────────────
  //  NOTA DE MOODLE = % DE PROGRESO DEL CURSO (el mismo que muestra Rise)
  //  Rise (con reporting "completed-incomplete") reporta el ESTADO de forma
  //  nativa, pero NO manda cmi.core.score.raw. Para que la nota de Moodle
  //  cuadre EXACTAMENTE con la barra de progreso interna del curso, leemos el
  //  valor que Rise ya muestra en su barra (nav-sidebar-header__progress-text,
  //  p. ej. "17% COMPLETADO") y lo enviamos tal cual con SetScore() del
  //  scormdriver (el equivalente moderno de LMSProxy.SetScore). No recalculamos
  //  nada: la fuente es la propia barra de Rise. Todo en try/catch.
  // ─────────────────────────────────────────────────────────────────────────

  // Sube por los frames padre hasta encontrar la ventana que expone SetScore
  // (el scormdriver de Rise) o la API SCORM 1.2 (LMSCommit).
  function findWinWith(check) {
    var w = window, hops = 0;
    while (w && hops < 25) {
      try { if (check(w)) return w; } catch (e) { /* cross-origin: seguir */ }
      if (!w.parent || w.parent === w) break;
      w = w.parent; hops++;
    }
    return null;
  }
  function getDriverWin() { return findWinWith(function (w) { return typeof w.SetScore === "function"; }); }
  function getApiWin() { return findWinWith(function (w) { return w.API && typeof w.API.LMSCommit === "function"; }); }

  // Lee el % que muestra la barra de progreso interna de Rise. Fuentes (en
  // orden): el texto "NN% COMPLETADO", o el ancho del "runner" (style width),
  // o variantes de layout. Devuelve 0..100 o null si aún no está renderizada.
  function readRiseProgressPct() {
    var textEl = document.querySelector(
      ".nav-sidebar-header__progress-text, .header-progress-text, .sidebar-progress-text"
    );
    if (textEl) {
      var m = (textEl.textContent || "").match(/(\d{1,3})\s*%/);
      if (m) return Math.max(0, Math.min(100, parseInt(m[1], 10)));
    }
    var runner = document.querySelector(
      ".nav-sidebar-header__progress-runner, .header-progress-runner, .sidebar-progress-runner"
    );
    if (runner && runner.style && runner.style.width) {
      var mw = runner.style.width.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
      if (mw) return Math.max(0, Math.min(100, Math.round(parseFloat(mw[1]))));
    }
    return null;
  }

  // Envía a Moodle el % REAL de progreso que muestra Rise, en cuanto cambia.
  // Solo reporta cuando el valor sube (el progreso es monótono), lo que además
  // evita spam al LMS y caídas por lecturas transitorias durante un re-render.
  var lastPushedPct = -1;
  function reportProgressToLMS() {
    try {
      var pct = readRiseProgressPct();
      if (pct == null || isNaN(pct)) return;
      if (pct <= lastPushedPct) return; // ya reportado (o transitorio inferior)
      var d = getDriverWin();
      if (!d || typeof d.SetScore !== "function") return;
      d.SetScore(pct, 100, 0);
      lastPushedPct = pct;
    } catch (e) {
      console.warn("No se pudo enviar el progreso al LMS", e);
    }
  }

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
    reportProgressToLMS(); // sigue la barra de progreso de Rise en tiempo real
  });

  function evaluateScore() {
    try {
      const footer = document.querySelector(".quiz-results__footer");
      // En el runtime nuevo el porcentaje del resultado está en
      // .odometer__score-percent (antes estaba en .odometer__pass-label, que
      // ahora es solo la etiqueta "APROBADO"). Usamos varios selectores por
      // compatibilidad. OJO: esto solo controla el MENSAJE en pantalla; la nota
      // de Moodle es el % de progreso (ver reportProgressToLMS), no este valor.
      const labelElement =
        document.querySelector(".odometer__score-percent") ||
        document.querySelector(".odometer__score") ||
        document.querySelector(".odometer__pass-label");

      if (!labelElement || !footer) return;

      const match = labelElement.textContent.match(/(\d+)/);
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
          msg.textContent = "Autoevaluación superada";
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

  // ── Reporte de trazabilidad a Moodle ──────────────────────────────────────
  //  - NOTA = % de progreso del curso → reportProgressToLMS() (SetScore).
  //  - ESTADO de finalización → lo pone Rise de forma nativa.
  //  - Se envía al arrancar, de forma periódica (cada 10 s) y al ocultar/cerrar
  //    la página, forzando además un LMSCommit() para que Moodle lo persista.
  function flushToLMS() {
    reportProgressToLMS();
    try {
      var aw = getApiWin();
      if (aw && aw.API && typeof aw.API.LMSCommit === "function") aw.API.LMSCommit("");
    } catch (e) {}
  }
  reportProgressToLMS();
  setInterval(reportProgressToLMS, 10000);
  window.addEventListener("pagehide", flushToLMS);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushToLMS();
  });
});
