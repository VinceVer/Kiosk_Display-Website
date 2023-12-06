var fs = require('fs');
var fsp = require('fs').promises;
var readline = require('readline');
var yaml = require('js-yaml');
const { exec } = require('child_process');
const path = require('path');

/**
 * Initialize information:
 */

const yamlData = fs.readFileSync('../.database/bin/.imap-config.yaml', 'utf8');
const imapConfig = yaml.load(yamlData);
const config_data = JSON.parse(fs.readFileSync('./storage/config.json'));
const oauth_data = JSON.parse(fs.readFileSync('./storage/oauth.json'));
const promptTotal = 8;
let promptCounter = 0;

function promptAndSaveData(prompt) {
    promptCounter++;
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        process.stdout.write('\x1b[1A\x1b[1A\x1b[1A\x1b[1A\x1b[1A');
        process.stdout.write('\x1b[K\x1b[K\x1b[K\x1b[K\x1b[K');
        process.stdout.write(`\n\x1b[31mPrompt ${promptCounter} / ${promptTotal}:\x1b[0m\n`)

        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer.trim("\n"));
        });
    });
}


async function Setup() {
    await setupNewFiles();

    const promptedData = {};
    process.stdout.write('\x1b[2J');
    process.stdout.write('\x1b[34m---------------------------------------------------------------------------\x1b[36m');
    console.log("\n| To complete the setup, enter the prompted information in this terminal. |\n| Leave blank by only pressing Enter to use the default.                  |");
    process.stdout.write('\x1b[34m---------------------------------------------------------------------------\x1b[0m');
    console.log("\n\n\n\n\n")

    promptedData.email = await promptAndSaveData(`Enter the email adress to fetch status updates from (example: email_adress@service.com):\nDefault = ${imapConfig.user}\n > `);
    promptedData.app_password = await promptAndSaveData(`Enter the app password for the email account (example: abcd efgh ijkl mnop):\nDefault = **** **** **** ****\n > `);
    promptedData.location = await promptAndSaveData(`Eter the location where the display will be used (example: Antarctica Airport):\nDefault = ${config_data.location}\n > `);
    promptedData.desktop_key = await promptAndSaveData(`Enter the password for the desktop version:\nDefault = ${oauth_data.passwords.desktop ? "*****" : "admin"}\n > `);
    promptedData.mobile_key = await promptAndSaveData(`Enter the password for the mobile version:\nDefault = ${oauth_data.passwords.mobile ? "*****" : "user"}\n > `);
    promptedData.settings_key = await promptAndSaveData(`Enter the password for the settings panel:\nDefault = ${oauth_data.passwords.desktop ? "*****" : "admin"}\n > `);
    promptedData.reset_database1 = await promptAndSaveData(`If you want to reset the active database, type exactly: "Reset_Active_Database_.json"\nOtherwise, leave blank\n > `);
    promptedData.reset_database2 = await promptAndSaveData(`If you want to reset the database history, type exactly: "Reset_Database_History_.db"\nOtherwise, leave blank\n > `);

    process.stdout.write('\x1b[2J');

    try {
        if (promptedData.email.replaceAll(" ","")) imapConfig.user = promptedData.email;
        if (promptedData.app_password.replaceAll(" ","")) imapConfig.password = promptedData.app_password;
        if (promptedData.location.replaceAll(" ","")) config_data.location = promptedData.location;
        if (promptedData.desktop_key) oauth_data.passwords.desktop = promptedData.desktop_key;
        if (promptedData.mobile_key) oauth_data.passwords.mobile = promptedData.mobile_key;
        if (promptedData.settings_key) oauth_data.passwords.settings = promptedData.settings_key;

        fs.writeFileSync('../.database/bin/.imap-config.yaml', yaml.dump(imapConfig));
        fs.writeFileSync('./storage/config.json', JSON.stringify(config_data, null, "\t"));
        fs.writeFileSync('./storage/oauth.json', JSON.stringify(oauth_data, null, "\t"));

        try {
            await fsp.rename('storage/single/Start_toMove.bat', '../Start.bat');
            await fsp.unlink('../Installer.bat');
        } catch (error) {}

        process.stdout.write('\x1b[32mSetup Completed.\x1b[0m The Database and Website will start in 10 seconds.');
        console.log('To cancel, press "CTRL + C"');
        console.log("Setup finished. Executing program in 10 seconds.");

        setTimeout(function() {
            runStartFile();
        }, 10000);
    } catch (error) {
        console.log("An unexpected error occurred:", error);
    }
};

Setup();

const setupNewFiles = () => {
    return new Promise(async resolve => {
        try {
            const paths = JSON.parse(fs.readFileSync('storage/single/paths.json'));

            for (let item of paths.add) {
                await fsp.access(`../${item.path}`, fs.constants.F_OK, async (err) => {
                    if (err) {
                        await fsp.rename(`storage/single/${item.file}`, `../${item.path}`);
                    } else {
                        await fsp.unlink(`storage/single/${item.file}`);
                    }
                });
            }

            for (let item of paths.del) {
                await fsp.access(`../${item.path}`, fs.constants.F_OK, async (err) => {
                    if (!err) await fsp.unlink(`../${item.path}`);
                });
            }

            resolve();
        } catch (err) {
            resolve();
        }
    });
}

function runStartFile() {
    const fullPath = path.join(__dirname, '..', 'start.bat');

    exec(`start cmd /c start.bat`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing .bat file: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}