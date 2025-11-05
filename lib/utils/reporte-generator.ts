import * as XLSX from "xlsx";
import { Pedido, CierreCaja } from "@/types/domain";
import jsPDF from "jspdf";

export class ReporteGenerator {
  static generarReporteSemanalPDF(
    pedidos: Pedido[],
    fechaInicio: Date,
    fechaFin: Date
  ): string {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    // Título
    doc.setFontSize(18);
    doc.text("REPORTE SEMANAL DE VENTAS", pageWidth / 2, y, {
      align: "center",
    });
    y += 10;

    doc.setFontSize(10);
    doc.text(
      `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 15;

    // Resumen
    const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
    const numeroVentas = pedidos.length;
    const promedioDiario = totalVentas / 7;

    doc.setFontSize(12);
    doc.text(`Total de Ventas: $${totalVentas.toFixed(2)}`, margin, y);
    y += 8;
    doc.text(`Número de Ventas: ${numeroVentas}`, margin, y);
    y += 8;
    doc.text(`Promedio Diario: $${promedioDiario.toFixed(2)}`, margin, y);
    y += 15;

    // Tabla de ventas
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.text("Fecha", margin, y);
    doc.text("Número", margin + 40, y);
    doc.text("Total", pageWidth - margin - 30, y, { align: "right" });
    y += 8;
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    pedidos.forEach((pedido) => {
      if (y > doc.internal.pageSize.height - 30) {
        doc.addPage();
        y = margin;
      }

      doc.text(new Date(pedido.fecha).toLocaleDateString(), margin, y);
      doc.text(pedido.numero, margin + 40, y);
      doc.text(`$${pedido.total.toFixed(2)}`, pageWidth - margin - 30, y, {
        align: "right",
      });
      y += 6;
    });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    return url;
  }

  static generarReporteSemanalExcel(
    pedidos: Pedido[],
    fechaInicio: Date,
    fechaFin: Date
  ): void {
    const datos = pedidos.map((p) => ({
      Fecha: new Date(p.fecha).toLocaleDateString(),
      "Número de Pedido": p.numero,
      Cliente: p.clienteNombre || "-",
      Mesa: p.mesa?.numero || "-",
      Subtotal: p.subtotal,
      Descuento: p.descuento || 0,
      IVA: p.iva,
      Total: p.total,
      "Método de Pago": p.metodoPago || "-",
      Estado: p.estado,
    }));

    const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
    const numeroVentas = pedidos.length;
    const promedioDiario = totalVentas / 7;

    datos.push({
      Fecha: "",
      "Número de Pedido": "",
      Cliente: "",
      Mesa: "",
      Subtotal: 0,
      Descuento: 0,
      IVA: 0,
      Total: 0,
      "Método de Pago": "",
      Estado: "",
    });

    datos.push({
      Fecha: "RESUMEN",
      "Número de Pedido": "",
      Cliente: "",
      Mesa: "",
      Subtotal: 0,
      Descuento: 0,
      IVA: 0,
      Total: totalVentas,
      "Método de Pago": `Total Ventas: ${numeroVentas}`,
      Estado: `Promedio Diario: $${promedioDiario.toFixed(2)}`,
    });

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Semanal");

    XLSX.writeFile(
      wb,
      `reporte-semanal-${fechaInicio.toISOString().split("T")[0]}.xlsx`
    );
  }

  static generarReporteMensualExcel(
    pedidos: Pedido[],
    fechaInicio: Date,
    fechaFin: Date
  ): void {
    const datos = pedidos.map((p) => ({
      Fecha: new Date(p.fecha).toLocaleDateString(),
      "Número de Pedido": p.numero,
      Cliente: p.clienteNombre || "-",
      Mesa: p.mesa?.numero || "-",
      Subtotal: p.subtotal,
      Descuento: p.descuento || 0,
      IVA: p.iva,
      Total: p.total,
      "Método de Pago": p.metodoPago || "-",
      Estado: p.estado,
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Mensual");

    XLSX.writeFile(
      wb,
      `reporte-mensual-${fechaInicio.toISOString().split("T")[0]}.xlsx`
    );
  }

  static generarReporteCierreCajaPDF(cierre: CierreCaja): string {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    // Título
    doc.setFontSize(18);
    doc.text("CIERRE DE CAJA", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.text(
      `Fecha: ${new Date(cierre.fecha).toLocaleDateString()}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 15;

    // Resumen
    doc.setFontSize(12);
    doc.text(`Total de Ventas: $${cierre.totalVentas.toFixed(2)}`, margin, y);
    y += 8;
    doc.text(`Número de Pedidos: ${cierre.numeroPedidos}`, margin, y);
    y += 8;
    doc.text(
      `Pedidos Cancelados: ${cierre.numeroPedidosCancelados}`,
      margin,
      y
    );
    y += 15;

    // Por método de pago
    doc.text("Por Método de Pago:", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Efectivo: $${cierre.totalEfectivo.toFixed(2)}`, margin + 10, y);
    y += 6;
    doc.text(`Tarjeta: $${cierre.totalTarjeta.toFixed(2)}`, margin + 10, y);
    y += 6;
    doc.text(
      `Transferencia: $${cierre.totalTransferencia.toFixed(2)}`,
      margin + 10,
      y
    );
    y += 8;

    if (cierre.diferenciaEfectivo !== undefined) {
      doc.setFontSize(12);
      doc.text(
        `Diferencia Efectivo: $${cierre.diferenciaEfectivo.toFixed(2)}`,
        margin,
        y
      );
      y += 8;
    }

    if (cierre.notas) {
      y += 5;
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Notas: ${cierre.notas}`, margin, y);
    }

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    return url;
  }
}
