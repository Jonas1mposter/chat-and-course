// 邮件发送：配置了 SMTP_* 时用 nodemailer 真发信，否则只在服务端日志里打印验证码
let transporterPromise = null;

export const mailerConfigured = () =>
  !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

async function getTransporter() {
  if (!mailerConfigured()) return null;
  if (!transporterPromise) {
    transporterPromise = (async () => {
      try {
        const { default: nodemailer } = await import("nodemailer");
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: String(process.env.SMTP_SECURE ?? "true") !== "false",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
      } catch (e) {
        console.error("[mailer] nodemailer 未安装或初始化失败：", e.message);
        return null;
      }
    })();
  }
  return transporterPromise;
}

export async function sendMail({ to, subject, text, html }) {
  const t = await getTransporter();
  if (!t) {
    console.log(`[mailer:未配置] 收件人=${to} 主题=${subject}\n${text}`);
    return { delivered: false, reason: "smtp_not_configured" };
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || `超脑 Studio <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
  return { delivered: true };
}

export function resetCodeMail(code, minutes) {
  return {
    subject: "超脑 Studio 密码重置验证码",
    text: `你的密码重置验证码是 ${code}，${minutes} 分钟内有效。如果不是你本人操作，请忽略此邮件。`,
    html: `<p>你的密码重置验证码是：</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>${minutes} 分钟内有效。如果不是你本人操作，请忽略此邮件。</p>`,
  };
}