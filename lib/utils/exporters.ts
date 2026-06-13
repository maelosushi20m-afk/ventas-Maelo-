import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { ReportSummary } from "@/lib/services/reportService";
import { formatCLP } from "@/lib/utils";

export function exportReportPDF(r: ReportSummary, from: Date, to: Date) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Maelo Rolls — Reporte de ventas", 14, 16);
  doc.setFontSize(10);
  doc.text(`Rango: ${from.toLocaleDateString()} - ${to.toLocaleDateString()}`, 14, 22);
  doc.text(`Total ventas: ${formatCLP(r.totalVentas)}`, 14, 28);
  doc.text(`Pedidos: ${r.cantidadPedidos}    Ticket promedio: ${formatCLP(r.ticketPromedio)}`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [["Método de pago", "Total"]],
    body: Object.entries(r.porMetodoPago).map(([k, v]) => [k, formatCLP(v)])
  });

  autoTable(doc, {
    head: [["Top productos", "Cant.", "Total"]],
    body: r.topProductos.map((p) => [p.nombre, p.cantidad, formatCLP(p.total)])
  });

  autoTable(doc, {
    head: [["Top promociones", "Cant.", "Total"]],
    body: r.topPromociones.map((p) => [p.nombre, p.cantidad, formatCLP(p.total)])
  });

  autoTable(doc, {
    head: [["Cliente", "Teléfono", "Pedidos", "Total"]],
    body: r.topClientes.map((c) => [c.nombre, c.telefono || "", c.pedidos, formatCLP(c.total)])
  });

  doc.save(`reporte_maelo_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.pdf`);
}

export function exportReportExcel(r: ReportSummary, from: Date, to: Date) {
  const wb = XLSX.utils.book_new();

  const resumen = [
    ["Maelo Rolls — Reporte"],
    ["Desde", from.toLocaleDateString()],
    ["Hasta", to.toLocaleDateString()],
    [],
    ["Total ventas", r.totalVentas],
    ["Pedidos", r.cantidadPedidos],
    ["Ticket promedio", Math.round(r.ticketPromedio)],
    [],
    ["Método de pago", "Total"],
    ...Object.entries(r.porMetodoPago)
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), "Resumen");

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(r.topProductos),
    "TopProductos"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(r.topPromociones),
    "TopPromociones"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(r.topClientes),
    "TopClientes"
  );

  const pedidos = r.orders.map((o) => ({
    numero: o.numeroPedido,
    fecha: new Date((o as any).fecha?.toDate ? (o as any).fecha.toDate() : o.fecha).toISOString(),
    cliente: o.clienteNombre,
    telefono: o.telefono,
    total: o.total,
    metodoPago: o.metodoPago,
    estado: o.estado
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pedidos), "Pedidos");

  XLSX.writeFile(wb, `reporte_maelo_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.xlsx`);
}
