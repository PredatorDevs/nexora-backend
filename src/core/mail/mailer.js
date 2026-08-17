import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function createMailer({ settings, logger }) {
  if (settings.transport === 'log') {
    return Object.freeze({
      async sendCompanyInvitation(message) {
        logger.info(
          {
            emailType: 'company_invitation',
            to: message.to,
            acceptanceUrl: message.acceptanceUrl,
          },
          'Development invitation email',
        );
        return { messageId: null, transport: 'log' };
      },
    });
  }

  const transport = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: { user: 'resend', pass: settings.resendApiKey },
  });
  const from = `${settings.fromName} <${settings.fromEmail}>`;

  return Object.freeze({
    async sendCompanyInvitation({
      invitationId,
      to,
      companyName,
      inviterName,
      acceptanceUrl,
      expiresAt,
    }) {
      const safeCompany = escapeHtml(companyName);
      const safeInviter = escapeHtml(inviterName);
      const safeUrl = escapeHtml(acceptanceUrl);
      const result = await transport.sendMail({
        from,
        to,
        ...(settings.replyTo ? { replyTo: settings.replyTo } : {}),
        subject: `Invitación para operar en ${companyName}`,
        text: `${inviterName} te invitó a operar en ${companyName}. Acepta la invitación antes de ${expiresAt.toISOString()}: ${acceptanceUrl}`,
        html: `<p>${safeInviter} te invitó a operar en <strong>${safeCompany}</strong>.</p><p><a href="${safeUrl}">Aceptar invitación</a></p><p>El enlace vence el ${escapeHtml(expiresAt.toISOString())} y solo puede utilizarse una vez.</p>`,
        headers: {
          'Resend-Idempotency-Key': `company-invitation/${invitationId}`,
        },
      });
      return { messageId: result.messageId, transport: 'resend' };
    },
  });
}
