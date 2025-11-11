import * as XLSX from "xlsx";
import { Pedido, CierreCaja, EstadoPedido } from "@/types/domain";
import jsPDF from "jspdf";
import { getLogoDataUrl } from "./logo-loader";
import { formatCOP } from "../utils";

export class ReporteGenerator {
  private static async drawHeader(
    doc: jsPDF,
    title: string,
    subtitle?: string
  ) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    const logoDataUrl = await getLogoDataUrl();
    if (logoDataUrl) {
      const logoWidth = 50;
      const logoHeight = 50;
      const x = (pageWidth - logoWidth) / 2;
      doc.addImage(logoDataUrl, "PNG", x, y, logoWidth, logoHeight, undefined, "FAST");
      y += logoHeight + 6;
    }

    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, y, { align: "center" });
    y += 10;

    if (subtitle) {
      doc.setFontSize(10);
      doc.text(subtitle, pageWidth / 2, y, { align: "center" });
      y += 15;
    }

    return { y, pageWidth, margin };
  }

  static async generarReporteSemanalPDF(
    pedidos: Pedido[],
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<string> {
    const doc = new jsPDF();
    const { y: startY, pageWidth, margin } = await this.drawHeader(
      doc,
      "REPORTE SEMANAL DE VENTAS",
      `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`
    );
    let y = startY;

    // Resumen
    const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
    const numeroVentas = pedidos.length;
    const promedioDiario = totalVentas / 7;

    doc.setFontSize(12);
    doc.text(`Total de Ventas: ${formatCOP(totalVentas)}`, margin, y);
    y += 8;
    doc.text(`Número de Ventas: ${numeroVentas}`, margin, y);
    y += 8;
    doc.text(`Promedio Diario: ${formatCOP(promedioDiario)}`, margin, y);
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

    for (const pedido of pedidos) {
      if (y > doc.internal.pageSize.height - 30) {
        doc.addPage();
        const header = await this.drawHeader(
          doc,
          "REPORTE SEMANAL DE VENTAS",
          `Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`
        );
        y = header.y;

        doc.setFontSize(10);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
        doc.text("Fecha", margin, y);
        doc.text("Número", margin + 40, y);
        doc.text("Total", pageWidth - margin - 30, y, { align: "right" });
        y += 8;
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      }

      doc.text(new Date(pedido.fecha).toLocaleDateString(), margin, y);
      doc.text(pedido.numero, margin + 40, y);
      doc.text(formatCOP(pedido.total), pageWidth - margin - 30, y, {
        align: "right",
      });
      y += 6;
    }

    return doc.output("datauristring");
  }

  static generarReporteSemanalExcel(
    pedidos: Pedido[],
    fechaInicio: Date,
    fechaFin: Date
  ): void {
    const datos: Array<{
      Fecha: string;
      "Número de Pedido": string;
      Cliente: string;
      Mesa: string | number;
      Subtotal: number;
      Descuento: number;
      IVA: number;
      Total: number;
      "Método de Pago": string;
      Estado: EstadoPedido | string;
    }> = pedidos.map((p) => ({
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
      Estado: `Promedio Diario: ${formatCOP(promedioDiario)}`,
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

  static async generarReporteCierreCajaPDF(cierre: CierreCaja): Promise<string> {
    const doc = new jsPDF();
    const { y: startY, margin } = await this.drawHeader(
      doc,
      "CIERRE DE CAJA",
      `Fecha: ${new Date(cierre.fecha).toLocaleDateString()}`
    );
    let y = startY;
    const pageWidth = doc.internal.pageSize.width;

    // Resumen
    doc.setFontSize(12);
    doc.text(`Total de Ventas: ${formatCOP(cierre.totalVentas)}`, margin, y);
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
    doc.text(`Efectivo: ${formatCOP(cierre.totalEfectivo)}`, margin + 10, y);
    y += 6;
    doc.text(`Tarjeta: ${formatCOP(cierre.totalTarjeta)}`, margin + 10, y);
    y += 6;
    doc.text(
      `Transferencia: ${formatCOP(cierre.totalTransferencia)}`,
      margin + 10,
      y
    );
    y += 8;

    if (cierre.diferenciaEfectivo !== undefined) {
      doc.setFontSize(12);
      doc.text(
        `Diferencia Efectivo: ${formatCOP(cierre.diferenciaEfectivo)}`,
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

    return doc.output("datauristring");
  }
}
