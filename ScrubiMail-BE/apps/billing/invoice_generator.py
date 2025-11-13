"""
PDF Invoice Generator using ReportLab
"""
from io import BytesIO
from decimal import Decimal
from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from django.utils import timezone


class InvoiceGenerator:
    """Generate PDF invoices"""
    
    def __init__(self, invoice):
        self.invoice = invoice
        self.buffer = BytesIO()
        self.pagesize = A4
        self.width, self.height = self.pagesize
        
    def generate(self):
        """Generate PDF and return buffer"""
        # Create PDF document
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=self.pagesize,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
        )
        
        # Container for PDF elements
        elements = []
        
        # Add content
        elements.extend(self._create_header())
        elements.append(Spacer(1, 0.3*inch))
        elements.extend(self._create_invoice_details())
        elements.append(Spacer(1, 0.3*inch))
        elements.extend(self._create_customer_details())
        elements.append(Spacer(1, 0.4*inch))
        elements.extend(self._create_line_items())
        elements.append(Spacer(1, 0.3*inch))
        elements.extend(self._create_totals())
        elements.append(Spacer(1, 0.5*inch))
        elements.extend(self._create_footer())
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF data
        pdf = self.buffer.getvalue()
        self.buffer.close()
        
        return pdf
    
    def _get_styles(self):
        """Get text styles"""
        styles = getSampleStyleSheet()
        
        # Custom styles
        styles.add(ParagraphStyle(
            name='CompanyName',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=6,
        ))
        
        styles.add(ParagraphStyle(
            name='InvoiceTitle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor('#2563eb'),
            alignment=TA_RIGHT,
        ))
        
        styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#374151'),
            spaceAfter=12,
        ))
        
        return styles
    
    def _create_header(self):
        """Create invoice header with company info"""
        elements = []
        styles = self._get_styles()
        
        # Company name and invoice title side by side
        header_data = [
            [
                Paragraph('<b>ScrubiMail</b>', styles['CompanyName']),
                Paragraph('INVOICE', styles['InvoiceTitle'])
            ]
        ]
        
        header_table = Table(header_data, colWidths=[3.5*inch, 3*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        
        elements.append(header_table)
        
        # Company details
        company_info = """
        <font size=9>
        Email Validation Platform<br/>
        support@scrubimail.com<br/>
        www.scrubimail.com
        </font>
        """
        
        elements.append(Paragraph(company_info, styles['Normal']))
        
        return elements
    
    def _create_invoice_details(self):
        """Create invoice number and date section"""
        elements = []
        styles = self._get_styles()
        
        invoice_data = [
            ['Invoice Number:', self.invoice.invoice_number],
            ['Invoice Date:', self.invoice.invoice_date.strftime('%B %d, %Y')],
            ['Status:', self.invoice.get_status_display()],
        ]
        
        if self.invoice.due_date:
            invoice_data.append(['Due Date:', self.invoice.due_date.strftime('%B %d, %Y')])
        
        if self.invoice.paid_date:
            invoice_data.append(['Paid Date:', self.invoice.paid_date.strftime('%B %d, %Y')])
        
        if self.invoice.payment_reference:
            invoice_data.append(['Payment Reference:', self.invoice.payment_reference])
        
        invoice_table = Table(invoice_data, colWidths=[2*inch, 4.5*inch])
        invoice_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#6b7280')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        elements.append(invoice_table)
        
        return elements
    
    def _create_customer_details(self):
        """Create bill to section"""
        elements = []
        styles = self._get_styles()
        
        elements.append(Paragraph('<b>Bill To:</b>', styles['SectionHeader']))
        
        customer_info = f"""
        <font size=10>
        <b>{self.invoice.customer_name}</b><br/>
        {self.invoice.customer_email}
        """
        
        # Add address if available
        if self.invoice.customer_address:
            addr = self.invoice.customer_address
            if addr.get('line1'):
                customer_info += f"<br/>{addr.get('line1')}"
            if addr.get('line2'):
                customer_info += f"<br/>{addr.get('line2')}"
            if addr.get('city') or addr.get('state'):
                customer_info += f"<br/>{addr.get('city', '')}, {addr.get('state', '')}"
            if addr.get('postal_code'):
                customer_info += f" {addr.get('postal_code')}"
            if addr.get('country'):
                customer_info += f"<br/>{addr.get('country')}"
        
        customer_info += "</font>"
        
        elements.append(Paragraph(customer_info, styles['Normal']))
        
        return elements
    
    def _create_line_items(self):
        """Create line items table"""
        elements = []
        styles = self._get_styles()
        
        elements.append(Paragraph('<b>Items</b>', styles['SectionHeader']))
        
        # Table header
        data = [
            ['Description', 'Quantity', 'Unit Price', 'Total']
        ]
        
        # Add line items
        for item in self.invoice.line_items.all():
            data.append([
                item.description,
                f"{item.quantity}",
                f"{self.invoice.currency} {item.unit_price:,.2f}",
                f"{self.invoice.currency} {item.total:,.2f}"
            ])
        
        # Create table
        table = Table(data, colWidths=[3.5*inch, 1*inch, 1.25*inch, 1.25*inch])
        table.setStyle(TableStyle([
            # Header styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            
            # Data rows styling
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#374151')),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            
            # Alignment
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),  # Quantity
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),   # Unit Price
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),   # Total
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#d1d5db')),
        ]))
        
        elements.append(table)
        
        return elements
    
    def _create_totals(self):
        """Create totals section"""
        elements = []
        
        totals_data = []
        
        # Subtotal
        totals_data.append([
            'Subtotal:',
            f"{self.invoice.currency} {self.invoice.subtotal:,.2f}"
        ])
        
        # Discount
        if self.invoice.discount_amount > 0:
            totals_data.append([
                'Discount:',
                f"-{self.invoice.currency} {self.invoice.discount_amount:,.2f}"
            ])
        
        # Tax
        if self.invoice.tax_amount > 0:
            totals_data.append([
                'Tax:',
                f"{self.invoice.currency} {self.invoice.tax_amount:,.2f}"
            ])
        
        # Total
        totals_data.append([
            'Total:',
            f"{self.invoice.currency} {self.invoice.total_amount:,.2f}"
        ])
        
        # Amount paid
        if self.invoice.amount_paid > 0:
            totals_data.append([
                'Amount Paid:',
                f"{self.invoice.currency} {self.invoice.amount_paid:,.2f}"
            ])
            
            # Balance due
            balance = self.invoice.total_amount - self.invoice.amount_paid
            if balance > 0:
                totals_data.append([
                    'Balance Due:',
                    f"{self.invoice.currency} {balance:,.2f}"
                ])
        
        # Create table (right-aligned)
        totals_table = Table(totals_data, colWidths=[4.75*inch, 1.75*inch])
        totals_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -2), 'Helvetica'),
            ('FONTNAME', (0, -1), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -2), 10),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TEXTCOLOR', (0, 0), (-1, -2), colors.HexColor('#6b7280')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#1f2937')),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#2563eb')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(totals_table)
        
        return elements
    
    def _create_footer(self):
        """Create invoice footer"""
        elements = []
        styles = self._get_styles()
        
        # Notes if any
        if self.invoice.notes:
            elements.append(Paragraph('<b>Notes:</b>', styles['SectionHeader']))
            elements.append(Paragraph(self.invoice.notes, styles['Normal']))
            elements.append(Spacer(1, 0.3*inch))
        
        # Thank you message
        footer_text = """
        <font size=9 color="#6b7280">
        <b>Thank you for your business!</b><br/>
        If you have any questions about this invoice, please contact support@scrubimail.com
        </font>
        """
        
        footer_para = Paragraph(footer_text, ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            alignment=TA_CENTER,
        ))
        
        elements.append(footer_para)
        
        return elements
