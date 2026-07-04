from reportlab.lib.pagesizes import A4 # type: ignore
from reportlab.pdfgen import canvas # type: ignore

def generate_invoice_pdf(invoice, company, path):
    c = canvas.Canvas(path, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, "INVOICE")

    c.setFont("Helvetica", 10)
    c.drawString(50, height - 90, f"Company: {company.name}")
    c.drawString(50, height - 110, f"Billing Period: {invoice.month}/{invoice.year}")

    y = height - 160
    c.drawString(50, y, f"Total Calls: {invoice.total_calls}")
    c.drawString(50, y - 20, f"Total Minutes: {invoice.total_minutes}")
    c.drawString(50, y - 40, f"Total Amount: {invoice.total_cost} {invoice.currency}")

    c.showPage()
    c.save()
