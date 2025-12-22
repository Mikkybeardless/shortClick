const resetPasswordHtml = (resetLink: string) => {
  return `  <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to proceed:</p>
          <a href="${resetLink}" 
             style="display: inline-block; padding: 10px 20px; 
                    background-color: #007bff; color: white; 
                    text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p style="margin-top: 20px;">
            Or copy and paste this link in your browser:<br/>
            <code>${resetLink}</code>
          </p>
          <p style="color: #666; margin-top: 20px;">
            This link will expire in 1 hour.
          </p>
          <p style="color: #666;">
            If you didn't request this, please ignore this email.
          </p>
        </div>`;
};

export { resetPasswordHtml };
