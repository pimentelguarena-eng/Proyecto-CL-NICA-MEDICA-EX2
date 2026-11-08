import nodemailer from 'nodemailer';

// Configure the nodemailer transporter using environment variables
export function createEmailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[EMAIL SERVICE] Advertencia: Credenciales SMTP no configuradas. Los correos se simularán en consola.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Sends a password reset email via SMTP
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  recipientName: string,
  resetToken: string
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const transporter = createEmailTransporter();

  // If no SMTP configured, fallback to console simulation
  if (!transporter) {
    console.log('\n================== [CORREO SIMULADO] ==================');
    console.log(`Para: ${toEmail} (${recipientName})`);
    console.log(`Asunto: Restablecimiento de Contraseña - Clínica Medical`);
    console.log(`Código de Recuperación: ${resetToken}`);
    console.log(`Validez: 30 minutos`);
    console.log('========================================================\n');
    return { success: true, simulated: true };
  }

  const from = process.env.SMTP_FROM || `"Clínica Medical" <${process.env.SMTP_USER}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Restablecimiento de Contraseña - Clínica Medical</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">CLÍNICA MEDICAL</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #ccfbf1; font-weight: 500;">
        Sistema Integral de Citas Médicas y Especialidades Ambulatorias
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
        Estimado(a) ${recipientName},
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
        Hemos recibido una solicitud para restablecer la contraseña de acceso a su cuenta en el portal de <strong>Clínica Medical</strong>.
      </p>

      <!-- Token Box -->
      <div style="background-color: #f8fafc; border: 2px dashed #0d9488; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0f766e; display: block; margin-bottom: 8px;">
          Su Código de Recuperación Temporal
        </span>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #042f2e; background-color: #ffffff; padding: 10px 18px; border-radius: 8px; display: inline-block; border: 1px solid #cbd5e1;">
          ${resetToken}
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 10px 0 0 0;">
          Copie este código e ingréselo en el formulario de la aplicación.
        </p>
      </div>

      <!-- Security Notice -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
          <strong>Aviso de Seguridad:</strong> Este código tiene una vigencia máxima de <strong>30 minutos</strong> a partir de la emisión de este mensaje y solo puede ser utilizado una única vez.
        </p>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
        Si usted no solicitó este cambio, puede ignorar con total tranquilidad este mensaje; su cuenta se mantiene protegida.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      CLÍNICA MEDICAL • Atención Ambulatoria Especializada • Documento confidencial generado automáticamente.
    </div>

  </div>
</body>
</html>
  `;

  const textContent = `
CLÍNICA MEDICAL - Restablecimiento de Contraseña
Estimado(a) ${recipientName},

Hemos recibido una solicitud para restablecer su contraseña de acceso.
Su código de recuperación temporal es: ${resetToken}

Este código expira en 30 minutos y es de un solo uso.
Si no realizó esta solicitud, ignore este correo.
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'Restablecimiento de Contraseña - Clínica Medical',
      text: textContent,
      html: htmlContent,
    });

    console.log(`[EMAIL ENVIADO] Correo de recuperación enviado con éxito a: ${toEmail} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[ERROR EMAIL] Error al despachar correo SMTP a ${toEmail}:`, error.message || error);
    return { success: false, error: error.message || 'Error en servidor de correo' };
  }
}
