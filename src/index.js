
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sns = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const TOPIC_ARN = process.env.NOTIFICATION_TOPIC_ARN;

exports.handler = async (event) => {
  if (!TOPIC_ARN) {
    throw new Error("Falta configurar NOTIFICATION_TOPIC_ARN");
  }

  const records = event.Records || [];

  for (const record of records) {
    const message = JSON.parse(record.body);

    // SNS → SQS puede envolver el evento en un objeto Message.
    const payload = message.Message
      ? JSON.parse(message.Message)
      : message;

    const pedido = payload.body || payload;

    if (payload.type && payload.type !== "pedido.creado") {
      console.log("Evento ignorado:", payload.type);
      continue;
    }

    const subject = `NUEVO pedido Coffee Flower #${pedido.id ?? "sin ID"}`;

    const messageText = [
      "Se ha recibido un nuevo pedido en Coffee Flower.",
      "",
      `Pedido: ${pedido.id ?? "No informado"}`,
      `Cliente: ${pedido.cliente ?? "No informado"}`,
      `Total: ${pedido.total ?? "No informado"}`,
      `Estado: ${pedido.estado ?? "RECIBIDO"}`,
      `Fecha: ${pedido.creadoEn ?? new Date().toISOString()}`,
      "",
      "Detalle de productos:",
      ...(pedido.items || []).map(
        (item) =>
          `- ${item.nombre ?? "Producto"} x${item.cantidad ?? 1} — $${item.precio ?? 0}`
      ),
    ].join("\n");

    await sns.send(
      new PublishCommand({
        TopicArn: TOPIC_ARN,
        Subject: subject.slice(0, 100),
        Message: messageText,
      })
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Notificaciones procesadas",
      processed: records.length,
    }),
  };
};
