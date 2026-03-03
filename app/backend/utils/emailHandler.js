const nodemailer = require('nodemailer');
const { getRecruiterEmailTemplate } = require('../templates/recruiterEmail');
const { getPlayerEmailTemplate } = require('../templates/playerEmail');

/**
 * Email configuration
 * IMPORTANT: Set up environment variables for security
 * GMAIL_USER: Your Gmail address
 * GMAIL_APP_PASSWORD: Gmail App Password (not your regular password)
 * 
 * To create Gmail App Password:
 * 1. Go to Google Account settings
 * 2. Security > 2-Step Verification (must be enabled)
 * 3. App passwords > Select app: Mail, Select device: Other
 * 4. Copy the generated 16-character password
 */

// Create transporter with Gmail SMTP
function createTransporter() {
    const gmailUser = process.env.GMAIL_USER || 'your-email@gmail.com';
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || 'your-app-password';

    if (gmailUser === 'your-email@gmail.com' || gmailAppPassword === 'your-app-password') {
        console.warn('⚠️  WARNING: Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: gmailUser,
            pass: gmailAppPassword
        }
    });
}

/**
 * Send email to talent scout/recruiter with matched player profiles
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.scoutName - Name of the scout
 * @param {string} options.searchDescription - Description of the search
 * @param {Array} options.players - Array of matched players
 * @returns {Promise} Email send result
 */
async function sendRecruiterEmail(options) {
    try {
        const { to, scoutName, searchDescription, players } = options;

        if (!to || !scoutName || !players || players.length === 0) {
            throw new Error('Missing required fields: to, scoutName, and players are required');
        }

        const transporter = createTransporter();

        const htmlContent = getRecruiterEmailTemplate({
            scoutName,
            searchDescription: searchDescription || 'Your custom search criteria',
            players,
            totalMatches: players.length
        });

        const mailOptions = {
            from: `"Sports Stats API" <${process.env.GMAIL_USER || 'your-email@gmail.com'}>`,
            to: to,
            subject: `🎯 ${players.length} Player${players.length > 1 ? 's' : ''} Match Your Search Criteria`,
            html: htmlContent
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Recruiter email sent to ${to}. Message ID: ${result.messageId}`);

        return {
            success: true,
            messageId: result.messageId,
            recipient: to
        };
    } catch (error) {
        console.error('❌ Error sending recruiter email:', error.message);
        throw new Error(`Failed to send recruiter email: ${error.message}`);
    }
}

/**
 * Send email to player notifying them of scout interest
 * @param {Object} options - Email options
 * @param {string} options.to - Player email address
 * @param {string} options.playerName - Name of the player
 * @param {string} options.scoutName - Name of the scout
 * @param {string} options.scoutEmail - Scout's email address
 * @param {string} options.scoutOrganization - Scout's organization
 * @param {string} options.message - Optional message from scout
 * @returns {Promise} Email send result
 */
async function sendPlayerEmail(options) {
    try {
        const { to, playerName, scoutName, scoutEmail, scoutOrganization, message } = options;

        if (!to || !playerName || !scoutName || !scoutEmail || !scoutOrganization) {
            throw new Error('Missing required fields: to, playerName, scoutName, scoutEmail, and scoutOrganization are required');
        }

        const transporter = createTransporter();

        const htmlContent = getPlayerEmailTemplate({
            playerName,
            scoutName,
            scoutEmail,
            scoutOrganization,
            message: message || ''
        });

        const mailOptions = {
            from: `"Sports Stats API" <${process.env.GMAIL_USER || 'your-email@gmail.com'}>`,
            to: to,
            subject: `🌟 A Talent Scout from ${scoutOrganization} is Interested in You!`,
            html: htmlContent,
            replyTo: scoutEmail
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Player notification email sent to ${to}. Message ID: ${result.messageId}`);

        return {
            success: true,
            messageId: result.messageId,
            recipient: to
        };
    } catch (error) {
        console.error('❌ Error sending player email:', error.message);
        throw new Error(`Failed to send player email: ${error.message}`);
    }
}

/**
 * Send email based on template type
 * @param {string} templateType - 'recruiter' or 'player'
 * @param {Object} data - Email data
 * @returns {Promise} Email send result
 */
async function sendEmail(templateType, data) {
    if (templateType === 'recruiter') {
        return await sendRecruiterEmail(data);
    } else if (templateType === 'player') {
        return await sendPlayerEmail(data);
    } else {
        throw new Error(`Invalid template type: ${templateType}. Use 'recruiter' or 'player'`);
    }
}

/**
 * Test email configuration
 * @returns {Promise<boolean>} True if configuration is valid
 */
async function testEmailConfig() {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email configuration is valid and ready to send emails');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
        return false;
    }
}

module.exports = {
    sendRecruiterEmail,
    sendPlayerEmail,
    sendEmail,
    testEmailConfig
};
