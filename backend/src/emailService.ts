import nodemailer from 'nodemailer';

// Configure the nodemailer transporter using environment variables
export function createEmailTransporter() {
  const host = process.env.SMTP_HOST 
    || process.env['HOST SMTP'] 
    || process.env.HOST_SMTP 
    || 'smtp.gmail.com';

  const port = parseInt(
    process.env.SMTP_PORT 
    || process.env['PUERTO SMTP'] 
    || process.env.PUERTO_SMTP 
    || '587', 
    10
  );

  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  // Buscar usuario tanto en inglés como si fue guardado por la traducción de Chrome
  const user = (
    process.env.SMTP_USER 
    || process.env['USUARIO SMTP'] 
    || process.env.USUARIO_SMTP 
    || process.env.SMTP_USUARIO 
    || ''
  ).trim();

  // Buscar contraseña tanto en inglés como si fue guardada por la traducción de Chrome
  const rawPass = (
    process.env.SMTP_PASS 
    || process.env['CONTRASEÑA SMTP'] 
    || process.env.CONTRASEÑA_SMTP 
    || process.env['CONTRASENA SMTP'] 
    || process.env.CONTRASENA_SMTP 
    || process.env.SMTP_PASSWORD 
    || ''
  ).trim();

  if (!user || !rawPass) {
    console.warn('[EMAIL SERVICE] Advertencia: Credenciales SMTP no configuradas o nombres traducidos. Claves detectadas:', {
      hasUser: Boolean(user),
      hasPass: Boolean(rawPass),
      availableEnvKeys: Object.keys(process.env).filter(k => 
        k.toUpperCase().includes('SMTP') || 
        k.toUpperCase().includes('USUARIO') || 
        k.toUpperCase().includes('CONTRASE')
      ),
    });
    return null;
  }

  const pass = rawPass.replace(/\s+/g, ''); // Limpiar posibles espacios en blanco de Google App Password
  const isGmail = host.includes('gmail.com');

  return nodemailer.createTransport({
    ...(isGmail ? { service: 'gmail' } : { host, port, secure }),
    auth: {
      user,
      pass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
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
          Su Código de Recuperación de 6 Dígitos
        </span>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f766e; background-color: #ffffff; padding: 12px 28px; border-radius: 12px; display: inline-block; border: 2px solid #0d9488;">
          ${resetToken}
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 10px 0 0 0;">
          Copie o escriba este código de 6 dígitos en la aplicación.
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

  // 1. Si existe BREVO_API_KEY, enviar vía Brevo REST API (HTTPS Puerto 443) a CUALQUIER destinatario sin necesidad de dominio propio
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'pimentelcarlos147@gmail.com';
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Clínica Medical',
            email: senderEmail.trim(),
          },
          to: [
            {
              email: toEmail,
              name: recipientName || 'Usuario',
            },
          ],
          subject: 'Restablecimiento de Contraseña - Clínica Medical',
          htmlContent: htmlContent,
          textContent: textContent,
        }),
      });

      const brevoData = await brevoRes.json() as any;
      if (brevoRes.ok) {
        console.log(`[EMAIL ENVIADO - BREVO HTTPS 443] Correo entregado con éxito a: ${toEmail} (MessageId: ${brevoData.messageId})`);
        return { success: true, messageId: brevoData.messageId };
      } else {
        console.warn(`[BREVO WARN] Error devuelto por Brevo:`, brevoData);
      }
    } catch (brevoErr: any) {
      console.error(`[BREVO ERROR] Excepción al llamar a Brevo API:`, brevoErr.message || brevoErr);
    }
  }

  // 2. Si existe RESEND_API_KEY, enviar a través de HTTPS (Puerto 443, no bloqueado por Render Free)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Clínica Medical <onboarding@resend.dev>',
          to: [toEmail],
          subject: 'Restablecimiento de Contraseña - Clínica Medical',
          html: htmlContent,
          text: textContent,
        }),
      });
      const resendData = await resendRes.json() as any;
      if (resendRes.ok) {
        console.log(`[EMAIL ENVIADO - RESEND HTTPS 443] Correo enviado con éxito a: ${toEmail} (ID: ${resendData.id})`);
        return { success: true, messageId: resendData.id };
      } else {
        console.warn(`[RESEND WARN] Error devuelto por Resend API:`, resendData);
        // Si Resend está en modo sandbox gratuito, solo permite enviar a la cuenta registrada del usuario (ej: pimentelguarena@gmail.com)
        if (resendData.statusCode === 403 && resendData.message?.includes('only send testing emails')) {
          const match = resendData.message.match(/\(([^)]+)\)/);
          const ownerEmail = match ? match[1] : null;
          if (ownerEmail && ownerEmail.toLowerCase() !== toEmail.toLowerCase()) {
            console.log(`[RESEND MODO PRUEBA] Entregando a la cuenta propietaria de Resend: ${ownerEmail} (destinatario: ${toEmail})`);
            const retryRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: process.env.RESEND_FROM || 'Clínica Medical <onboarding@resend.dev>',
                to: [ownerEmail],
                subject: `Código de Recuperación [Para: ${toEmail}] - Clínica Medical`,
                html: `<div style="background:#fef3c7;padding:12px;border-radius:8px;margin-bottom:16px;font-size:13px;color:#92400e;">
                  ⚠️ <strong>Aviso de Cuenta Gratuita de Resend:</strong> Este correo fue solicitado para <code>${toEmail}</code> y entregado a su cuenta registrada <code>${ownerEmail}</code>.
                </div>` + htmlContent,
                text: `[Solicitado para: ${toEmail}]\n` + textContent,
              }),
            });
            const retryData = await retryRes.json() as any;
            if (retryRes.ok) {
              console.log(`[EMAIL ENVIADO - RESEND OWNER] Correo entregado exitosamente a: ${ownerEmail} (ID: ${retryData.id})`);
              return { success: true, messageId: retryData.id };
            }
          }
        }
      }
    } catch (resendErr: any) {
      console.warn(`[RESEND ERROR] Excepción al llamar a Resend API:`, resendErr.message || resendErr);
    }
  }

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
    console.error(`[ERROR EMAIL] Error al despachar correo SMTP a ${toEmail}: ${error.message || error}`);
    console.log('\n================== [CÓDIGO DE RECUPERACIÓN GENERADO] ==================');
    console.log(`Para: ${toEmail} (${recipientName})`);
    console.log(`CÓDIGO PIN: ${resetToken}`);
    console.log(`Aviso: Render Free bloquea puertos SMTP salientes (587/465). Use este PIN para continuar.`);
    console.log('========================================================================\n');
    return { success: false, error: error.message || 'Error en servidor de correo' };
  }
}

/**
 * Sends notification when a doctor declares an emergency and cancels scheduled appointments
 */
export async function sendDoctorEmergencyNoticeEmail(params: {
  toEmail: string;
  recipientName: string;
  doctorName: string;
  specialtyName: string;
  date: string;
  timeSlot: string;
  apptCode: string;
  reason: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createEmailTransporter();
  const from = process.env.SMTP_FROM || `"Clínica Medical" <${process.env.SMTP_USER}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Aviso Importante: Suspensión de Consulta por Emergencia Médica</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">CLÍNICA MEDICAL</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #fecaca; font-weight: 500;">
        Aviso Urgente de Contingencia Médica
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #991b1b; margin-top: 0; margin-bottom: 12px;">
        Estimado(a) ${params.recipientName},
      </h2>
      
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
        Le informamos que debido a una <strong>emergencia médica imprevista</strong>, el especialista <strong>${params.doctorName}</strong> (${params.specialtyName}) no podrá brindar atención presencial programada para el día <strong>${params.date}</strong> a las <strong>${params.timeSlot}</strong> (Cita <code>${params.apptCode}</code>).
      </p>

      <!-- Reason Box -->
      <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #be123c; display: block; margin-bottom: 4px;">
          Motivo Notificado por el Médico
        </span>
        <p style="margin: 0; font-size: 13px; color: #881337; font-style: italic;">
          "${params.reason}"
        </p>
      </div>

      <!-- Reschedule Guarantee Box -->
      <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #15803d; display: block; margin-bottom: 6px;">
          ✓ SU FICHA MÉDICA SIGUE SIENDO 100% VÁLIDA
        </span>
        <p style="font-size: 13px; color: #166534; line-height: 1.5; margin: 0 0 12px 0;">
          Su pago y su derecho de atención médica se encuentran plenamente garantizados. Puede ingresar ahora mismo al sistema y <strong>elegir un nuevo día y horario de atención sin ningún costo adicional</strong>.
        </p>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        Para reprogramar, inicie sesión en la plataforma web, diríjase a <strong>"Mis Citas Médicas"</strong> y presione el botón <strong>"Elegir Otro Día de Atención"</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      CLÍNICA MEDICAL • Departamento de Admisión y Atención al Paciente • Teléfono de Emergencias: 70011223
    </div>
  </div>
</body>
</html>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULADO] Aviso de emergencia médica enviado a ${params.toEmail} para cita ${params.apptCode}`);
    return { success: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: params.toEmail,
      subject: `Aviso Importante: Suspensión de Consulta por Emergencia - Cita ${params.apptCode}`,
      html: htmlContent,
      text: `Estimado(a) ${params.recipientName}: Por emergencia médica del ${params.doctorName}, su cita ${params.apptCode} del ${params.date} (${params.timeSlot}) ha sido suspendida. Su ficha médica sigue 100% válida. Ingrese a la plataforma para reprogramarla sin costo.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[ERROR EMAIL] Error al enviar aviso de emergencia a ${params.toEmail}:`, error.message || error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends notification when an appointment is successfully rescheduled
 */
export async function sendAppointmentRescheduledEmail(params: {
  toEmail: string;
  recipientName: string;
  doctorName: string;
  specialtyName: string;
  newDate: string;
  newTimeSlot: string;
  apptCode: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createEmailTransporter();
  const from = process.env.SMTP_FROM || `"Clínica Medical" <${process.env.SMTP_USER}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Confirmación de Reprogramación de Cita Médica</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    
    <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800;">CLÍNICA MEDICAL</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #ccfbf1;">
        Confirmación de Reprogramación de Cita Médica
      </p>
    </div>

    <div style="padding: 32px 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0f766e; margin-top: 0;">
        ¡Cita Reprogramada con Éxito, ${params.recipientName}!
      </h2>
      
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Su cita médica código <strong>${params.apptCode}</strong> ha sido reprogramada satisfactoriamente con los siguientes datos confirmados:
      </p>

      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px; line-height: 1.8;">
        <div><strong>Especialidad:</strong> ${params.specialtyName}</div>
        <div><strong>Médico Especialista:</strong> ${params.doctorName}</div>
        <div><strong>Nueva Fecha:</strong> <span style="color: #0f766e; font-weight: 800;">${params.newDate}</span></div>
        <div><strong>Nuevo Horario:</strong> <span style="color: #0f766e; font-weight: 800;">${params.newTimeSlot}</span></div>
        <div><strong>Código de Ficha:</strong> <code>${params.apptCode}</code></div>
      </div>

      <p style="font-size: 12px; color: #64748b;">
        Por favor recuerde presentarse en recepción 10 minutos antes de su horario programado con su Cédula de Identidad.
      </p>
    </div>

    <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      CLÍNICA MEDICAL • Cuidado Profesional a su Servicio
    </div>
  </div>
</body>
</html>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULADO] Confirmación de reprogramación enviada a ${params.toEmail} para cita ${params.apptCode}`);
    return { success: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: params.toEmail,
      subject: `Cita Médica Reprogramada con Éxito - ${params.apptCode} - Clínica Medical`,
      html: htmlContent,
      text: `Estimado(a) ${params.recipientName}: Su cita ${params.apptCode} ha sido reprogramada para el ${params.newDate} a las ${params.newTimeSlot} con el ${params.doctorName}.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[ERROR EMAIL] Error al enviar confirmación de reprogramación a ${params.toEmail}:`, error.message || error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends notification when an appointment is suspended due to scheduled doctor absence / vacation
 */
export async function sendDoctorAbsenceNoticeEmail(params: {
  toEmail: string;
  recipientName: string;
  doctorName: string;
  specialtyName: string;
  date: string;
  timeSlot: string;
  apptCode: string;
  absenceType: string;
  absenceReason: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createEmailTransporter();
  const from = process.env.SMTP_FROM || `"Clínica Medical" <${process.env.SMTP_USER}>`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Aviso: Suspensión de Consulta por Ausencia / Vacaciones del Especialista</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">CLÍNICA MEDICAL</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; color: #fef3c7; font-weight: 500;">
        Aviso de Reprogramación por Ausencia / Vacaciones Médicas
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #b45309; margin-top: 0; margin-bottom: 12px;">
        Estimado(a) ${params.recipientName},
      </h2>
      
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
        Le informamos que debido a un período programado de <strong>${params.absenceType}</strong>, el especialista <strong>${params.doctorName}</strong> (${params.specialtyName}) no brindará atención en la fecha de su cita médica: <strong>${params.date}</strong> a las <strong>${params.timeSlot}</strong> (Ficha <code>${params.apptCode}</code>).
      </p>

      <!-- Reason Box -->
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b45309; display: block; margin-bottom: 4px;">
          Detalle de la Ausencia
        </span>
        <p style="margin: 0; font-size: 13px; color: #78350f; font-style: italic;">
          "${params.absenceReason}"
        </p>
      </div>

      <!-- Reschedule Guarantee Box -->
      <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #15803d; display: block; margin-bottom: 6px;">
          ✓ SU FICHA MÉDICA SIGUE SIENDO 100% VÁLIDA
        </span>
        <p style="font-size: 13px; color: #166534; line-height: 1.5; margin: 0 0 12px 0;">
          Su pago y reserva están totalmente asegurados. Puede ingresar a la plataforma y <strong>seleccionar cualquier otra fecha disponible sin ningún costo extra</strong>.
        </p>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        Para reprogramar, ingrese a <strong>"Mis Citas Médicas"</strong> y presione el botón <strong>"Elegir Otro Día de Atención"</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      CLÍNICA MEDICAL • Departamento de Admisión • Consultas: 70011223
    </div>
  </div>
</body>
</html>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULADO] Aviso de ausencia médica enviado a ${params.toEmail} para cita ${params.apptCode}`);
    return { success: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: params.toEmail,
      subject: `Aviso Importante: Reprogramación de Ficha ${params.apptCode} por Ausencia del Médico - Clínica Medical`,
      html: htmlContent,
      text: `Estimado(a) ${params.recipientName}: Por período de ${params.absenceType} del ${params.doctorName}, su cita ${params.apptCode} del ${params.date} (${params.timeSlot}) requiere reprogramación. Su ficha médica es 100% válida. Ingrese a la plataforma para reprogramarla sin costo.`,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[ERROR EMAIL] Error al enviar aviso de ausencia a ${params.toEmail}:`, error.message || error);
    return { success: false, error: error.message };
  }
}
