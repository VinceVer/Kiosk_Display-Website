const files = ["config.json", "misc.json", "status_database.json", "main-database.db"];

for (let file of files) {
    fetch(`/file/${file}?action=size`)
        .then(response => response.json())
        .then(data => {
            with (document.getElementById(file.replaceAll(".","_")).querySelector('.flexBar div')) {
                textContent = formatFileSize(data.size);
                style.display = "block";
            }
        })
}

const formatFileSize = (bytes) => {
    if (bytes < 1000000) {
        return Math.round(bytes/1000)+" kB";
    }
    bytes /= 1000;
    if (bytes < 1000000) {
        return Math.round(bytes/100)/10+" MB";
    }
    bytes /= 1000;
    if (bytes < 1000000) {
        return Math.round(bytes/100)/10+" GB";
    }
    bytes /= 1000;
    return Math.round(bytes/100)/10+" TB";
}