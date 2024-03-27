/**
 * tooltipHandler.ts
 * written by Vince Dekker: https://github.com/VinceVer
 */

declare global {
    interface Tooltip extends HTMLElement {
        /** Updates the displayed value. */
        updateValue(value: any): void;
        /** Moves the tooltip. */
        updatePosition(x: number, y: number): void;
    }
}

import { getElementFromTemplate } from "./defaultFunctions.js";

const template = getElementFromTemplate(document.querySelector('template[for=tooltip]') as HTMLTemplateElement);
let tooltipId = 0;



/** Enables the tooltip for an element.
 * @param element - Element to enable tooltip for.
 */
export function enableTooltip(element: HTMLElement) {
    element.addEventListener('mouseenter', () => showTooltip(element));
}



/** Enables the persistent tooltip for an element.
 * @param element - Element to enable tooltip for.
 * @returns the new tooltip.
 */
export const enablePersistentTooltip = (element: HTMLElement) => {
    const tooltip = template.cloneNode(true) as HTMLElement;
    tooltip.id = "tooltip-" + tooltipId;
    element.appendChild(tooltip);

    return tooltip;
}



/** Updates the value of a tooltip.
 * @param element - Tooltip to update.
 * @param value - Value to display.
 */
export function updateValue(element: HTMLElement, value: any) {
    const content = element.querySelector('.tooltip-content')
    if (!content) return;
    content.innerHTML = value;
}

/** Updates the position of a tooltip.
 * @param element - Tooltip to update.
 * @param x - X position in pixels.
 * @param y - Y position in pixels.
 */
export function updatePosition(element: HTMLElement, x: number|string, y: number|string) {
    element.style.left = x + "px";
    element.style.top = y + "px";
}



/** Disables the tooltip for an element.
 * @param element - Element to disable tooltip for.
 */
export function disableTooltip(element: HTMLElement) {
    element.removeEventListener('mouseenter', () => showTooltip(element));
}



/** Shows the tooltip of an element.
 * @param element - Element to show tooltip of.
 */
function showTooltip(element: HTMLElement) {
    if (!template) return;

    const tooltip = template.cloneNode(true) as HTMLElement;
    tooltip.querySelector('.tooltip-content')!.textContent = element.dataset.tooltip || "";
    tooltip.style.bottom = window.innerHeight - element.offsetTop - 5 + "px";
    tooltip.style.left = element.offsetLeft + element.offsetWidth / 2 + "px";
    element.appendChild(tooltip);

    element.addEventListener('mouseleave', mouseLeft);

    function mouseLeft() {
        tooltip.remove();
        element.removeEventListener('mouseleave', mouseLeft);
    }
}