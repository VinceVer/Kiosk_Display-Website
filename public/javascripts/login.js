import { makeTextFitContainer } from './modules/defaultFunctions.js';

let containersToResize = Array.from(document.querySelectorAll('h1'));
containersToResize.push(Array.from(document.querySelectorAll('h2')));
containersToResize = containersToResize.flat(Infinity);

makeTextFitContainer(containersToResize);

document.addEventListener('touchmove', (e) => e.preventDefault(), {passive: false});
document.addEventListener('resize', () => makeTextFitContainer(containersToResize));