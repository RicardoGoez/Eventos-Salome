import jsPDF from "jspdf";
import { Pedido } from "@/types/domain";
import { formatCOP } from "../utils";
import { getLogoDataUrl } from "./logo-loader";

export class TicketGenerator {
  private static async drawHeader(doc: jsPDF, pageWidth: number, margin: number) {
    const logoDataUrl = await getLogoDataUrl();
    let y = margin;

    if (logoDataUrl) {
      const logoWidth = 40;
      const logoHeight = 40;
      const x = (pageWidth - logoWidth) / 2;
      doc.addImage(logoDataUrl, "PNG", x, y, logoWidth, logoHeight, undefined, "FAST");
      y += logoHeight + 6;
    }

    doc.setFontSize(18);
    doc.text("Eventos Salome", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.text("Ticket de Compra", pageWidth / 2, y, { align: "center" });
    y += 10;

    return y;
  }

  static async generarPDF(pedido: Pedido): Promise<string> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = await this.drawHeader(doc, pageWidth, margin);

    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Número de Pedido: ${pedido.numero}`, margin, y);
    y += 6;
    doc.text(`Fecha: ${new Date(pedido.fecha).toLocaleString()}`, margin, y);
    y += 6;

    if (pedido.mesa) {
      doc.text(`Mesa: ${pedido.mesa.numero}`, margin, y);
      y += 6;
    }

    if (pedido.clienteNombre) {
      doc.text(`Cliente: ${pedido.clienteNombre}`, margin, y);
      y += 6;
    }

    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.text("Productos:", margin, y);
    y += 8;

    pedido.items.forEach((item) => {
      const nombre = item.producto?.nombre || item.productoId;
      const line = `${nombre} x${item.cantidad}`;
      doc.text(line, margin, y);
      doc.text(formatCOP(item.subtotal), pageWidth - margin - 30, y, {
        align: "right",
      });
      y += 6;
    });

    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Subtotal: ${formatCOP(pedido.subtotal)}`, margin, y);
    y += 6;

    if (pedido.descuento && pedido.descuento > 0) {
      doc.text(`Descuento: -${formatCOP(pedido.descuento)}`, margin, y);
      y += 6;
    }

    doc.text(`IVA (16%): ${formatCOP(pedido.iva)}`, margin, y);
    y += 6;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: ${formatCOP(pedido.total)}`, margin, y);
    y += 8;

    if (pedido.metodoPago) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Método de Pago: ${pedido.metodoPago}`, margin, y);
      y += 6;
    }

    if (pedido.ticketQR) {
      y += 5;
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.text("Código QR disponible", pageWidth / 2, y, { align: "center" });
      y += 6;
    }

    y += 10;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(8);
    doc.text("¡Gracias por su compra!", pageWidth / 2, y, { align: "center" });

    return doc.output("datauristring");
  }

  static async descargarPDF(pedido: Pedido, nombreArchivo?: string): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = await this.drawHeader(doc, pageWidth, margin);

    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Número de Pedido: ${pedido.numero}`, margin, y);
    y += 6;
    doc.text(`Fecha: ${new Date(pedido.fecha).toLocaleString()}`, margin, y);
    y += 6;

    if (pedido.mesa) {
      doc.text(`Mesa: ${pedido.mesa.numero}`, margin, y);
      y += 6;
    }

    if (pedido.clienteNombre) {
      doc.text(`Cliente: ${pedido.clienteNombre}`, margin, y);
      y += 6;
    }

    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.text("Productos:", margin, y);
    y += 8;

    pedido.items.forEach((item) => {
      const nombre = item.producto?.nombre || item.productoId;
      const line = `${nombre} x${item.cantidad}`;
      doc.text(line, margin, y);
      doc.text(formatCOP(item.subtotal), pageWidth - margin - 30, y, {
        align: "right",
      });
      y += 6;
    });

    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Subtotal: ${formatCOP(pedido.subtotal)}`, margin, y);
    y += 6;

    if (pedido.descuento && pedido.descuento > 0) {
      doc.text(`Descuento: -${formatCOP(pedido.descuento)}`, margin, y);
      y += 6;
    }

    doc.text(`IVA (16%): ${formatCOP(pedido.iva)}`, margin, y);
    y += 6;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: ${formatCOP(pedido.total)}`, margin, y);
    y += 8;

    if (pedido.metodoPago) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Método de Pago: ${pedido.metodoPago}`, margin, y);
      y += 6;
    }

    y += 10;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(8);
    doc.text("¡Gracias por su compra!", pageWidth / 2, y, { align: "center" });

    doc.save(nombreArchivo || `ticket-${pedido.numero}.pdf`);
  }
}
