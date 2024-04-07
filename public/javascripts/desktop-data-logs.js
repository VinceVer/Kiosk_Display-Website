
const config_data = JSON.parse(document.getElementById("data_storage").dataset.config_data);

const load = () => {
    let background_file = getCookie("background_file");
    console.log(background_file, "&", getCookie(`background_extension[${config_data.location}]`));
    if (!background_file.includes(".")) background_file = `${background_file}.${getCookie(`background_extension[${config_data.location}]`)}`;
    document.body.style.backgroundImage = `url(images/${background_file})`;
}

load();