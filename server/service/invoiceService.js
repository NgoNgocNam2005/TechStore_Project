import { invoiceRepository } from "../repository/invoiceRepository.js";
import { invoiceDetailRepository } from "../repository/invoiceDetailRepository.js";
import { InvoiceResponseDTO } from "../dto/response/invoiceResponseDTO.js";
import { AppError } from "../exception/AppError.js";

const staffRoles = new Set(["ADMIN", "MANAGER", "SALER"]);

export const invoiceService = {
  async getMine(userId) {
    const invoices = await invoiceRepository.findByUserId(userId);
    if (invoices.length === 0) return [];

    // Lấy toàn bộ dòng hàng trong một truy vấn, tránh N+1 query.
    const details = await invoiceDetailRepository.findByInvoiceIds(
      invoices.map((invoice) => invoice.id)
    );
    const detailsByInvoiceId = new Map(
      invoices.map((invoice) => [String(invoice.id), []])
    );
    for (const detail of details) {
      detailsByInvoiceId.get(String(detail.invoiceId))?.push(detail);
    }

    return invoices.map((invoice) => new InvoiceResponseDTO({
      ...invoice,
      details: detailsByInvoiceId.get(String(invoice.id)) || [],
    }));
  },

  async getById(invoiceId, requester) {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) throw new AppError(`Không tìm thấy hóa đơn #${invoiceId}`, 404);

    if (
      Number(invoice.userId) !== Number(requester.id) &&
      !staffRoles.has(requester.role)
    ) {
      throw new AppError("Bạn không có quyền xem hóa đơn này", 403);
    }

    const details = await invoiceDetailRepository.findByInvoiceId(invoice.id);
    return new InvoiceResponseDTO({ ...invoice, details });
  },
};
