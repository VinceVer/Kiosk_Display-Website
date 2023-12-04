const UUID = getCookie("UUID");
const urgency_tagged = {};
console.log("Loading Layout...");

const load = () => {
    setupImagePreview();
    setupInputHandlers();

    if (getCookie("unlocked_green") === "true") {
        document.querySelector('select[name=theme]').innerHTML += `<option value="green" ${getCookie("theme") === "green" ? "selected" : ""}>Green</option>`;
    }
    
    document.getElementById("settingsInput").style.display = "flex";
    setTimeout(function() {
        document.getElementById("settingsInput").style.opacity = 1;
    }, 0);
}

const setupImagePreview = () => {
    document.querySelector('.background_input').addEventListener("change", (event) => {
        const file = event.target.files[0];
        const opacity = 1 - document.querySelector('input[name=background_opacity]').value / 100;

        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                backgroundURL = event.target.result;
                document.body.style.backgroundImage = `url(${backgroundURL})`;
            }
            reader.readAsDataURL(file);

        } else {
            document.body.style.backgroundImage = `url(/images/${document.getElementById("data_storage").dataset.background_file})`;
        }
    });
}

const setupInputHandlers = () => {
    document.querySelector('input[name=background_opacity]').addEventListener("input", (event) => {
        document.getElementById("brightnessFilter").style.backgroundColor = `rgba(10, 10, 10, ${1 - event.target.value / 100})`
    });
    document.querySelector('input[name=tile_size]').addEventListener("input", (event) => {
        document.documentElement.style.setProperty('--tile-size', event.target.value / 20 + "rem");
        calculateSpan();
    });
    document.querySelector('input[name=tag_size]').addEventListener("input", (event) => {
        document.documentElement.style.setProperty('--tag-size', event.target.value / 20 + "rem");
        calculateSpan();
    });
    document.querySelector('select[name=theme]').addEventListener("input", (event) => {
        document.getElementById("themeLink").href = `/stylesheets/theme-${event.target.value}.css`
        calculateSpan();
    });

    document.querySelectorAll('.checkbox').forEach(element => {
        const input = element.querySelector('input');
        element.addEventListener("click", () => {
            input.checked = !input.checked;
            document.documentElement.style.setProperty(`--${input.name.replace("_","-")}`, input.checked ? "inline-block" : "none")
        });
        input.addEventListener("input", () => {
            document.documentElement.style.setProperty(`--${input.name.replace("_","-")}`, input.checked ? "inline-block" : "none")
        });
    });

    document.querySelectorAll('.filter').forEach(element => {
        element.addEventListener("click", (event) => {
            event.target.classList.toggle("selected");

            urgency_tagged[event.target.dataset.urgency_level] = event.target.classList.contains("selected") ? 1 : 0;

            document.querySelectorAll(".urgency_"+event.target.dataset.urgency_level).forEach(tile => {
                tile.style.setProperty("--identifier-opacity", urgency_tagged[event.target.dataset.urgency_level]);
            });

            if (urgency_tagged[1] === 1 || urgency_tagged[2] === 1) {
                updateLabels(12, 1);
            } else {
                updateLabels(12, 0);
            }
            if (urgency_tagged[2] === 1 || urgency_tagged[4] === 1) {
                updateLabels(42, 1);
            } else {
                updateLabels(42, 0);
            }
        });
    });
}

const updateLabels = (urgency, opacity) => {
    document.querySelectorAll(".urgency_"+urgency).forEach(tile => {
        tile.style.setProperty("--identifier-opacity", opacity);
    });
}

const uploadFile = (file, name, progressBar) => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', "/imageUpload");

        xhr.upload.addEventListener("progress", ({loaded, total}) => {
            if (document.querySelector(progressBar)) {
                let fileLoaded = Math.floor((loaded / total) * 100) / 100;
                document.querySelector(progressBar).style.width = (Math.round(document.querySelector(progressBar).parentNode.offsetWidth * fileLoaded)) + "px";
            }
        });

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                reject(new Error("Upload failed. Status code: " + xhr.status));
            }
        };
      
        xhr.onerror = () => {
            reject(new Error("Network error occurred during the upload"));
        };

        const formData = new FormData()
        formData.append('file', file, name);

        xhr.send(formData);
    });
}

const uploadLayoutData = async (event, form, alertInfo) => {
    event.preventDefault();

    const expirationDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000);

    document.querySelector('#progressButton input').value = "...";
    document.querySelector('#progressButton').disabled = true;
    document.querySelector('#progressButton input').disabled = true;

    const formData = new FormData(form);

    const putData = {};
    if (formData.get("background").name !== "") {
        const fileName = formData.get("background").name.split('.');
        putData.background_file = UUID+"_BACKGROUND";
        putData[`background_extension[${config_data.location}]`] = fileName[fileName.length-1]
        await uploadFile(formData.get("background"), putData.background_file+"."+fileName[fileName.length-1], '#progressButton .progressBar');
    }

    formData.forEach((value, key) => {
        if (!(value instanceof File)) {
            putData[key] = isNaN(Number(value)) ? value : Number(value);
        };
    });

    for (let item in urgency_tagged) {
        putData[`urgency${String(item.replace("-","_"))}_tag`] = urgency_tagged[item];
    }

    putData.label_locations = putData.label_locations ? true : false;
    putData.align_labels = putData.align_labels ? true : false;
    putData.tile_animations = putData.tile_animations ? true : false;

    for (let item in putData) {
        console.log(item, putData[item])
        document.cookie = `${item}=${putData[item]}; expires=${expirationDate.toUTCString()}; path=/`;
    }

    alert(alertInfo);
}

load();