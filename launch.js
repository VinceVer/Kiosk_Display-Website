const axios = require('axios');
var fs = require('fs-extra');
var fsp = require('fs-extra').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
var readline = require('readline');
const tar = require('tar');
const zlib = require('zlib');

const username = 'VinceVer';
const token = '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'; // Generate one from your GitHub account settings

const repositoryOwner = 'VinceVer'; // Replace with the owner of the repository
const repositoryName = 'Kiosk_Display'; // Replace with the name of your repository
const branch = 'master'

const downloadPath = path.join(__dirname, 'storage', 'update.tar.gz');
const extractTo = path.join(__dirname, 'storage', 'update');

if (!fs.existsSync(__dirname+"/storage/update")) {
    fs.mkdirSync(__dirname+"/storage/update", { recursive: true });
}

function promptAndSaveData(prompt) {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        process.stdout.write('\x1b[1A');
        process.stdout.write('\x1b[K');

        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer.trim("\n"));
        });
    });
}

function setLine(text) {
    process.stdout.write('\x1b[1A');
    process.stdout.write('\x1b[K');
    process.stdout.write(text);
    process.stdout.write('\x1b[0m');
}

const getLatestRelease = async () => {
    console.log("\n")

    try {
        // Website:
        let currentTagName = "v"+JSON.parse(fs.readFileSync('package.json')).version;
        let response = await axios.get(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}-Website/releases/latest`);
        let latestTagName = response.data.tag_name;

        if (latestTagName !== currentTagName && latestTagName > currentTagName) {
            let answer = "";
            while (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "n") {
                answer = await promptAndSaveData(`A new version for the WEBSITE is found. Would you like to update the WEBSITE? (${currentTagName} -> ${latestTagName}) (y|n): `)
            }

            if (answer === "y") {
                await downloadFiles(latestTagName, "Website");
                const folderName = await extractTarball(downloadPath, extractTo);
                console.log(folderName)
                await fsp.unlink(downloadPath);
                await copyContents(path.join(extractTo, folderName), __dirname);
                setupNewFiles();
            } else {
                console.log("Skipping update...");
                // runStartFile();
            }
        }

        // Database:
        currentTagName = "v"+JSON.parse(fs.readFileSync(__dirname+'/../.database/package.json')).version;
        response = await axios.get(`https://api.github.com/repos/${repositoryOwner}/${repositoryName}-Database/releases/latest`);
        latestTagName = response.data.tag_name;

        if (latestTagName !== currentTagName && latestTagName > currentTagName) {
            let answer = "";
            while (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "n") {
                answer = await promptAndSaveData(`A new version for the DATABASE is found. Would you like to update the DATABASE? (${currentTagName} -> ${latestTagName}) (y|n): `)
            }

            if (answer === "y") {
                await downloadFiles(latestTagName, "Database");
                const folderName = await extractTarball(downloadPath, extractTo);
                await fsp.unlink(downloadPath);
                await copyContents(path.join(extractTo, folderName), __dirname+'/../.database');
                setupNewFiles();
            } else {
                console.log("Skipping update...");
                // runStartFile();
            }
        }

        // Start:
        runStartFile();
    } catch (error) {
        console.error('Error fetching latest release:', error.message);
    }
};

const downloadFiles = (version, type) => {
    setLine('\x1b[36mDownloading files...\r');
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios({
                method: 'get',
                url: `https://api.github.com/repos/${repositoryOwner}/${repositoryName}-${type}/tarball/${branch}`,
                responseType: 'stream'
            });
    
            // Save the downloaded archive to a file
            const writer = fs.createWriteStream(downloadPath);

            response.data.pipe(writer);

            await new Promise((resolve2, reject2) => {
                writer.on('finish', resolve2);
                writer.on('error', reject2);
            });

            resolve();
        } catch (error) {
            console.error('Error downloading files:', error.message);
            reject(error);
        }
    });
}

const extractTarball = async (tarballPath, extractTo) => {
    setLine('\x1b[36mExtracting files...\r');
    try {
        // Create a read stream for the downloaded tarball
        const tarballReadStream = fs.createReadStream(tarballPath);

        // Pipe the tarball read stream through zlib to extract its contents
        const extractor = tar.x({ cwd: extractTo });
        tarballReadStream.pipe(zlib.createGunzip()).pipe(extractor);

        return new Promise((resolve, reject) => {
            extractor.on('end', async () => {
                try {
                    // Read the contents of the extraction destination directory
                    const contents = await fsp.readdir(extractTo);
            
                    // Get the name of the first entry (assumed top-level directory)
                    const extractedFolderName = contents[0];
                    console.log('Extracted folder name:', extractedFolderName);
        
                    resolve(extractedFolderName);
                } catch (readDirError) {
                    reject(readDirError);
                }
            });
            extractor.on('error', reject);
        });
    } catch (error) {
        console.error('Error extracting tarball:', error.message);
        throw error;
    }
};

const copyContents = async (source, destination) => {
    setLine('\x1b[36mInstalling updated files...\r');
    return new Promise(async (resolve, reject) => {
        try {
            // Copy all contents of the source directory to the destination directory
            await fs.copy(source, destination, {
                overwrite: true, // Overwrite files if they already exist in the destination
                errorOnExist: false, // Don't throw an error if destination files exist (overwrite instead)
            });

            try {
                await fs.remove(source);
            } catch (err) {
                reject(err);
            }

            console.log('Update installed successfully.');
            resolve();
        } catch (error) {
            console.error('Error copying contents:', error.message);
            reject(error);
        }
    })
};

const setupNewFiles = () => {
    setLine('\x1b[36mVerifying...\r');
    return new Promise(async resolve => {
        try {
            const paths = JSON.parse(fs.readFileSync('storage/single/paths.json'));

            for (let item of paths.add) {
                await fsp.access(__dirname+`/../${item.path}`, fs.constants.F_OK, async (err) => {
                    if (err) {
                        console.log("Adding file: ", item.file);
                        await fsp.rename(__dirname+`/storage/single/${item.file}`, `../${item.path}/${item.file}`);
                    } else {
                        await fsp.unlink(__dirname+`/storage/single/${item.file}`);
                    }
                });
            }

            for (let item of paths.del) {
                await fsp.access(`../${item.path}`, fs.constants.F_OK, async (err) => {
                    if (!err) {
                        console.log("Removing old file: ", item.path)
                        await fsp.unlink(__dirname+`/../${item.path}`);
                    }
                });
            }

            resolve();
        } catch (err) {
            resolve();
        }
    });
}

getLatestRelease();

function runStartFile() {
    const fullPath = path.join(__dirname, 'bin', 'start.bat');

    exec(`start cmd /c ${fullPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing .bat file: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}