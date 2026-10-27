
const reportService = require("./report.service");

function parseRecord(record) {
  const envelope = JSON.parse(record.body);
  const message = envelope.Message ?? record.body;
  const payload =
    typeof message === "string" ? JSON.parse(message) : message;

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
      throw new Error(`Tipo de mensaje no soportado: ${type}`);
    }

    results.push(await reportService.generateReport(body));
  }

  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};
