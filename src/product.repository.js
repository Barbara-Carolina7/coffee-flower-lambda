
const { Pool } = require("pg");

let pool;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Falta configurar DATABASE_URL");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === "false"
          ? false
          : { rejectUnauthorized: false },
      max: 2,
    });
  }

  return pool;
}

function validarFechas(desde, hasta) {
  const formato = /^\d{4}-\d{2}-\d{2}$/;

  if (
    !formato.test(desde || "") ||
    !formato.test(hasta || "") ||
    desde > hasta
  ) {
    throw new Error("Fechas inválidas: usa YYYY-MM-DD");
  }
}

async function resumenVentas(desde, hasta) {
  validarFechas(desde, hasta);

  const consultaPedidos = `
    SELECT
      COUNT(*) AS pedidos,
      COALESCE(SUM(total), 0) AS total_ventas
    FROM pedidos
    WHERE creado_en >= $1::date
      AND creado_en < ($2::date + INTERVAL '1 day')
  `;

  const consultaUnidades = `
    SELECT COALESCE(SUM(i.cantidad), 0) AS unidades
    FROM pedido_items i
    INNER JOIN pedidos p ON p.id = i.pedido_id
    WHERE p.creado_en >= $1::date
      AND p.creado_en < ($2::date + INTERVAL '1 day')
  `;

  const [pedidos, unidades] = await Promise.all([
    getPool().query(consultaPedidos, [desde, hasta]),
    getPool().query(consultaUnidades, [desde, hasta]),
  ]);

  return {
    pedidos: Number(pedidos.rows[0].pedidos),
    unidades: Number(unidades.rows[0].unidades),
    totalVentas: Number(pedidos.rows[0].total_ventas),
  };
}

async function topProductosVendidos(desde, hasta) {
  validarFechas(desde, hasta);

  const consulta = `
    SELECT
      i.producto_id AS id,
      i.nombre,
      SUM(i.cantidad)::integer AS unidades,
      SUM(i.cantidad * i.precio) AS total_vendido
    FROM pedido_items i
    INNER JOIN pedidos p ON p.id = i.pedido_id
    WHERE p.creado_en >= $1::date
      AND p.creado_en < ($2::date + INTERVAL '1 day')
    GROUP BY i.producto_id, i.nombre
    ORDER BY SUM(i.cantidad) DESC,
             SUM(i.cantidad * i.precio) DESC
    LIMIT 10
  `;

  const { rows } = await getPool().query(consulta, [desde, hasta]);

  return rows.map((producto) => ({
    id: producto.id,
    nombre: producto.nombre,
    unidades: Number(producto.unidades),
    totalVendido: Number(producto.total_vendido),
  }));
}

module.exports = {
  resumenVentas,
  topProductosVendidos,
};
