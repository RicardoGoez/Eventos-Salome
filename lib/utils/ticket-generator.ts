import jsPDF from "jspdf";
import { Pedido } from "@/types/domain";
import { formatCOP } from "../utils";

export class TicketGenerator {
  static generarPDF(pedido: Pedido): string {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    // Título
    doc.setFontSize(18);
    doc.text("CAFETERÍA", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.text("Ticket de Compra", pageWidth / 2, y, { align: "center" });
    y += 10;

    // Línea separadora
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Información del pedido
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

    // Items
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

    // Totales
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

    // Código QR si existe
    if (pedido.ticketQR) {
      y += 5;
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      
      // Nota: Para insertar la imagen QR se necesitaría convertir base64 a imagen
      doc.text("Código QR disponible", pageWidth / 2, y, { align: "center" });
    }

    y += 10;
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(8);
    doc.text("¡Gracias por su compra!", pageWidth / 2, y, { align: "center" });

    // Generar URL del blob
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    return url;
  }

  static descargarPDF(pedido: Pedido, nombreArchivo?: string): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    // Título
    doc.setFontSize(18);
    doc.text("CAFETERÍA", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.text("Ticket de Compra", pageWidth / 2, y, { align: "center" });
    y += 10;

    // Línea separadora
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Información del pedido
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

    // Items
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

    // Totales
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

    // Descargar
    doc.save(nombreArchivo || `ticket-${pedido.numero}.pdf`);
  }
}
