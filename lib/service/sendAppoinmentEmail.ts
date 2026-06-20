import { sendEmail } from "@/lib/mail";

export const runtime = "nodejs";
interface Appointment {
name:string,
phone:string,
date:string,
start_time:string,
end_time:string,
status:string,
notes?: string,
email:string,
}
export async function sendAppoinmentEmail(data:Appointment) {
  try {
    // const data = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    const formatTime = (t: string) => {
      const [h, m] = t.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const display = hour % 12 === 0 ? 12 : hour % 12;
      return `${display}:${m} ${ampm}`;
    };

    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    // ── Build Google Calendar "Add Event" URL ────────────────────────────────
    const toGCalDateTime = (date: string, time: string) => {
      const [y, mo, d] = date.split("-");
      const [h, mi, s] = time.split(":");
      return `${y}${mo}${d}T${h}${mi}${s ?? "00"}`;
    };

    const gcalStart = toGCalDateTime(data.date, data.start_time);
    const gcalEnd   = toGCalDateTime(data.date, data.end_time ?? data.start_time);

    const gcalParams = new URLSearchParams({
      action: "TEMPLATE",
      text: `Appointment — ${data.name}`,
      dates: `${gcalStart}/${gcalEnd}`,
      details: data.notes
        ? `Notes: ${data.notes}\n\nBooked via Voxora AI Voice Agent`
        : "Booked via Voxora AI Voice Agent",
      add: `${process.env.EMAIL_USER},info@voxora.ai`,
    });

    const addToCalendarUrl = `https://calendar.google.com/calendar/render?${gcalParams.toString()}`;
    // ────────────────────────────────────────────────────────────────────────

    // ── Status strip config ──────────────────────────────────────────────────
    const stripConfig =
      data.status === "confirmed"
        ? { dot: "#22c55e", text: "Appointment Confirmed" }
        : data.status === "pending"
        ? { dot: "#f59e0b", text: "Appointment Pending — We'll confirm shortly" }
        : { dot: "#ef4444", text: "Appointment Cancelled" };

    const detailRow = (label: string, value: string, hasBorder = true) => `
      <tr>
        <td style="padding: 15px 20px; ${hasBorder ? "border-bottom: 1px solid #ebebeb;" : ""}">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="
                width: 3px;
                background: #0f0f0f;
                border-radius: 4px;
                vertical-align: stretch;
              ">&nbsp;</td>
              <td style="vertical-align: middle; padding-left: 14px;">
                <p style="
                  margin: 0 0 3px;
                  font-size: 10px;
                  font-weight: 700;
                  color: #9ca3af;
                  text-transform: uppercase;
                  letter-spacing: 1.4px;
                ">${label}</p>
                <p style="
                  margin: 0;
                  font-size: 14px;
                  font-weight: 600;
                  color: #111827;
                  line-height: 1.4;
                ">${value}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Confirmation</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-card {
        border-radius: 10px !important;
      }
      .email-header {
        padding: 24px 20px !important;
      }
      .email-body {
        padding: 24px 20px 16px !important;
      }
      .email-cta {
        padding: 16px 20px 28px !important;
      }
      .email-footer {
        padding: 18px 20px 24px !important;
      }
      .email-status {
        padding: 14px 20px 0 !important;
      }
      .email-divider {
        padding: 0 20px !important;
      }
      .greeting {
        font-size: 18px !important;
      }
      .body-text {
        font-size: 13px !important;
      }
      .detail-label {
        font-size: 9px !important;
      }
      .detail-value {
        font-size: 13px !important;
      }
      .cta-btn {
        padding: 12px 22px !important;
        font-size: 12px !important;
      }
      .outer-wrap {
        padding: 24px 10px !important;
      }
      .logo-img {
        width: 100px !important;
      }
    }
  </style>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f4f5;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    class="outer-wrap"
    style="background-color: #f4f4f5; padding: 44px 16px;">
    <tr>
      <td align="center">

        <!-- ══ CARD ══ -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          class="email-card"
          style="
            max-width: 560px;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e4e4e7;
            box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          ">

          <!-- ══ HEADER ══ -->
          <tr>
            <td class="email-header" style="
              background: #f4f4f5;
              border-bottom: 1px solid #e4e4e7;
              padding: 32px 40px;
              text-align: center;
            ">
              <img
                src="${baseUrl}/logo.png"
                width="120"
                alt="Voxora AI"
                class="logo-img"
                style="display: block; margin: 0 auto 14px;"
              />
              <p style="
                margin: 0;
                color: #9ca3af;
                font-size: 10px;
                letter-spacing: 4px;
                text-transform: uppercase;
                font-weight: 600;
              ">AI Voice Agent</p>
            </td>
          </tr>

          <!-- ══ STATUS DOT ══ -->
          <tr>
            <td class="email-status" style="padding: 16px 40px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align: middle; width: 8px;">
                    <div style="
                      width: 8px; height: 8px;
                      background: ${stripConfig.dot};
                      border-radius: 50%;
                      line-height: 8px;
                      font-size: 0;
                    ">&nbsp;</div>
                  </td>
                  <td style="
                    padding-left: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #6b7280;
                    letter-spacing: 0.3px;
                    vertical-align: middle;
                  ">${stripConfig.text}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ BODY ══ -->
          <tr>
            <td class="email-body" style="padding: 32px 40px 20px;">

              <p class="greeting" style="
                margin: 0 0 6px;
                font-size: 21px;
                font-weight: 700;
                color: #0f0f0f;
                letter-spacing: -0.4px;
              ">Hi ${data.name},</p>

              <p class="body-text" style="
                margin: 0 0 28px;
                font-size: 14px;
                color: #6b7280;
                line-height: 1.65;
              ">
                Your appointment has been confirmed. Here's a summary of your booking details below.
              </p>

              <!-- ── Detail Card ── -->
              <table width="100%" cellpadding="0" cellspacing="0" style="
                background: #fafafa;
                border-radius: 12px;
                border: 1px solid #e4e4e7;
                overflow: hidden;
              ">
                ${detailRow("Date", formatDate(data.date))}
                ${detailRow(
                  "Time",
                  data.end_time
                    ? `${formatTime(data.start_time)}&nbsp;&nbsp;→&nbsp;&nbsp;${formatTime(data.end_time)}`
                    : formatTime(data.start_time),
                  !!data.notes
                )}
                ${data.notes ? detailRow("Notes", data.notes, false) : ""}
              </table>
              <!-- ── /Detail Card ── -->

              <p style="
                margin: 22px 0 0;
                font-size: 13px;
                color: #9ca3af;
                line-height: 1.6;
                text-align: center;
              ">
                Need to reschedule or cancel?&nbsp;
                <a href="mailto:info@voxora.ai"
                   style="color: #0f0f0f; font-weight: 700; text-decoration: underline;">
                  Contact us
                </a>
              </p>

            </td>
          </tr>

          <!-- ══ CTA ══ -->
          <tr>
            <td class="email-cta" align="center" style="padding: 20px 40px 36px;">
              <a href="${addToCalendarUrl}" class="cta-btn" style="
                display: inline-block;
                background: #e4e4e7;
                color: #0f0f0f;
                padding: 13px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: 0.3px;
              ">
                Add to Google Calendar
              </a>
            </td>
          </tr>

          <!-- ══ DIVIDER ══ -->
          <tr>
            <td class="email-divider" style="padding: 0 40px;">
              <div style="height: 1px; background: #e4e4e7;"></div>
            </td>
          </tr>

          <!-- ══ FOOTER ══ -->
          <tr>
            <td class="email-footer" style="padding: 22px 40px 28px; text-align: center;">
              <p style="margin: 0 0 3px; font-size: 13px; font-weight: 700; color: #0f0f0f;">
                Voxora AI
              </p>
              <p style="margin: 0 0 14px; font-size: 11px; color: #9ca3af; letter-spacing: 0.3px;">
                AI Voice Agent Platform
              </p>
              <p style="margin: 0; font-size: 11px; color: #d1d5db;">
                © ${new Date().getFullYear()} Voxora AI. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

        <p style="margin: 18px 0 0; font-size: 11px; color: #9ca3af; text-align: center;">
          This email was sent to ${data.email}
        </p>

      </td>
    </tr>
  </table>

</body>
</html>
`;

    await sendEmail({
      to: data.email,
      subject: `Appointment Confirmed — ${formatDate(data.date)} at ${formatTime(data.start_time)}`,
      html,
    });
}
catch(e){
  console.log(e)
}
}