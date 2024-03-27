/**
 * tooltipHandler.ts
 * written by Vince Dekker: https://github.com/VinceVer
 */
import { getElementFromTemplate } from "./defaultFunctions.js";
const template = getElementFromTemplate(document.querySelector('template[for=tooltip]'));
let tooltipId = 0;
/** Enables the tooltip for an element.
 * @param element - Element to enable tooltip for.
 */
export function enableTooltip(element) {
    element.addEventListener('mouseenter', () => showTooltip(element));
}
/** Enables the persistent tooltip for an element.
 * @param element - Element to enable tooltip for.
 * @returns the new tooltip.
 */
export const enablePersistentTooltip = (element) => {
    const tooltip = template.cloneNode(true);
    tooltip.id = "tooltip-" + tooltipId;
    element.appendChild(tooltip);
    return tooltip;
};
/** Updates the value of a tooltip.
 * @param element - Tooltip to update.
 * @param value - Value to display.
 */
export function updateValue(element, value) {
    const content = element.querySelector('.tooltip-content');
    if (!content)
        return;
    content.innerHTML = value;
}
/** Updates the position of a tooltip.
 * @param element - Tooltip to update.
 * @param x - X position in pixels.
 * @param y - Y position in pixels.
 */
export function updatePosition(element, x, y) {
    element.style.left = x + "px";
    element.style.top = y + "px";
}
/** Disables the tooltip for an element.
 * @param element - Element to disable tooltip for.
 */
export function disableTooltip(element) {
    element.removeEventListener('mouseenter', () => showTooltip(element));
}
/** Shows the tooltip of an element.
 * @param element - Element to show tooltip of.
 */
function showTooltip(element) {
    if (!template)
        return;
    const tooltip = template.cloneNode(true);
    tooltip.querySelector('.tooltip-content').textContent = element.dataset.tooltip || "";
    tooltip.style.bottom = window.innerHeight - element.offsetTop - 5 + "px";
    tooltip.style.left = element.offsetLeft + element.offsetWidth / 2 + "px";
    element.appendChild(tooltip);
    element.addEventListener('mouseleave', mouseLeft);
    function mouseLeft() {
        tooltip.remove();
        element.removeEventListener('mouseleave', mouseLeft);
    }
}
