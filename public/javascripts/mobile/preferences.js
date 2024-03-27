import { setCookie } from "../modules/defaultFunctions.js";
import { refreshIcons } from "../modules/iconHandler.js";
import { refreshList } from "./list.js";



/** Adds a label to an input displaying the value. */
const addInputLabel = (element) => {
    const span = document.createElement('span');
    span.innerText = element.value
    element.parentElement.appendChild(span);
    element.addEventListener('input', () => span.innerText = element.value);
}
document.querySelectorAll('input[type=color]').forEach(addInputLabel);

/** Adds a minimum and maximum to an input. */
const setRange = (element) => {
    if (Number(element.value) < Number(element.min)) element.value = element.min;
    if (Number(element.value) > Number(element.max)) element.value = element.max;

    element.addEventListener('change', function(event) {
        if (Number(this.value) < Number(this.min)) this.value = this.min;
        if (Number(this.value) > Number(this.max)) this.value = this.max;
        updateVariable(event);
    });
}
document.querySelectorAll('input[type=number]').forEach(setRange);



/** Switch u2 and u1 */
const switchYellowAndPurple = (urgency) => {
    switch (String(urgency)) {
        case "1": return "2";
        case "2": return "1";
        default: return urgency;
    }
}



/** Updates a variable when an input field changes. */
const updateVariable = (event) => {
    const field = event.target,
        suffix = field.dataset.suffix || "";

    /* Update the cookie. */
    setCookie(field.name, field.type === "checkbox"
        ? (field.dataset[field.checked] || field.checked) + suffix
        : field.value + suffix
    );

    if (field.name === "layout.yellow_first") {
        document.querySelectorAll('tbody tr').forEach(item => item.dataset.urgency = switchYellowAndPurple(item.dataset.urgency));
        refreshList();
    }
    if (field.name === "layout.icons")  refreshIcons();
    if (field.name === "mobile.scalable") location.reload();

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