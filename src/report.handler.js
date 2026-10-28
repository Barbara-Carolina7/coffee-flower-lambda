
const reportService = require("./report.service");

function parseJson(value, description) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error(
      `${description} no contiene JSON válido. Inicio del mensaje: ${value.slice(0, 100)}`
    );
  }
}

function parseRecord(record) {
  const envelope = parseJson(record.body, "El cuerpo de SQS");

  // SNS → SQS puede entregar un sobre SNS con Message.
  const message =
    envelope && typeof envelope === "object" && envelope.Message !== undefined
      ? envelope.Message
      : envelope;

  const payload = parseJson(message, "El mensaje de SNS/SQS");

  if (!payload || typeof payload !== "object") {
    throw new Error("El mensaje recibido no es un objeto JSON");
  }

  return {
    type: payload.type,
    body: payload.body,
  };
}

exports.handler = async (event) => {
  const records = event.Records ?? [];
  const results = [];

  for (const record of records) {
    const { type, body } = parseRecord(record);

    if (type !== "report.requested") {
      console.warn("Evento ignorado por tipo no compatible:", type ?? "sin tipo");
      continue;
    }

    results.push(await reportService.generateReport(body));
  }

  return {
    processed: records.length,
    results,
  };
};
