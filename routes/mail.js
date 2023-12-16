const nodemailer = require('nodemailer');
var fs = require('fs');

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
    saveEmail();

    const yamlData = fs.readFileSync('../../.database/bin/.imap-config.yaml', 'utf8');
    const imapConfig = yaml.load(yamlData);
    const config_data = JSON.parse(fs.readFileSync(__dirname+'/../storage/config.json'));

    // Create a transporter with your SMTP settings
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: imapConfig.email, // Your email address
            pass: imapConfig.app_password // Your password
        }
    });

    // Define the email content
    let mailOptions = {
        from: 'cutemonitordev@gmail.com', // Sender address
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

module.exports = {
    sendEmail: sendEmail
}