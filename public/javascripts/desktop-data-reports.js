const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);
const misc_data = JSON.parse(document.getElementById("data_storage").dataset.misc_data);
const files = JSON.parse(document.getElementById("data_storage").dataset.files);
const email_recipient = document.getElementById("email_recipient");

const load = async () => {
    for (let fileIndex in files) {
        const file = files[fileIndex];
        const fileExtension = file.split(".")[file.split(".").length-1];
        let fileName = file.replace("."+fileExtension, "");

        const fileBar = document.querySelector('#templates .file').cloneNode(true);
        fileBar.querySelector('img.icon').src = `/images/file-icon.${fileExtension}.svg`;
        if (fileName.length > 20) {fileName = fileName.slice(0,18).trim()+".."}
        fileBar.querySelector('p').innerText = fileName+"."+fileExtension;
        fileBar.querySelector('img:not(.icon)').dataset.href = file;

        document.getElementById("all_reports").appendChild(fileBar);

        if (fileIndex < 5) {document.getElementById("latest_reports").appendChild(fileBar.cloneNode(true))};
    }

    let background_file = getCookie("background_file");
    console.log(background_file, "&", getCookie(`background_extension[${config_data.location}]`));
    if (!background_file.includes(".")) background_file = `${background_file}.${getCookie(`background_extension[${config_data.location}]`)}`;
    document.body.style.backgroundImage = `url(/images/${background_file})`;

    if (misc_data.emails) {
        for (let email of misc_data.emails) {
            document.getElementById("email_select").innerHTML = `<option value="${email}">${email}</option>` + document.getElementById("email_select").innerHTML;
        }
        document.getElementById("email_select").innerHTML = `<option value="" style="color: var(--gray70)" selected=true>Quick-add emails:</option>` + document.getElementById("email_select").innerHTML;
    } else {
        document.getElementById("email_select").style.display = "none";
    }

    document.getElementById("email_recipient").addEventListener('input', (e) => {
        e.target.style.width = measureTextWidth(e.target.value)+10+"px";

        document.querySelectorAll('#email_select option:not([value=""])').forEach(option => {
            if (e.target.value.includes(option.value)) {
                option.style.color = "var(--text-color1)"
            } else {
                option.style.color = "var(--text-color2)"
            }
        });
    });
}

const addRecipient = (email) => {
    document.getElementById('email_recipient').value += /,(\s*)$|^$/.test(document.getElementById('email_recipient').value) ? email : `, ${email}`;
    document.getElementById("email_select").value = "";
    document.getElementById('email_recipient').dispatchEvent(new Event("input"));
}

const downloadReport = (file) => {
    // Make a request to the server endpoint to download the file
    fetch('/download/report/'+file)
        .then(response => {
            // Check if the response is successful
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Trigger download by creating a link
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file; // Set the filename for download
            document.body.appendChild(a);
            a.click();
            a.remove(); // Clean up after download
        })
        .catch(error => {
            console.error('Error:', error);
            // Handle error scenarios here
        });
}

function measureTextWidth(text) {
    // Create a temporary span element to measure text width
    const span = document.createElement('span');
    span.style.fontSize = "1.2rem"
    span.style.visibility = "hidden";
    span.style.whiteSpace = "pre"; // Preserve spaces
  
    // Set the text content of the span
    span.textContent = text;
  
    // Append the span to the document body to measure the width
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
  
    return width;
}

const openPanel = (panel) => {
    document.getElementById("container").style.left = -panel * 100 + "vw";
}

const submitSettings = (event, form, url, alertInfo) => {
    event.preventDefault();
    document.getElementById("container").style.display = "none";
    document.querySelector('div[name=loading]').style.display = "block";

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
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Set the content type to form data
        },
        body: JSON.stringify(putData)
    })
    .then(response => response.json())
    .then(data => {
        alert({title: `Success`, description: `The report has successfully been generated.`,
            buttons: [{text: "Close", invert: 0.85, action: () => {location.reload()}},
            {text: "Download", action}]
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

load();

document.getElementById("extension_select").addEventListener('input', () => {
    document.getElementById("extension_label").innerText = document.getElementById("extension_select").value
});