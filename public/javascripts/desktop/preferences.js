import { getCookie, getRandomValue, setCookie } from "../modules/defaultFunctions.js";
import { alignLocationTitle } from "../modules/defaultDisplayElements.js"
import { refreshIcons } from "../modules/iconHandler.js";

const urgency_levels = [
    "-1", "0", "1", "2", "12", "3", "null", "4", "42", "5"
];

const settingsPanel = document.getElementById('settingsPanel');
const offsetLeftIncrement = 1,
    maxOffsetLeft = 100 - Math.ceil(settingsPanel.offsetWidth / window.innerWidth * 100);
let offsetLeft = Number(getCookie('preferences.left')) || 0;



/** Returns a random urgency from urgency_levels with a bias towards lower values. */
const getRandomUrgencyLevel = () => "urgency_" + urgency_levels[getRandomValue(0, urgency_levels.length-1, 0.25, true)];

/** Assigns a random urgency value to a tile. */
const randomizeUrgency = (element) => {
    element.classList.forEach(className => {
        if (className.includes("urgency_")) element.classList.remove(className);
    });

    element.classList.add(getRandomUrgencyLevel());
}
// document.querySelectorAll('.kiosk').forEach(randomizeUrgency);



/** Adds a label to an input displaying the value. */
const addInputLabel = (element) => {
    const span = document.createElement('span');
    span.innerText = element.value
    element.parentElement.appendChild(span);
    element.addEventListener('input', () => span.innerText = element.value);
}
document.querySelectorAll('input[type=color]').forEach(addInputLabel);



/** Updates a variable when an input field changes. */
const updateVariable = (event) => {
    const field = event.target,
        suffix = field.dataset.suffix || "";

    /* Update the cookie. */
    setCookie(field.name, field.type === "checkbox"
        ? (field.dataset[field.checked] || field.checked) + suffix
        : field.value + suffix
    );

    if (field.name === "layout.tile.align") document.querySelectorAll('.group').forEach(group => alignLocationTitle(group));
    if (field.name === "layout.icons") refreshIcons();

    /* Update the display. */
    if (!("var" in field.dataset)) return;
    document.documentElement.style.setProperty(field.dataset.var, field.type === "checkbox"
        ? field.dataset[field.checked] + suffix || field.checked
        : field.value + suffix
    );
}
document.querySelectorAll('input:not([type=file]), select').forEach(element => {
    element.addEventListener('input', updateVariable);
});



/** Adds an event listener for moving the settings panel left and right. */
addEventListener('keydown', (event) => {
    if (!event.ctrlKey) return;
    switch (event.key) {
        case "ArrowLeft": offsetLeft = Math.max(0, offsetLeft - offsetLeftIncrement); break;
        case "ArrowRight": offsetLeft = Math.min(maxOffsetLeft, offsetLeft + offsetLeftIncrement); break;
    }

    settingsPanel.style.left = `calc(10px + ${offsetLeft}vw)`;
    setCookie('preferences.left', offsetLeft);
});