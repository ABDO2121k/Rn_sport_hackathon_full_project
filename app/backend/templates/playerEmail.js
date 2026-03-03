/**
 * Email template for players
 * Notifies them that a talent scout is interested in their profile
 */

function getPlayerEmailTemplate(data) {
  const { playerName, scoutOrganization, searchDescription } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Profile Caught a Scout's Attention</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 30px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 50px 40px; text-align: center;">
              <div style="font-size: 60px; margin-bottom: 15px;">🌟</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Your Profile is Getting Noticed!
              </h1>
              <p style="margin: 15px 0 0 0; color: rgba(255,255,255,0.95); font-size: 18px;">
                A talent scout is interested in you
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <p style="margin: 0 0 25px 0; font-size: 18px; color: #2c3e50; line-height: 1.7;">
                Hello <strong style="color: #667eea;">${playerName}</strong>,
              </p>
              
              <p style="margin: 0 0 25px 0; font-size: 16px; color: #2c3e50; line-height: 1.7;">
                Great news! Your profile has appeared in a talent search conducted by <strong>${scoutOrganization || 'a professional organization'}</strong>. 
                Your skills and performance have caught their attention!
              </p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin: 35px 0; box-shadow: 0 8px 20px rgba(102,126,234,0.3);">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                  📋 What They're Looking For
                </h2>
                <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 16px; line-height: 1.7; background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px; border-left: 4px solid rgba(255,255,255,0.5);">
                  "${searchDescription || 'A talented player with your profile and skills'}"
                </p>
              </div>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 25px; margin: 30px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #2c3e50; font-weight: 600;">
                  💡 What This Means for You
                </h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 15px; color: #2c3e50; line-height: 1.8;">
                  <li>Your profile matched their search criteria</li>
                  <li>They may contact you soon with opportunities</li>
                  <li>Keep performing well to attract more attention</li>
                  <li>Make sure your stats and information are up to date</li>
                </ul>
              </div>
              
              <p style="margin: 30px 0 20px 0; font-size: 16px; color: #2c3e50; line-height: 1.7;">
                This is a fantastic opportunity to advance your career! Continue to showcase your skills and professionalism 
                both on and off the field. More opportunities may come your way!
              </p>
              
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                  🎯 Keep up the excellent work!
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 35px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 12px 0; font-size: 15px; color: #64748b; font-weight: 500;">
                🏆 Keep working hard and your talent will shine!
              </p>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                © ${new Date().getFullYear()} Sports Stats Portal. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

module.exports = { getPlayerEmailTemplate };
