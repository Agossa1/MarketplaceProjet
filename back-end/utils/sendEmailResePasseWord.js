import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from './logger.js';
import { validateEmail, validateToken } from './validators.js';

dotenv.config();

const userEmail = process.env.EMAIL_USERNAME || "biogeographierecherches@gmail.com";
const userPassword = process.env.EMAIL_PASSWORD || "fkrj jgmn svzc ibdw";
const platformName = process.env.PLATFORM_NAME || 'TokpaMarket';
const platformColor = process.env.PLATFORM_COLOR || '#007bff';

if (!userEmail || !userPassword) {
    logger.error('Les informations d\'authentification SMTP sont manquantes');
    console.error('Erreur : Les variables d\'environnement EMAIL_USER et EMAIL_PASS doivent être définies.');
    console.error('Veuillez suivre ces étapes pour résoudre le problème :');
    console.error('1. Créez un fichier .env à la racine du projet s\'il n\'existe pas déjà.');
    console.error('2. Ajoutez les lignes suivantes au fichier .env :');
    console.error('   EMAIL_USER=votre_email@gmail.com');
    console.error('   EMAIL_PASS=votre_mot_de_passe_d_application');
    console.error('3. Remplacez les valeurs par vos informations d\'authentification Gmail.');
    console.error('4. Redémarrez l\'application.');
    process.exit(1); // Arrête l'application
}

export const sendEmailResetPasswordLink = async ({ email, resetToken, expirationTime }) => {
    if (!validateEmail(email) || !validateToken(resetToken) || !Number.isInteger(expirationTime)) {
        throw new Error('Paramètres invalides');
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: { user: userEmail, pass: userPassword },
        });

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            from: `"${platformName}" <${userEmail}>`,
            to: email,
            subject: `Réinitialisation de votre mot de passe ${platformName}`,
            text: `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe sur ${platformName}. Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe : ${resetUrl}\n\nCe lien expirera dans ${expirationTime} heures.\n\nSi vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.\n\nCordialement,\nL'équipe ${platformName}`,
            html: `
                <!DOCTYPE html>
                <html lang="fr">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Réinitialisation de mot de passe</title>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .button { display: inline-block; padding: 10px 20px; color: #ffffff; background-color: ${platformColor}; text-decoration: none; border-radius: 5px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Réinitialisation de votre mot de passe ${platformName}</h1>
                            <p>Bonjour,</p>
                            <p>Vous avez demandé la réinitialisation de votre mot de passe sur ${platformName}. Veuillez cliquer sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
                            <p><a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a></p>
                            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
                            <p>${resetUrl}</p>
                            <p>Ce lien expirera dans ${expirationTime} heures.</p>
                            <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</p>
                            <p>Cordialement,<br>L'équipe ${platformName}</p>
                        </div>
                    </body>
                </html>
            `,
            headers: {
                'X-Mailer': 'TokpaMarket',
                'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
            }
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email de réinitialisation de mot de passe envoyé avec succès: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Erreur lors de l'envoi de l'email de réinitialisation de mot de passe: ${error.message}`);
        throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation de mot de passe');
    }
};