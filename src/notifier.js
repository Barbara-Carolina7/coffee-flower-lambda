
async function sendReport(report) {
  const apiKey = process.env.EMAIL_API_KEY;
  const recipient = process.env.REPORT_EMAIL_TO;

  if (!apiKey) {
    throw new Error("Falta configurar EMAIL_API_KEY");
  }

  if (!recipient) {
    throw new Error("Falta configurar REPORT_EMAIL_TO");
  }

  if (!report?.text) {
    throw new Error("El informe no contiene texto para enviar");
  }

  const subject =
    `Coffee Flower - Informe de ventas ${report.reportId}`;

  const response = await fetch(
    "https://app.claudioviajando.com/api/saas/send-email",
    {
      method: "POST",
      headers: {
        "Authorization": `ApiKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: recipient,
        subject,
        text: report.text,
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();

    console.error("Error al enviar correo:", response.status);

    throw new Error(
      `La API de correo respondió HTTP ${response.status}: ${detail.slice(0, 300)}`
    );
  }

  console.log(`Informe ${report.reportId} enviado a la API de correo`);

  return {
    success: true,
    reportId: report.reportId,
  };
}

module.exports = { sendReport };
