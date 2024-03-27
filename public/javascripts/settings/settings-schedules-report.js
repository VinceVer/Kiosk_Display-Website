const tableOptions = ["AND", "INCLUDES", "UNLESS", "NOT", "OR", "<", ">", "!=", "="];
let inputField, hrefType, hrefIndex;
const conditionsField = document.getElementById("conditions");
const schedule_data = JSON.parse(document.getElementById("data_storage").dataset.schedule_data);
const index_value = Number(document.getElementById("data_storage").dataset.index);

const loadHEAD = async () => {
    for (let property in schedule_data.reports[index_value]) {
        if (property === "email_recipients") {
            for (let recipient of schedule_data.reports[index_value].email_recipients) {
                document.getElementById("recipientList").innerHTML += `<button type='button' class='gridTile small' onclick='removeEmail(this)'>${recipient}</button>`;
            }
            continue;
        }
        document.querySelector(`input[name=${property}]`).value = schedule_data.reports[index_value][property];
    }
}

const loadInputForm = () => {
    inputField = document.getElementById("conditionInput");
    hrefType = location.href.split("?")[1].split("&")[0].split("=")[1];

    if (!location.href.includes("/conditions/add?") && hrefType !== "misc") {
        hrefIndex = location.href.split("?")[1].split("&")[1].split("=")[1];
        const conditionObject = data.urgency_conditions[hrefType].inputs[hrefIndex];

        document.getElementById("nameInput").value = conditionObject.name;
        for (let type of conditionObject.applies_to) {
            document.getElementById("applyInput").value = (type === "*" ? "ALL" : type) + ",";
            checkAppliesTo();
        }
        document.getElementById("conditionInput").value = convertJsToInput(conditionObject.condition)

        updateCodeBar();
    } else if (hrefType === "misc") {
        hrefIndex = location.href.split("?")[1].split("&")[1].split("=")[1];
        const condition = data.misc_conditions[location.href.split("?")[1].split("&")[1].split("=")[1]];
        document.getElementById("nameInput").value = location.href.split("?")[1].split("&")[1].split("=")[1].split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        document.getElementById("applyInput").value = "ALL,";
        document.getElementById("conditionInput").value = convertJsToInput(condition);

        checkAppliesTo();
        updateCodeBar();
    }

    for (let key in data.table_naming) {
        tableOptions.push(key.split('_').map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join('_'))
    }

    /* Applies_to Handler. */
    document.getElementById("applyInput").addEventListener("keydown", async (e) => {
        if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault()
            e.target.value += ",";
            checkAppliesTo();
        }
    });
    /* ------------------- */
}

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const emailInput = (field) => {
    const email = field.value.slice(0, field.value.length-1).replaceAll(" ","");
    
    if (email === "") {
        document.getElementById("invalid_email").style.display = "none";
        return;
    }
    if (!isValidEmail(email)) {
        document.getElementById("invalid_email").style.display = "block";
        return;
    }
    document.getElementById("invalid_email").style.display = "none";

    if (field.value.includes(",")) {
        field.value = "";
        if (!document.getElementById("recipientList").innerHTML.includes(`>${email}<`)) {
            document.getElementById("recipientList").innerHTML += `<button type='button' class='gridTile small' onclick='removeEmail(this)'>${email}</button>`;
            document.querySelector('#recipientList input[name=email_recipients]').value += `${email}, `
        }
    }
}

const getAlertInfo = () => {
    return { title: "Success", description: `The schedule has been ${title.startsWith("Edit") ? "updated" : "added"} successfully.`, buttons: [{text: "OK", action: () => {location.href = schedulesURL}}] }
}

const removeEmail = (element) => {
    document.querySelector('#recipientList input[name=email_recipients]').value = document.querySelector('#recipientList input[name=email_recipients]').value.replace(`${element.innerText}, `,"");
    element.remove();
}

const uploadScheduleData = (event, form, url, alertInfo) => {
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
                    putData[key] = isNaN(Number(value)) ? value : Number(value);
            }
        };
    });

    putData.email_recipients = putData.email_recipients.split(", ").pop();

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