const loadHEAD = () => {
    //if (!writeAccess) {location.href = "/settings"}

    document.body.style.backgroundImage = "url(/images/Background.png)";

    document.getElementById("display").style.visibility = "visible";
    setupImagePreview();
    setupInputHandlers();
}

const setupImagePreview = () => {
    document.querySelector('.background_input').addEventListener("change", (event) => {
        const file = event.target.files[0];
        console.log("file:", file)

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.body.style.backgroundImage = `url(${event.target.result})`;
            }
            reader.readAsDataURL(file);

        } else {
            document.body.style.backgroundImage = "url(/images/Background.png)";
        }
    });
}

const setupInputHandlers = () => {
    document.querySelector('input[name=background_opacity]').addEventListener("input", (element) => {
        document.getElementById("brightnessFilter").style.backgroundColor = `rgba(10, 10, 10, ${1 - (element.target.value / 100)})`
    });
}

const uploadLayoutData = async (event, form, url, alertInfo) => {
    document.querySelector('#progressButton input').value = "...";
    document.querySelector('#progressButton').disabled = true;
    document.querySelector('#progressButton input').disabled = true;

    event.preventDefault();

    const formData = new FormData(form);

    if (formData.get("background").name !== "") {
        await uploadFile(formData.get("background"), "Background.png", '#progressButton .progressBar');
    }

    const putData = {key: localStorage.getItem("config_key")};
    formData.forEach((value, key) => {
        if (!(value instanceof File)) {
            putData[key] = isNaN(Number(value)) ? value : Number(value);
        };
    });

    putData.show_labels = putData.show_labels ? true : false;
    putData.align_labels = putData.align_labels ? true : false;

    console.log(putData)

    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(putData)
    })
    .then(response => response.json())
    .then(data => {
        alert(alertInfo)
        console.log(data);
    })
    .catch(error => {
        // Handle errors here
        console.error('Error:', error);
    });
}