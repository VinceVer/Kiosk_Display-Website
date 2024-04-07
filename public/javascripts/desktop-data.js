const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);
let status_database = JSON.parse(document.getElementById("data_storage").dataset.status_database);
let misc_data = JSON.parse(document.getElementById("data_storage").dataset.misc_data);
const dataBar = document.getElementById("dataBar");
let groupedData = {};

$(function() {
    $("#start_time").datetimepicker();
    $("#end_time").datetimepicker();
});

const loadGrid = async () => {
    const optPanelButton = document.getElementById("optPanelButton");
    const optButton = document.getElementById("optButton");

    for (let group of config_data.groups) {
        const newPanel = optPanelButton.cloneNode(true);
        newPanel.id = group.name+"_button";
        newPanel.querySelector('p').innerText = group.name;
        document.getElementById("options_1").appendChild(newPanel);

        const panelDiv = document.createElement('div');

        for (let location of group.locations) {
            const newButton = optButton.cloneNode(true);
            newButton.id = location.name;
            newButton.querySelector('p').innerText = location.name;
            newButton.addEventListener("input", (event) => {
                newPanel.querySelector('input').checked = panelDiv.querySelector('input:not(:checked)') ? false : true;
            });
            panelDiv.appendChild(newButton);
        }

        newPanel.addEventListener("click", (event) => {
            if (event.target.type === "checkbox") {
                if (event.target.checked) {
                    if (!newPanel.classList.contains("open")) newPanel.classList.add("open");
                    panelDiv.querySelectorAll('input').forEach(element => element.checked = true)
                } else {
                    panelDiv.querySelectorAll('input').forEach(element => element.checked = false)
                }
            } else {
                newPanel.classList.toggle("open");
            }
        });

        document.getElementById("options_1").appendChild(panelDiv);
        panelDiv.style.setProperty("--max-height", panelDiv.scrollHeight+"px")
    }
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

    fetch(base+url, {
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