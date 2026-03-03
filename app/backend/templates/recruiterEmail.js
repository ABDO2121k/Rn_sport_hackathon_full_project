/**
 * Email template for talent scouts/recruiters
 * Notifies them about matched player profiles
 */

function getRecruiterEmailTemplate(data) {
  const { scoutName, searchDescription, players, totalMatches } = data;

  const playerRows = players
    .map(
      (player) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">
        <strong style="color: #2c3e50; font-size: 16px;">${
          player.name
        }</strong><br>
        <span style="color: #7f8c8d;">Position: ${player.position} | Team: ${
        player.team
      }</span><br>
        <span style="color: #7f8c8d;">Age: ${player.physical.age} | Height: ${
        player.physical.height
      }cm | Weight: ${player.physical.weight}kg</span>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">
        ${
          player.stats.goals !== undefined
            ? `<strong>Goals:</strong> ${player.stats.goals}<br>`
            : ""
        }
        ${
          player.stats.assists !== undefined
            ? `<strong>Assists:</strong> ${player.stats.assists}<br>`
            : ""
        }
        ${
          player.stats.passAccuracy !== undefined
            ? `<strong>Pass Accuracy:</strong> ${player.stats.passAccuracy}%<br>`
            : ""
        }
        ${
          player.stats.tackles !== undefined
            ? `<strong>Tackles:</strong> ${player.stats.tackles}<br>`
            : ""
        }
        ${
          player.stats.saves !== undefined
            ? `<strong>Saves:</strong> ${player.stats.saves}<br>`
            : ""
        }
        <strong>Games Played:</strong> ${player.stats.gamesPlayed}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Player Match Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ⚽ Player Matches Found!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #2c3e50; line-height: 1.6;">
                Hello <strong>${scoutName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #2c3e50; line-height: 1.6;">
                Great news! We found <strong style="color: #667eea;">${totalMatches} player${
    totalMatches > 1 ? "s" : ""
  }</strong> that match your search criteria.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #7f8c8d; line-height: 1.5;">
                  <strong style="color: #2c3e50;">Your Search:</strong><br>
                  ${searchDescription}
                </p>
              </div>
              
              <h2 style="color: #2c3e50; font-size: 20px; margin: 30px 0 20px 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                Matched Players
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden;">
                ${playerRows}
              </table>
              
              <p style="margin: 30px 0 0 0; font-size: 16px; color: #2c3e50; line-height: 1.6;">
                These players meet your requirements and might be excellent candidates for your team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #7f8c8d;">
                Need more information? Contact us or log in to your dashboard for full player profiles.
              </p>
              <p style="margin: 0; font-size: 12px; color: #bdc3c7;">
                © ${new Date().getFullYear()} Sports Stats API. All rights reserved.
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

module.exports = { getRecruiterEmailTemplate };
