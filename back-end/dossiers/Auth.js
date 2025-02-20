// Forget password
const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: AUTH_ERRORS.USER_NOT_FOUND });
        }

        const resetToken = user.generatePasswordResetToken();
        await user.save();

        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await sendResetPasswordEmail(user.email, resetURL);

        logger.info(`Password reset token sent to: ${email}`);
        res.status(200).json({ message: 'Password reset token sent to email' });
    } catch (error) {
        logger.error(`Forget password error: ${error.message}`);
        res.status(500).json({ error: AUTH_ERRORS.INTERNAL_ERROR });
    }
};

// Reset password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: AUTH_ERRORS.INVALID_RESET_TOKEN });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        logger.info(`Password reset successful for user: ${user.email}`);
        res.status(200).json({ message: 'Password has been reset' });
    } catch (error) {
        logger.error(`Reset password error: ${error.message}`);
        res.status(500).json({ error: AUTH_ERRORS.INTERNAL_ERROR });
    }
};

// Update password
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.correctPassword(currentPassword, user.password))) {
            return res.status(401).json({ error: AUTH_ERRORS.INCORRECT_PASSWORD });
        }

        user.password = newPassword;
        await user.save();

        logger.info(`Password updated for user: ${user.email}`);
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        logger.error(`Update password error: ${error.message}`);
        res.status(500).json({ error: AUTH_ERRORS.INTERNAL_ERROR });
    }
};

// Delete User by admin
const deleteUserAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: AUTH_ERRORS.USER_NOT_FOUND });
        }

        await User.findByIdAndDelete(userId);

        logger.info(`User deleted by admin: ${userId}`);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error(`Delete user by admin error: ${error.message}`);
        res.status(500).json({ error: AUTH_ERRORS.INTERNAL_ERROR });
    }
};