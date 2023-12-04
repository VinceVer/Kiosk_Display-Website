const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);
let status_database = JSON.parse(document.getElementById("data_storage").dataset.status_database);
let misc_data = JSON.parse(document.getElementById("data_storage").dataset.misc_data);
const dataBar = document.getElementById("dataBar");
let groupedData = {};
const groupedBy = "device_name";

const loadGrid = async () => {
    const currentTime = new Date();
    const endTime = Math.floor(currentTime.getTime() / 1000);
    const startTime = endTime - 80000;
    const timeRange = endTime - startTime;

    const timeline_fields = await (await fetch(`/database?query=SELECT DISTINCT device_name FROM devicetimeline WHERE time BETWEEN ${startTime} AND ${endTime} ORDER BY device_name`)).json();
    const timeline_data = await (await fetch(`/database?query=SELECT * FROM devicetimeline WHERE time BETWEEN ${startTime} AND ${endTime} ORDER BY device_name, time`)).json();
    console.log(timeline_data.time)

    for (let item of timeline_data.data) {
        if (!groupedData[item[groupedBy]]) {
            groupedData[item[groupedBy]] = [];

            const timeline = dataBar.cloneNode(true);
            timeline.id = item[groupedBy];
            timeline.querySelector('.title').innerText = item[groupedBy];
            document.getElementById("timeline").appendChild(timeline);
        }
        groupedData[item[groupedBy]].push(item);
    }

    console.log(groupedData);

    for (let groupName in groupedData) {
        const group = groupedData[groupName];
        const groupContainer = document.getElementById(groupName).querySelector('.info');

        for (let itemIndex in group) {
            const timeBar = document.createElement('div');
            const item = group[itemIndex];
            const relativePosition = (item.time - startTime) / timeRange * 100;

            if (itemIndex === "0") {
                const timeBarL = document.createElement('div');
                timeBarL.style.marginLeft = "calc(var(--line-height) * -1)";
                timeBarL.style.width = `calc(${relativePosition}% + var(--line-height) - 5px)`;
                timeBarL.classList.add(`urgency_${item.from_urgency_level}`);

                groupContainer.appendChild(timeBarL);
            }

            if (item.from_urgency_level === item.to_urgency_level) {
                const lastBar = groupContainer.lastElementChild;
                lastBar.style.width = itemIndex < (group.length - 1)
                    ? `calc(${lastBar.offsetWidth}px + ${(group[Number(itemIndex)+1].time - item.time) / timeRange * 100}%)`
                    : `calc(${lastBar.offsetWidth}px + ${100 - relativePosition}%)`;
            } else {
                timeBar.style.marginLeft = relativePosition + "%";
                timeBar.style.width = itemIndex < (group.length - 1)
                    ? `calc(${(group[Number(itemIndex)+1].time - item.time) / timeRange * 100}% - 5px)`
                    : 100 - relativePosition + "%";
                timeBar.classList.add(`urgency_${item.to_urgency_level}`);
                groupContainer.appendChild(timeBar);
            }
        }
        if (!document.getElementById(groupName).querySelector('.info div:not(.urgency_-1):not(.infoBar)')) {
            document.getElementById(groupName).style.display = "none";
        }
    }
}

const alert = (info) => {
    console.log(info)
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

const submitForm = (event, form, url, alertInfo) => {
    event.preventDefault();

    const formData = new FormData(form);

    const putData = {};

    formData.forEach((value, key) => {
        if (!(value instanceof File)) {
            switch(value) {
                case "[]":
                    putData[key] = [];
                    break;
                case "{}":
                    putData[key] = {};
                    break;
                default:
                    putData[key] = value;
            }
        };
    });

    console.log(putData)

    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json', // Set the content type to form data
        },
        body: JSON.stringify(putData)
    })
    .then(response => response.json())
    .then(data => {
        alertInfo ? alert(alertInfo) : location.reload();
        
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

loadGrid();