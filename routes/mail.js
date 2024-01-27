const nodemailer = require('nodemailer');
var fs = require('fs');
var yaml = require('js-yaml');

const saveEmail = (to) => {
    const misc_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/misc.json'));
    if (!misc_data.emails) misc_data.emails = [];
    
    const emailList = to.replaceAll(" ","").split(",");
    for (let email of emailList) {
        if (misc_data.emails.includes(email)) misc_data.emails.splice(misc_data.emails.indexOf(email), 1);
        misc_data.emails.push(email);
    }

    fs.writeFileSync(__dirname+'/../storage/misc.json', JSON.stringify(misc_data));
}

const sendEmail = (to, subject, text, file, extension) => {
    saveEmail(to);

    const yamlData = fs.readFileSync(__dirname+'/../../.database/bin/.imap-config.yaml', 'utf8');
    const imapConfig = yaml.load(yamlData);
    const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));

    // Create a transporter with your SMTP settings
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: imapConfig.user, // Your email address
            pass: imapConfig.password // Your password
        }
    });

    // Define the email content
    let mailOptions = {
        from: imapConfig.user, // Sender address
        to: to.replaceAll(" ","").split(","), // List of recipients
        subject: `[Report] ${subject}`, // Subject line
        text: `This email was generated and sent using the ${config_data.location} Report Generator.\n\n${text}`, // Plain text body
        attachments: [
            {
                filename: `report${extension}`,
                path: file
            }
        ]
    };

    // Send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error occurred:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

const submitReport = (text) => {
    try {
        const yamlData = fs.readFileSync(__dirname+'/../../.database/bin/.imap-config.yaml', 'utf8');
        const imapConfig = yaml.load(yamlData);
        const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));

        // Create a transporter with your SMTP settings
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: imapConfig.user, // Your email address
                pass: imapConfig.password // Your password
            }
        });

        // Define the email content
        let mailOptions = {
            from: imapConfig.user, // Sender address
            to: "service.vanced08@gmail.com",
            subject: `[Issue] ${config_data.location}`, // Subject line
            text: `This email was sent by the ${config_data.location} issue tracker.\n\nReport:\n${text}`, // Plain text body
            attachments: []
        };

        // Send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error occurred:', error);
                return false;
            } else {
                console.log('Email sent:', info.response);
                return true;
            }
        });
    } catch (error) {
        return false;
    }
}

module.exports = {
    sendEmail: sendEmail
}