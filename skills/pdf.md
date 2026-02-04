# PDF Processing Skill

Use this skill whenever you need to create, read, or manipulate PDF files. This includes generating invoices, creating reports, adding watermarks, or extracting data from PDFs.

## Quick Start - Creating PDFs with ReportLab

```python
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Basic PDF Creation
c = canvas.Canvas("output.pdf", pagesize=letter)
width, height = letter

# Add text
c.drawString(100, height - 100, "Hello World!")

# Save
c.save()
```

## Creating Professional Invoices

```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch, mm

def create_invoice(filename, invoice_data):
    doc = SimpleDocTemplate(filename, pagesize=A4,
                           rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=72)
    
    styles = getSampleStyleSheet()
    story = []
    
    # Company Header
    company_style = ParagraphStyle(
        'CompanyHeader',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=6
    )
    story.append(Paragraph("Lanka Chemist", company_style))
    story.append(Paragraph("NMRA License: XXXXX", styles['Normal']))
    story.append(Paragraph("Address Line 1, City, Sri Lanka", styles['Normal']))
    story.append(Paragraph("Phone: +94 XX XXX XXXX", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Invoice Title
    story.append(Paragraph(f"INVOICE #{invoice_data['invoice_number']}", styles['Heading2']))
    story.append(Paragraph(f"Date: {invoice_data['date']}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Customer Details
    story.append(Paragraph("Bill To:", styles['Heading3']))
    story.append(Paragraph(invoice_data['customer_name'], styles['Normal']))
    story.append(Paragraph(invoice_data['customer_address'], styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Items Table
    table_data = [['Item', 'Qty', 'Unit Price', 'Total']]
    for item in invoice_data['items']:
        table_data.append([
            item['name'],
            str(item['quantity']),
            f"Rs {item['price']:,.2f}",
            f"Rs {item['quantity'] * item['price']:,.2f}"
        ])
    
    # Add totals
    subtotal = sum(item['quantity'] * item['price'] for item in invoice_data['items'])
    table_data.append(['', '', 'Subtotal:', f"Rs {subtotal:,.2f}"])
    table_data.append(['', '', 'Delivery:', f"Rs {invoice_data['delivery_fee']:,.2f}"])
    table_data.append(['', '', 'TOTAL:', f"Rs {subtotal + invoice_data['delivery_fee']:,.2f}"])
    
    table = Table(table_data, colWidths=[250, 50, 100, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -4), colors.white),
        ('GRID', (0, 0), (-1, -4), 1, colors.black),
        ('FONTNAME', (2, -3), (-1, -1), 'Helvetica-Bold'),
    ]))
    
    story.append(table)
    story.append(Spacer(1, 30))
    
    # Payment Details
    story.append(Paragraph("Payment Details:", styles['Heading3']))
    story.append(Paragraph("Bank: XXXXX Bank", styles['Normal']))
    story.append(Paragraph("Account: XXXX-XXXX-XXXX", styles['Normal']))
    story.append(Paragraph("Branch: XXXXX", styles['Normal']))
    
    doc.build(story)

# Example usage:
invoice_data = {
    'invoice_number': 'INV-001',
    'date': '2024-01-15',
    'customer_name': 'Dr. John Smith',
    'customer_address': '123 Medical Center, Colombo',
    'items': [
        {'name': 'Paracetamol 500mg (100 tabs)', 'quantity': 10, 'price': 150.00},
        {'name': 'Amoxicillin 250mg (50 caps)', 'quantity': 5, 'price': 280.00},
    ],
    'delivery_fee': 250.00
}
create_invoice('invoice.pdf', invoice_data)
```

## Reading PDFs

### Extract Text with pdfplumber
```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        print(text)
```

### Extract Tables
```python
import pdfplumber
import pandas as pd

with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            df = pd.DataFrame(table[1:], columns=table[0])
            print(df)
```

## Manipulating PDFs with pypdf

### Merge PDFs
```python
from pypdf import PdfWriter, PdfReader

writer = PdfWriter()
for pdf_file in ["doc1.pdf", "doc2.pdf"]:
    reader = PdfReader(pdf_file)
    for page in reader.pages:
        writer.add_page(page)

with open("merged.pdf", "wb") as output:
    writer.write(output)
```

### Add Watermark
```python
from pypdf import PdfReader, PdfWriter

watermark = PdfReader("watermark.pdf").pages[0]
reader = PdfReader("document.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.merge_page(watermark)
    writer.add_page(page)

with open("watermarked.pdf", "wb") as output:
    writer.write(output)
```

### Rotate Pages
```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

page = reader.pages[0]
page.rotate(90)  # Rotate 90 degrees clockwise
writer.add_page(page)

with open("rotated.pdf", "wb") as output:
    writer.write(output)
```

## Important Notes

### Subscripts and Superscripts
**NEVER use Unicode subscript/superscript characters** (₀₁₂₃₄₅₆₇₈₉, ⁰¹²³⁴⁵⁶⁷⁸⁹) in ReportLab PDFs. The built-in fonts do not include these glyphs, causing them to render as solid black boxes.

Use ReportLab's XML markup tags instead:
```python
# Subscripts: use <sub> tag
chemical = Paragraph("H<sub>2</sub>O", styles['Normal'])

# Superscripts: use <super> tag
squared = Paragraph("x<super>2</super>", styles['Normal'])
```

### Required Libraries
```bash
pip install reportlab pypdf pdfplumber
```

## Quick Reference

| Task | Library | Method |
|------|---------|--------|
| Create PDFs | reportlab | Canvas or Platypus |
| Read text | pdfplumber | `page.extract_text()` |
| Read tables | pdfplumber | `page.extract_tables()` |
| Merge PDFs | pypdf | `writer.add_page()` |
| Split PDFs | pypdf | One page per file |
| Add watermark | pypdf | `page.merge_page()` |
| Rotate pages | pypdf | `page.rotate()` |
