import * as defaultFunctions from "../modules/defaultFunctions.js";



const characterList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ' '];
/** Tansitions text smoothly between 2 values over a span of <time>. */
const transitionText = (element, startText, endText, time) => {
    let text = Array.from(startText);
    let endText2 = endText;
    const amountOfCharacters = Math.max(startText.length, endText.length);
    element.textContent = startText;

    while(text.length < endText2.length) text.push(" ");
    while(text.length > endText2.length) endText2 += " ";

    for (let i = 0; i < amountOfCharacters; i++) {
        const iterations = Math.round(time + (Math.random() * 0.2 * time) * 20);

        for (let j = 1; j <= iterations; j++) {
            if (j === iterations) {
                setTimeout(() => {
                    text[i] = endText2[i];
                    element.textContent = text.join('');
                }, 50 * j);
            } else {
                setTimeout(() => {
                    text[i] = characterList[Math.floor(Math.random() * characterList.length)];
                    element.textContent = text.join('');
                }, 50 * j);
            }
        }
    }
}



/** Navigation functionality. */
let currentPage = defaultFunctions.getCookie('mobile.current_page') || "list";
const siteName = document.querySelector('h1').textContent;

document.querySelector('a[href="#preferences"]').addEventListener('click', () => {
    if (currentPage === "preferences") return;

    transitionText(document.querySelector('h1'), siteName, "PREFERENCES", 1);
    document.getElementById('list').style.left = "-100vw";
    document.getElementById('preferences').style.left = "0";

    currentPage = "preferences";
    defaultFunctions.setCookie('mobile.current_page', 'preferences');
});

document.querySelector('a[href="#"]').addEventListener('click', () => {
    if (currentPage === "list") return;

    transitionText(document.querySelector('h1'), "PREFERENCES", siteName, 1);
    document.getElementById('list').style.left = "0";
    document.getElementById('preferences').style.left = "100vw";

    currentPage = "list";
    defaultFunctions.setCookie('mobile.current_page', 'list');
});



/** Calculates the correct font size for the header. */
const setTitleSize = () => {
    const header = document.querySelector('#vertical h1');
    let fontSize = parseInt(window.getComputedStyle(header).fontSize.replace("px",""));

    while (header.scrollWidth > window.innerWidth-30 || header.scrollHeight > header.parentElement.offsetHeight) document.documentElement.style.setProperty('--title-font-size', fontSize-- + "px");
    while (header.scrollWidth < window.innerWidth-30 && header.scrollHeight < header.parentElement.offsetHeight) document.documentElement.style.setProperty('--title-font-size', fontSize++ + "px");
    
    defaultFunctions.setCookie('title.size', fontSize-1+"px");
}; setTitleSize();
window.addEventListener('resize', setTitleSize)



/** Adds a service worker for offline use. */
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//       navigator.serviceWorker.register('/service-worker.js')
//         .then(registration => console.log('Service Worker registered with scope:', registration.scope))
//         .catch(error => console.error('Service Worker registration failed:', error));
//     });
// }