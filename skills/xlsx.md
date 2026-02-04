# Excel/Spreadsheet Skill

Use this skill when creating, editing, or analyzing Excel spreadsheets (.xlsx, .xlsm, .csv, .tsv files). This includes generating reports, data exports, bulk imports, and data analysis.

## Overview

Choose the right tool for the task:
- **pandas**: Best for data analysis, bulk operations, and simple data export
- **openpyxl**: Best for complex formatting, formulas, and Excel-specific features

## Reading and Analyzing Data with Pandas

```python
import pandas as pd

# Read Excel
df = pd.read_excel('file.xlsx')  # Default: first sheet
all_sheets = pd.read_excel('file.xlsx', sheet_name=None)  # All sheets as dict

# Read specific columns
df = pd.read_excel('file.xlsx', usecols=['A', 'C', 'E'])

# Read with data types
df = pd.read_excel('file.xlsx', dtype={'id': str, 'price': float})

# Analyze
df.head()      # Preview data
df.info()      # Column info
df.describe()  # Statistics

# Write Excel
df.to_excel('output.xlsx', index=False)
```

## Creating Excel Files with openpyxl

### Basic Creation
```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils.dataframe import dataframe_to_rows

wb = Workbook()
sheet = wb.active
sheet.title = "Sales Report"

# Add data
sheet['A1'] = 'Product'
sheet['B1'] = 'Quantity'
sheet['C1'] = 'Price'
sheet.append(['Paracetamol', 100, 150.00])
sheet.append(['Amoxicillin', 50, 280.00])

# Save
wb.save('output.xlsx')
```

### Professional Formatting
```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

wb = Workbook()
sheet = wb.active

# Define styles
header_font = Font(bold=True, color='FFFFFF', size=12)
header_fill = PatternFill('solid', fgColor='4472C4')
center_align = Alignment(horizontal='center', vertical='center')
thin_border = Border(
    left=Side(style='thin'),
    right=Side(style='thin'),
    top=Side(style='thin'),
    bottom=Side(style='thin')
)

# Headers
headers = ['Product', 'Quantity', 'Unit Price', 'Total']
for col, header in enumerate(headers, 1):
    cell = sheet.cell(row=1, column=col, value=header)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = center_align
    cell.border = thin_border

# Column widths
sheet.column_dimensions['A'].width = 30
sheet.column_dimensions['B'].width = 12
sheet.column_dimensions['C'].width = 15
sheet.column_dimensions['D'].width = 15

wb.save('formatted_report.xlsx')
```

## CRITICAL: Use Formulas, Not Hardcoded Values

**Always use Excel formulas instead of calculating values in Python and hardcoding them.** This ensures the spreadsheet remains dynamic and updateable.

### ❌ WRONG - Hardcoding Calculated Values
```python
# Bad: Calculating in Python and hardcoding result
total = df['Sales'].sum()
sheet['B10'] = total  # Hardcodes 5000

# Bad: Computing growth rate in Python
growth = (df.iloc[-1]['Revenue'] - df.iloc[0]['Revenue']) / df.iloc[0]['Revenue']
sheet['C5'] = growth  # Hardcodes 0.15
```

### ✅ CORRECT - Using Excel Formulas
```python
# Good: Let Excel calculate the sum
sheet['B10'] = '=SUM(B2:B9)'

# Good: Growth rate as Excel formula
sheet['C5'] = '=(C4-C2)/C2'

# Good: Average using Excel function
sheet['D20'] = '=AVERAGE(D2:D19)'
```

## Creating Reports for Lanka Chemist

### Sales Report Example
```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import BarChart, Reference
from datetime import datetime

def create_sales_report(data, filename):
    wb = Workbook()
    sheet = wb.active
    sheet.title = "Sales Report"
    
    # Styles
    header_font = Font(bold=True, color='FFFFFF')
    header_fill = PatternFill('solid', fgColor='2E7D32')  # Green for pharmacy
    money_format = 'Rs #,##0.00'
    
    # Title
    sheet['A1'] = 'Lanka Chemist - Sales Report'
    sheet['A1'].font = Font(bold=True, size=16)
    sheet['A2'] = f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}'
    
    # Headers (starting row 4)
    headers = ['Date', 'Order #', 'Customer', 'Items', 'Subtotal', 'Delivery', 'Total']
    for col, header in enumerate(headers, 1):
        cell = sheet.cell(row=4, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
    
    # Data rows
    for row_idx, order in enumerate(data, 5):
        sheet.cell(row=row_idx, column=1, value=order['date'])
        sheet.cell(row=row_idx, column=2, value=order['order_number'])
        sheet.cell(row=row_idx, column=3, value=order['customer'])
        sheet.cell(row=row_idx, column=4, value=order['items_count'])
        sheet.cell(row=row_idx, column=5, value=order['subtotal']).number_format = money_format
        sheet.cell(row=row_idx, column=6, value=order['delivery']).number_format = money_format
        sheet.cell(row=row_idx, column=7, value=order['total']).number_format = money_format
    
    # Totals row (using formulas!)
    last_row = 4 + len(data)
    total_row = last_row + 1
    sheet.cell(row=total_row, column=4, value='TOTALS:').font = Font(bold=True)
    sheet.cell(row=total_row, column=5, value=f'=SUM(E5:E{last_row})').number_format = money_format
    sheet.cell(row=total_row, column=6, value=f'=SUM(F5:F{last_row})').number_format = money_format
    sheet.cell(row=total_row, column=7, value=f'=SUM(G5:G{last_row})').number_format = money_format
    
    # Column widths
    sheet.column_dimensions['A'].width = 12
    sheet.column_dimensions['B'].width = 12
    sheet.column_dimensions['C'].width = 25
    sheet.column_dimensions['D'].width = 8
    sheet.column_dimensions['E'].width = 15
    sheet.column_dimensions['F'].width = 12
    sheet.column_dimensions['G'].width = 15
    
    wb.save(filename)

# Example usage
sales_data = [
    {'date': '2024-01-15', 'order_number': 'ORD-001', 'customer': 'Dr. Smith', 'items_count': 5, 'subtotal': 2500.00, 'delivery': 250.00, 'total': 2750.00},
    {'date': '2024-01-15', 'order_number': 'ORD-002', 'customer': 'City Pharmacy', 'items_count': 12, 'subtotal': 8500.00, 'delivery': 0.00, 'total': 8500.00},
]
create_sales_report(sales_data, 'sales_report.xlsx')
```

### Inventory Report Example
```python
def create_inventory_report(products, filename):
    wb = Workbook()
    sheet = wb.active
    sheet.title = "Inventory"
    
    # Styles
    header_fill = PatternFill('solid', fgColor='1565C0')
    low_stock_fill = PatternFill('solid', fgColor='FFCDD2')  # Light red for low stock
    
    # Headers
    headers = ['SKU', 'Product Name', 'Category', 'Stock', 'Threshold', 'Status', 'Price']
    for col, header in enumerate(headers, 1):
        cell = sheet.cell(row=1, column=col, value=header)
        cell.font = Font(bold=True, color='FFFFFF')
        cell.fill = header_fill
    
    # Data
    for row_idx, product in enumerate(products, 2):
        sheet.cell(row=row_idx, column=1, value=product['sku'])
        sheet.cell(row=row_idx, column=2, value=product['name'])
        sheet.cell(row=row_idx, column=3, value=product['category'])
        sheet.cell(row=row_idx, column=4, value=product['stock'])
        sheet.cell(row=row_idx, column=5, value=product['threshold'])
        
        # Status formula
        sheet.cell(row=row_idx, column=6, value=f'=IF(D{row_idx}<=E{row_idx},"LOW STOCK","OK")')
        
        sheet.cell(row=row_idx, column=7, value=product['price']).number_format = 'Rs #,##0.00'
        
        # Highlight low stock
        if product['stock'] <= product['threshold']:
            for col in range(1, 8):
                sheet.cell(row=row_idx, column=col).fill = low_stock_fill
    
    wb.save(filename)
```

## Editing Existing Files

```python
from openpyxl import load_workbook

# Load existing file
wb = load_workbook('existing.xlsx')
sheet = wb.active  # or wb['SheetName']

# Modify cells
sheet['A1'] = 'New Value'

# Insert/delete rows and columns
sheet.insert_rows(2)
sheet.delete_cols(3)

# Add new sheet
new_sheet = wb.create_sheet('NewSheet')
new_sheet['A1'] = 'Data'

wb.save('modified.xlsx')
```

## Working with CSV Files

```python
import pandas as pd

# Read CSV
df = pd.read_csv('products.csv')

# Process data
df['total_value'] = df['quantity'] * df['price']

# Write to Excel
df.to_excel('products.xlsx', index=False)

# Or write back to CSV
df.to_csv('products_updated.csv', index=False)
```

## Bulk Product Import Template

```python
def create_import_template(filename):
    wb = Workbook()
    sheet = wb.active
    sheet.title = "Product Import"
    
    # Headers with instructions
    headers = [
        ('generic_name', 'Generic Name (Required)'),
        ('brand_name', 'Brand Name (Required)'),
        ('manufacturer', 'Manufacturer'),
        ('category', 'Category'),
        ('dosage_form', 'Dosage Form'),
        ('strength', 'Strength'),
        ('pack_size', 'Pack Size'),
        ('price', 'Wholesale Price'),
        ('mrp', 'MRP'),
        ('stock', 'Initial Stock'),
        ('sku', 'SKU/Barcode'),
        ('prescription', 'Prescription Required (Yes/No)'),
    ]
    
    for col, (field, label) in enumerate(headers, 1):
        cell = sheet.cell(row=1, column=col, value=label)
        cell.font = Font(bold=True)
        cell.fill = PatternFill('solid', fgColor='E3F2FD')
    
    # Example row
    example = ['Paracetamol', 'Panadol', 'GSK', 'Analgesics', 'Tablet', '500mg', '100', '150.00', '180.00', '500', 'PAN-500-100', 'No']
    for col, value in enumerate(example, 1):
        sheet.cell(row=2, column=col, value=value)
        sheet.cell(row=2, column=col).font = Font(italic=True, color='666666')
    
    # Adjust column widths
    for col in range(1, len(headers) + 1):
        sheet.column_dimensions[chr(64 + col)].width = 18
    
    wb.save(filename)
```

## Best Practices

### Number Formatting
```python
# Currency (Sri Lankan Rupees)
cell.number_format = 'Rs #,##0.00'

# Percentage
cell.number_format = '0.0%'

# Date
cell.number_format = 'YYYY-MM-DD'

# Negative numbers in parentheses
cell.number_format = '#,##0.00;(#,##0.00)'
```

### Color Coding
```python
# Blue for inputs
input_fill = PatternFill('solid', fgColor='BBDEFB')

# Green for positive/success
success_fill = PatternFill('solid', fgColor='C8E6C9')

# Red for negative/warning
warning_fill = PatternFill('solid', fgColor='FFCDD2')

# Yellow for attention needed
attention_fill = PatternFill('solid', fgColor='FFF9C4')
```

## Required Libraries
```bash
pip install pandas openpyxl
```

## Quick Reference

| Task | Library | Method |
|------|---------|--------|
| Read Excel | pandas | `pd.read_excel()` |
| Write Excel | pandas | `df.to_excel()` |
| Format cells | openpyxl | Font, PatternFill, Alignment |
| Add formulas | openpyxl | `sheet['A1'] = '=SUM(B1:B10)'` |
| Create charts | openpyxl | BarChart, LineChart, PieChart |
| Read CSV | pandas | `pd.read_csv()` |
| Write CSV | pandas | `df.to_csv()` |
