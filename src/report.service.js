
const productRepo = require("./product.repository");
const notifier = require("./notifier");

const MAX_TEXT = 2000;

function validateRequest(body) {
  const { requestId, requester, reportType } = body ?? {};

  if (!requestId || !requester || !reportType) {
    throw new Error(
      "Solicitud inválida: se requiere requestId, requester y reportType"
    );
  }

  return body;
}

function money(value) {
  return `$${Number(value).toLocaleString("es-CL", {
    maximumFractionDigits: 0,
  })} CLP`;
}

function getPeriod(params = {}) {
  const now = new Date();

  const hasta =
    params.hasta ?? now.toISOString().slice(0, 10);

  const desde =
    params.desde ??
    `${hasta.slice(0, 7)}-01`;

  return { desde, hasta };
}

function buildMessage(report, summary, products) {
  const lines = [
    "☕ COFFEE FLOWER",
    "REPORTE DE VENTAS",
    "================================",
    `Periodo: ${report.desde} al ${report.hasta}`,
    "",
    "RESUMEN",
    "--------------------------------",
    `Pedidos registrados: ${summary.pedidos}`,
    `Unidades vendidas: ${summary.unidades}`,
    `TOTAL DE VENTAS: ${money(summary.totalVentas)}`,
    "",
    "TOP 10 - MAS VENDIDOS",
    "--------------------------------",
  ];

  if (products.length === 0) {
    lines.push("No hay productos vendidos en este periodo.");
  } else {
    products.forEach((p, index) => {
      lines.push(
        `${index + 1}. ${p.nombre}`,
        `   Unidades: ${p.unidades} | Ventas: ${money(p.totalVendido)}`
      );
    });
  }

  lines.push(
    "",
    "================================",
    "Gracias por ser parte de Coffee Flower.",
    `Solicitud: ${report.reportId}`
  );

  const text = lines.join("\n");

  if (text.length <= MAX_TEXT) {
    return text;
  }

  return `${text.slice(0, MAX_TEXT - 3)}...`;
}

async function generateReport(input) {
  const request = validateRequest(input);
  const { desde, hasta } = getPeriod(request.params);

  const [summary, products] = await Promise.all([
    productRepo.resumenVentas(desde, hasta),
    productRepo.topProductosVendidos(desde, hasta),
  ]);

  const report = {
    reportId: request.requestId,
    type: request.reportType,
    requester: request.requester,
    desde,
    hasta,
    generatedAt: new Date().toISOString(),
  };

  report.text = buildMessage(report, summary, products);

  await notifier.sendReport(report);

  console.log(
    `Informe generado: ${report.reportId}; pedidos=${summary.pedidos}; productos=${products.length}`
  );

  return {
    reportId: report.reportId,
    type: report.type,
    desde,
    hasta,
    pedidos: summary.pedidos,
    unidades: summary.unidades,
    totalVentas: summary.totalVentas,
    productos: products.length,
  };
}

module.exports = {
  generateReport,
  buildMessage,
};
