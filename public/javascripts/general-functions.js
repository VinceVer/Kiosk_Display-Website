const alert = (info) => {
    const alertBox = document.getElementById("alertBox");

    with (alertBox) {
        style.display = "flex";

        querySelector('h2').style.display = info.title ? "inline" : "none";
        querySelector('h2').innerHTML = info.title;

        querySelector('h4').style.display = info.description ? "inline" : "none";
        (info.description && info.description.includes("\n"))
            ? querySelector('h4').innerText = info.description
            : querySelector('h4').innerHTML = info.description;

        querySelectorAll('.flexBar button').forEach(element => element.remove());
        for (let buttonIndex in info.buttons) {
            const button = document.createElement('button');
            button.innerText = info.buttons[buttonIndex].text;
            if (info.buttons[buttonIndex].invert) {button.style.filter = "invert("+ (isNaN(Number(button.invert)) ? "0.85" : String(button.invert)) +")"}
            console.log("invert("+ isNaN(Number(button.invert)) ? "0.85" : String(button.invert) +")")
            button.addEventListener("click", info.buttons[buttonIndex].action);
            querySelector('.flexBar').appendChild(button);
        }
    }

    document.body.querySelectorAll('nav, #display, #settingsInput').forEach(element => {
        //element.classList.add("blur");
        element.style.filter = "blur(3px) brightness(0.75)";
    });

    setTimeout(() => {document.getElementById("alertBox").style.opacity = 1}, 100);
}

const getCookie = (cookieName) => {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
  
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }
    return null; // Return null if the cookie is not found
}

const getUnixTimestamp = (type) => {
    const currentDate = new Date();

    if (!type) {
        return Math.floor(currentDate.getTime() / 1000);
    }

    switch (type) {
        case "thisWeek":
        case "curWeek":
            const currentDay = currentDate.getDay();
            const difference = currentDay - 1;
            const startOfWeek = new Date(currentDate);
            startOfWeek.setHours(0, 0, 0, 0);
            startOfWeek.setDate(currentDate.getDate() - difference);
            return Math.floor(startOfWeek.getTime() / 1000);
        case "thisMonth":
        case "curMonth":
            currentDate.setDate(1);
            currentDate.setHours(0, 0, 0, 0);
            return Math.floor(currentDate.getTime() / 1000);
        case "pastDay":
        case "past24h":
        case "lastDay":
        case "last24h":
            return Math.floor((currentDate.getTime() - (1 * 24 * 60 * 60 * 1000)) / 1000);
        case "pastWeek":
        case "lastWeek":
            return Math.floor((currentDate.getTime() - (7 * 24 * 60 * 60 * 1000)) / 1000);
        case "pastMonth":
        case "lastMonth":
            return Math.floor((currentDate.getTime() - (30 * 24 * 60 * 60 * 1000)) / 1000);
    }
}