
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sns = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const TOPIC_ARN = process.env.REPORT_TOPIC_ARN;

async function sendReport(report) {
  if (!TOPIC_ARN) {
    throw new Error("Falta configurar la variable REPORT_TOPIC_ARN");
  }

  if (!report || !report.text) {
    throw new Error("El informe no contiene texto para enviar");
  }

  const subject = `Coffee Flower - Informe de ventas ${report.reportId}`;

  await sns.send(
    new PublishCommand({
      TopicArn: TOPIC_ARN,
      Subject: subject.slice(0, 100),
      Message: report.text,
      MessageAttributes: {
        reportId: {
          DataType: "String",
          StringValue: String(report.reportId),
        },
        reportType: {
          DataType: "String",
          StringValue: String(report.type || "ventas"),
        },
      },
    })
  );

  console.log(`Informe ${report.reportId} publicado en SNS`);

  return {
    success: true,
    reportId: report.reportId,
  };
}

module.exports = {
  sendReport,
};
