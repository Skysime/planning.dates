const CONFIG = {
  // 1) Crée un formulaire sur https://formspree.io avec l'adresse skysime@gmail.com.
  // 2) Remplace l'URL ci-dessous par ton endpoint, par exemple : https://formspree.io/f/abcdwxyz
  // 3) Si tu ne remplaces rien, le site utilisera un fallback mailto: moins automatique.
  formspreeEndpoint: "https://formspree.io/f/TON_ID_FORMULAIRE",
  recipientEmail: "skysime@gmail.com",
  senderName: "Simon",
};

const screens = {
  intro: document.querySelector("#screen-intro"),
  planner: document.querySelector("#screen-planner"),
  success: document.querySelector("#screen-success"),
};

const yesButton = document.querySelector("#yes-button");
const noButton = document.querySelector("#no-button");
const noHint = document.querySelector("#no-hint");
const activityButtons = [...document.querySelectorAll(".activity-card")];
const dateForm = document.querySelector("#date-form");
const dateInput = document.querySelector("#date-input");
const timeInput = document.querySelector("#time-input");
const guestNameInput = document.querySelector("#guest-name");
const noteInput = document.querySelector("#note-input");
const summaryBox = document.querySelector("#summary-box");
const finalSummary = document.querySelector("#final-summary");
const formError = document.querySelector("#form-error");
const submitButton = document.querySelector("#submit-button");
const restartButton = document.querySelector("#restart-button");

let selectedActivity = "";
let noClickCount = 0;
let lastPayload = null;

const noMessages = [
  "Mauvais bouton.",
  "Il devient de plus en plus petit, c'est normal.",
  "Tu peux encore sauver la situation avec Oui.",
  "Statistiquement, Oui est une meilleure option.",
  "Le bouton Non entre en phase d'évitement avancée.",
];

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("screen-active"));
  screens[name].classList.add("screen-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setTodayAsMinimumDate() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
  dateInput.min = localToday;
}

function moveNoButton() {
  noClickCount += 1;

  const scale = Math.max(0.38, 1 - noClickCount * 0.12);
  const buttonWidth = noButton.offsetWidth || 90;
  const buttonHeight = noButton.offsetHeight || 52;
  const margin = 18;

  const maxLeft = Math.max(margin, window.innerWidth - buttonWidth - margin);
  const maxTop = Math.max(margin, window.innerHeight - buttonHeight - margin);

  const left = Math.floor(Math.random() * (maxLeft - margin) + margin);
  const top = Math.floor(Math.random() * (maxTop - margin) + margin);
  const rotation = Math.floor(Math.random() * 34 - 17);

  noButton.classList.add("runaway");
  noButton.style.left = `${left}px`;
  noButton.style.top = `${top}px`;
  noButton.style.transform = `scale(${scale}) rotate(${rotation}deg)`;

  noHint.textContent = noMessages[Math.min(noClickCount - 1, noMessages.length - 1)];

  if (noClickCount >= 6) {
    noButton.textContent = "non";
  }

  if (navigator.vibrate) {
    navigator.vibrate(35);
  }
}

function selectActivity(button) {
  selectedActivity = button.dataset.activity;

  activityButtons.forEach((item) => {
    const isSelected = item === button;
    item.classList.toggle("selected", isSelected);
    item.setAttribute("aria-pressed", String(isSelected));
  });

  updateSummaryPreview();
}

function formatDate(dateValue) {
  if (!dateValue) return "date à confirmer";

  const date = new Date(`${dateValue}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildPayload() {
  const guestName = guestNameInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  const note = noteInput.value.trim();

  return {
    guestName,
    activity: selectedActivity,
    date,
    formattedDate: formatDate(date),
    time,
    note,
    recipient: CONFIG.recipientEmail,
    createdAt: new Date().toLocaleString("fr-FR"),
  };
}

function buildSummaryHtml(payload) {
  const who = payload.guestName ? escapeHtml(payload.guestName) : "Mystérieuse personne";
  const noteHtml = payload.note
    ? `<br><strong>Message :</strong> ${escapeHtml(payload.note)}`
    : "";

  return `
    <strong>Invitée :</strong> ${who}<br>
    <strong>Activité :</strong> ${escapeHtml(payload.activity)}<br>
    <strong>Date :</strong> ${escapeHtml(payload.formattedDate)}<br>
    <strong>Horaire :</strong> ${escapeHtml(payload.time)}${noteHtml}
  `;
}

function buildPlainText(payload) {
  return [
    "Nouvelle réponse à l'invitation de Simon",
    "",
    `Invitée : ${payload.guestName || "Non renseigné"}`,
    `Activité : ${payload.activity}`,
    `Date : ${payload.formattedDate}`,
    `Horaire : ${payload.time}`,
    payload.note ? `Message : ${payload.note}` : "Message : Aucun",
    "",
    `Réponse envoyée le : ${payload.createdAt}`,
  ].join("\n");
}

function updateSummaryPreview() {
  const payload = buildPayload();

  if (!payload.activity && !payload.date && !payload.time && !payload.guestName && !payload.note) {
    summaryBox.hidden = true;
    return;
  }

  summaryBox.hidden = false;
  summaryBox.innerHTML = buildSummaryHtml({
    ...payload,
    activity: payload.activity || "activité à choisir",
    time: payload.time || "horaire à confirmer",
  });
}

function validatePayload(payload) {
  if (!payload.activity) return "Choisis d'abord une activité.";
  if (!payload.date) return "Choisis une date.";
  if (!payload.time) return "Choisis un horaire.";

  const selectedDateTime = new Date(`${payload.date}T${payload.time}`);
  if (Number.isNaN(selectedDateTime.getTime())) {
    return "La date ou l'horaire n'est pas valide.";
  }

  const now = new Date();
  if (selectedDateTime < now) {
    return "Choisis une date et un horaire dans le futur.";
  }

  return "";
}

async function sendWithFormspree(payload) {
  const isConfigured =
    CONFIG.formspreeEndpoint &&
    !CONFIG.formspreeEndpoint.includes("TON_ID_FORMULAIRE") &&
    CONFIG.formspreeEndpoint.startsWith("https://formspree.io/f/");

  if (!isConfigured) {
    openMailtoFallback(payload);
    return { fallback: true };
  }

  const response = await fetch(CONFIG.formspreeEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      _subject: "Nouvelle réponse à l'invitation de Simon",
      invite_de: CONFIG.senderName,
      email_destinataire: CONFIG.recipientEmail,
      prenom: payload.guestName || "Non renseigné",
      activite: payload.activity,
      date: payload.formattedDate,
      horaire: payload.time,
      message: payload.note || "Aucun",
      recapitulatif: buildPlainText(payload),
      envoye_le: payload.createdAt,
    }),
  });

  if (!response.ok) {
    throw new Error("L'envoi Formspree a échoué.");
  }

  return { fallback: false };
}

function openMailtoFallback(payload) {
  const subject = encodeURIComponent("Nouvelle réponse à l'invitation de Simon");
  const body = encodeURIComponent(buildPlainText(payload));
  window.location.href = `mailto:${CONFIG.recipientEmail}?subject=${subject}&body=${body}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

noButton.addEventListener("click", moveNoButton);
noButton.addEventListener("mouseenter", () => {
  if (noClickCount >= 1) moveNoButton();
});
noButton.addEventListener("touchstart", (event) => {
  event.preventDefault();
  moveNoButton();
});

window.addEventListener("resize", () => {
  if (noButton.classList.contains("runaway")) moveNoButton();
});

yesButton.addEventListener("click", () => {
  noButton.classList.remove("runaway");
  noButton.removeAttribute("style");
  showScreen("planner");
  setTimeout(() => document.querySelector(".activity-card")?.focus(), 250);
});

activityButtons.forEach((button) => {
  button.addEventListener("click", () => selectActivity(button));
});

[dateInput, timeInput, guestNameInput, noteInput].forEach((field) => {
  field.addEventListener("input", updateSummaryPreview);
});

dateForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = buildPayload();
  const validationError = validatePayload(payload);

  if (validationError) {
    formError.textContent = validationError;
    return;
  }

  formError.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "Envoi en cours...";

  try {
    await sendWithFormspree(payload);
    lastPayload = payload;
    finalSummary.innerHTML = buildSummaryHtml(payload);
    showScreen("success");
  } catch (error) {
    console.error(error);
    formError.textContent =
      "L'envoi automatique a échoué. Je vais ouvrir un email prérempli à envoyer manuellement.";
    openMailtoFallback(payload);
    lastPayload = payload;
    finalSummary.innerHTML = buildSummaryHtml(payload);
    showScreen("success");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Valider notre date";
  }
});

restartButton.addEventListener("click", () => {
  if (lastPayload) {
    finalSummary.innerHTML = buildSummaryHtml(lastPayload);
  }
  showScreen("planner");
});

setTodayAsMinimumDate();
updateSummaryPreview();
