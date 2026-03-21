import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { LoadingSpinner, EmptyState } from '../ui/loading';
import { Search, Eye, FileText, Download, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { API, getErrorMessage } from '../../utils/helpers';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await axios.get(`${API}/spare-parts/bills`);
      setBills(response.data);
    } catch (error) {
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setShowViewModal(true);
  };

  const handleDeleteBill = async (bill) => {
    if (!window.confirm(`Are you sure you want to delete spare parts bill "${bill.bill_number}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/spare-parts/bills/${bill.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from local state
      const updatedBills = bills.filter(b => b.id !== bill.id);
      setBills(updatedBills);
      
      toast.success('Spare parts bill deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete spare parts bill');
    }
  };

  const handlePrintBill = (bill) => {
    // Create a new window with professional bill design for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Spare Parts Bill - ${bill.bill_number}</title>
          <style>
            @media print {
              @page { 
                size: A4;
                margin: 10mm;
              }
              body { margin: 0; }
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 15px; 
              max-width: 190mm;
              margin: 0 auto; 
              background: white;
              color: #333;
              font-size: 10px;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 10px; 
              margin-bottom: 15px; 
            }
            .company-name { 
              font-size: 20px; 
              font-weight: bold; 
              margin-bottom: 3px;
              color: #333;
            }
            .company-info {
              font-size: 9px;
              color: #666;
              line-height: 1.4;
            }
            .bill-title {
              background: #f0f0f0;
              padding: 8px;
              margin-bottom: 12px;
              border-left: 3px solid #333;
            }
            .bill-title h2 {
              margin: 0;
              font-size: 14px;
              color: #333;
            }
            .details-grid {
              display: table;
              width: 100%;
              margin-bottom: 12px;
            }
            .details-col {
              display: table-cell;
              width: 50%;
              vertical-align: top;
              padding: 0 5px;
            }
            .detail-item {
              margin-bottom: 6px;
            }
            .detail-label {
              font-size: 8px;
              color: #666;
              font-weight: 600;
              margin-bottom: 2px;
            }
            .detail-value {
              font-size: 10px;
              color: #333;
              font-weight: 500;
            }
            table.items { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
              font-size: 8px;
            }
            table.items thead {
              background: #333;
              color: white;
            }
            table.items th { 
              padding: 5px 2px;
              text-align: left; 
              font-weight: 600;
              font-size: 7px;
            }
            table.items td { 
              padding: 4px 2px;
              border-bottom: 1px solid #ddd;
              font-size: 8px;
            }
            table.items tbody tr:nth-child(even) {
              background: #f8f8f8;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals-section {
              margin-top: 15px;
              border-top: 2px solid #333;
              padding-top: 10px;
            }
            .totals-table {
              width: 200px;
              margin-left: auto;
              font-size: 9px;
            }
            .totals-table td {
              padding: 3px 5px;
            }
            .total-row-final {
              background: #333;
              color: white;
              font-weight: bold;
              font-size: 11px;
            }
            .footer {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 8px;
              color: #666;
              text-align: center;
            }
            /* Column width optimization for A4 */
            .col-sl { width: 4%; }
            .col-desc { width: 20%; }
            .col-hsn { width: 10%; }
            .col-qty { width: 5%; }
            .col-unit { width: 6%; }
            .col-rate { width: 10%; }
            .col-disc { width: 7%; }
            .col-gst { width: 7%; }
            .col-cgst { width: 10%; }
            .col-sgst { width: 10%; }
            .col-amt { width: 11%; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">M M MOTORS</div>
            <div class="company-info">Two Wheeler Sales & Service Center</div>
            <div class="company-info">Bengaluru main road, behind Ruchi Bakery, Malur, Karnataka 563130</div>
            <div class="company-info">Phone: +91 7026263123</div>
          </div>
          
          <div class="bill-title">
            <h2>SPARE PARTS BILL</h2>
          </div>
          
          <div class="details-grid">
            <div class="details-col">
              <div class="detail-item">
                <div class="detail-label">BILL NO.</div>
                <div class="detail-value">${bill.bill_number}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">CUSTOMER</div>
                <div class="detail-value">${bill.customer_data?.name || 'N/A'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">MOBILE</div>
                <div class="detail-value">${bill.customer_data?.mobile || 'N/A'}</div>
              </div>
            </div>
            <div class="details-col">
              <div class="detail-item">
                <div class="detail-label">DATE</div>
                <div class="detail-value">${new Date(bill.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
              ${bill.customer_data?.vehicle_name ? `
              <div class="detail-item">
                <div class="detail-label">VEHICLE</div>
                <div class="detail-value">${bill.customer_data.vehicle_name}</div>
              </div>
              ` : ''}
              ${bill.customer_data?.vehicle_number ? `
              <div class="detail-item">
                <div class="detail-label">REG. NO.</div>
                <div class="detail-value">${bill.customer_data.vehicle_number}</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <table class="items">
            <thead>
              <tr>
                <th class="col-sl">SL</th>
                <th class="col-desc">DESCRIPTION</th>
                <th class="col-hsn text-center">HSN</th>
                <th class="col-qty text-center">QTY</th>
                <th class="col-unit text-center">UNIT</th>
                <th class="col-rate text-right">RATE</th>
                <th class="col-disc text-right">DISC%</th>
                <th class="col-gst text-right">GST%</th>
                <th class="col-cgst text-right">CGST</th>
                <th class="col-sgst text-right">SGST</th>
                <th class="col-amt text-right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item, index) => `
                <tr>
                  <td class="col-sl">${index + 1}</td>
                  <td class="col-desc">${item.description}</td>
                  <td class="col-hsn text-center">${item.hsn_sac}</td>
                  <td class="col-qty text-center">${item.quantity}</td>
                  <td class="col-unit text-center">${item.unit}</td>
                  <td class="col-rate text-right">₹${item.rate.toFixed(2)}</td>
                  <td class="col-disc text-right">${item.discount_percent}%</td>
                  <td class="col-gst text-right">${item.gst_percent}%</td>
                  <td class="col-cgst text-right">₹${item.cgstAmount.toFixed(2)}</td>
                  <td class="col-sgst text-right">₹${item.sgstAmount.toFixed(2)}</td>
                  <td class="col-amt text-right"><strong>₹${item.finalAmount.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td style="color: #666;">Subtotal:</td>
                <td class="text-right" style="font-weight: bold;">₹${bill.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666;">Discount:</td>
                <td class="text-right" style="font-weight: bold; color: #dc3545;">-₹${bill.total_discount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666;">CGST:</td>
                <td class="text-right" style="font-weight: bold;">₹${bill.total_cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666;">SGST:</td>
                <td class="text-right" style="font-weight: bold;">₹${bill.total_sgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #666; border-top: 1px solid #ddd; padding-top: 5px;">Total Tax:</td>
                <td class="text-right" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;">₹${bill.total_tax.toFixed(2)}</td>
              </tr>
              <tr class="total-row-final">
                <td style="padding: 8px 5px;">TOTAL:</td>
                <td class="text-right" style="padding: 8px 5px;">₹${bill.total_amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div class="footer">
            <p style="margin: 3px 0;">Thank you for your business!</p>
            <p style="margin: 3px 0;">This is a computer-generated bill.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadBill = async (bill) => {
    try {
      // Import html2pdf dynamically
      const { default: html2pdf } = await import('html2pdf.js');
      
      // Create A4-optimized template using tables
      const billHTML = `
        <div style="font-family: Arial, sans-serif; padding: 15px; width: 190mm; font-size: 10px;">
          <!-- Header -->
          <table style="width: 100%; margin-bottom: 12px; border-bottom: 2px solid #333;">
            <tr>
              <td style="text-align: center; padding-bottom: 8px;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 3px;">M M MOTORS</div>
                <div style="font-size: 9px; color: #666;">Two Wheeler Sales & Service Center</div>
                <div style="font-size: 9px; color: #666;">Bengaluru main road, behind Ruchi Bakery, Malur, Karnataka 563130</div>
                <div style="font-size: 9px; color: #666;">Phone: +91 7026263123</div>
              </td>
            </tr>
          </table>
          
          <!-- Bill Title -->
          <table style="width: 100%; margin-bottom: 10px;">
            <tr>
              <td style="background: #f0f0f0; padding: 6px; border-left: 3px solid #333;">
                <div style="font-size: 13px; font-weight: bold;">SPARE PARTS BILL</div>
              </td>
            </tr>
          </table>
          
          <!-- Bill Details -->
          <table style="width: 100%; margin-bottom: 12px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 5px;">
                <table style="width: 100%;">
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">BILL NO.</td></tr>
                  <tr><td style="font-size: 9px; font-weight: bold; padding-bottom: 5px;">${bill.bill_number}</td></tr>
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">CUSTOMER</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${bill.customer_data?.name || 'N/A'}</td></tr>
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">MOBILE</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${bill.customer_data?.mobile || 'N/A'}</td></tr>
                </table>
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 5px;">
                <table style="width: 100%;">
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">DATE</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${new Date(bill.bill_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>
                  ${bill.customer_data?.vehicle_name ? `
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">VEHICLE</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${bill.customer_data.vehicle_name}</td></tr>
                  ` : ''}
                  ${bill.customer_data?.vehicle_number ? `
                  <tr><td style="font-size: 7px; color: #666; padding: 2px 0;">REG. NO.</td></tr>
                  <tr><td style="font-size: 9px; padding-bottom: 5px;">${bill.customer_data.vehicle_number}</td></tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Items Table - Optimized for A4 -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 7px;">
            <thead>
              <tr style="background: #333; color: white;">
                <th style="padding: 5px 2px; text-align: left; border: 1px solid #333; width: 4%;">SL</th>
                <th style="padding: 5px 2px; text-align: left; border: 1px solid #333; width: 20%;">DESCRIPTION</th>
                <th style="padding: 5px 2px; text-align: center; border: 1px solid #333; width: 10%;">HSN</th>
                <th style="padding: 5px 2px; text-align: center; border: 1px solid #333; width: 5%;">QTY</th>
                <th style="padding: 5px 2px; text-align: center; border: 1px solid #333; width: 6%;">UNIT</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 10%;">RATE</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 7%;">DISC%</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 7%;">GST%</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 10%;">CGST</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 10%;">SGST</th>
                <th style="padding: 5px 2px; text-align: right; border: 1px solid #333; width: 11%;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item, index) => `
                <tr style="${index % 2 === 0 ? 'background: #f8f8f8;' : ''}">
                  <td style="padding: 4px 2px; border: 1px solid #ddd;">${index + 1}</td>
                  <td style="padding: 4px 2px; border: 1px solid #ddd; font-size: 7px;">${item.description}</td>
                  <td style="padding: 4px 2px; text-align: center; border: 1px solid #ddd;">${item.hsn_sac}</td>
                  <td style="padding: 4px 2px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 4px 2px; text-align: center; border: 1px solid #ddd;">${item.unit}</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">₹${item.rate.toFixed(2)}</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">${item.discount_percent}%</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">${item.gst_percent}%</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">₹${item.cgstAmount.toFixed(2)}</td>
                  <td style="padding: 4px 2px; text-align: right; border: 1px solid #ddd;">₹${item.sgstAmount.toFixed(2)}</td>
                  <td style="padding: 4px 2px; text-align: right; font-weight: bold; border: 1px solid #ddd;">₹${item.finalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Totals -->
          <table style="width: 100%; margin-top: 12px; border-top: 2px solid #333; padding-top: 8px;">
            <tr>
              <td style="width: 50%;"></td>
              <td style="width: 50%;">
                <table style="width: 100%; font-size: 8px;">
                  <tr>
                    <td style="padding: 2px 0; color: #666;">Subtotal:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold;">₹${bill.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #666;">Discount:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold; color: #dc3545;">-₹${bill.total_discount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #666;">CGST:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold;">₹${bill.total_cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #666;">SGST:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold;">₹${bill.total_sgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 2px 0; color: #666; border-top: 1px solid #ddd; padding-top: 3px;">Total Tax:</td>
                    <td style="padding: 2px 0; text-align: right; font-weight: bold; border-top: 1px solid #ddd; padding-top: 3px;">₹${bill.total_tax.toFixed(2)}</td>
                  </tr>
                  <tr style="background: #333; color: white;">
                    <td style="padding: 6px 3px; font-weight: bold; font-size: 10px;">TOTAL:</td>
                    <td style="padding: 6px 3px; text-align: right; font-weight: bold; font-size: 10px;">₹${bill.total_amount.toFixed(2)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          <!-- Footer -->
          <table style="width: 100%; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 8px;">
            <tr>
              <td style="text-align: center; font-size: 8px; color: #666;">
                <div style="margin: 2px 0;">Thank you for your business!</div>
                <div style="margin: 2px 0;">This is a computer-generated bill.</div>
              </td>
            </tr>
          </table>
        </div>
      `;
      
      // Create element
      const element = document.createElement('div');
      element.innerHTML = billHTML;
      
      // PDF options optimized for A4
      const opt = {
        margin: 10,
        filename: `${bill.bill_number}_${bill.customer_data?.name || 'Customer'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: 2,
          logging: false,
          useCORS: true,
          width: 720  // Approximately A4 width
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      // Generate PDF directly without adding to DOM
      await html2pdf().set(opt).from(element).save();
      
      toast.success('Bill PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Spare Parts Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Bill Number</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Customer Name</th>
                  <th className="text-left p-3 font-semibold">Mobile</th>
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-left p-3 font-semibold">Items</th>
                  <th className="text-left p-3 font-semibold">Total Amount</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono">{bill.bill_number}</td>
                    <td className="p-3">{new Date(bill.bill_date).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-medium">
                      {bill.customer_data?.name || 'N/A'}
                    </td>
                    <td className="p-3">
                      {bill.customer_data?.mobile || 'N/A'}
                    </td>
                    <td className="p-3">
                      {bill.customer_data?.vehicle_name && bill.customer_data?.vehicle_number
                        ? `${bill.customer_data.vehicle_name} (${bill.customer_data.vehicle_number})`
                        : bill.customer_data?.vehicle_name || bill.customer_data?.vehicle_number || 'N/A'
                      }
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">
                        {bill.items.length} items
                      </Badge>
                    </td>
                    <td className="p-3 font-semibold text-green-600">₹{bill.total_amount.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewBill(bill)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePrintBill(bill)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownloadBill(bill)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteBill(bill)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Bill Modal */}
    {showViewModal && selectedBill && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Bill Details - {selectedBill.bill_number}</h2>
              <Button 
                variant="outline" 
                onClick={() => setShowViewModal(false)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-6">
              {/* Bill Header */}
              <div className="text-center border-b pb-4">
                <h3 className="text-xl font-bold">M M MOTORS</h3>
                <p className="text-gray-600">Bengaluru main road, behind Ruchi Bakery</p>
                <p className="text-gray-600">Malur, Karnataka 563130</p>
              </div>

              {/* Bill Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">Bill Information</h4>
                  <p><strong>Bill Number:</strong> {selectedBill.bill_number}</p>
                  <p><strong>Date:</strong> {new Date(selectedBill.bill_date).toLocaleDateString('en-IN')}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-600">Customer Details</h4>
                  <p><strong>Name:</strong> {selectedBill.customer_data?.name || 'N/A'}</p>
                  <p><strong>Mobile:</strong> {selectedBill.customer_data?.mobile || 'N/A'}</p>
                  {selectedBill.customer_data?.vehicle_name && (
                    <p><strong>Vehicle:</strong> {selectedBill.customer_data.vehicle_name} {selectedBill.customer_data.vehicle_number ? `(${selectedBill.customer_data.vehicle_number})` : ''}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-blue-600 mb-3">Bill Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border p-2 text-left">Sl. No.</th>
                        <th className="border p-2 text-left">Description</th>
                        <th className="border p-2 text-left">HSN/SAC</th>
                        <th className="border p-2 text-left">Qty</th>
                        <th className="border p-2 text-left">Unit</th>
                        <th className="border p-2 text-left">Rate</th>
                        <th className="border p-2 text-left">Disc%</th>
                        <th className="border p-2 text-left">GST%</th>
                        <th className="border p-2 text-left">CGST</th>
                        <th className="border p-2 text-left">SGST</th>
                        <th className="border p-2 text-left">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBill.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border p-2 text-center">{index + 1}</td>
                          <td className="border p-2">{item.description}</td>
                          <td className="border p-2">{item.hsn_sac}</td>
                          <td className="border p-2 text-right">{item.quantity}</td>
                          <td className="border p-2">{item.unit}</td>
                          <td className="border p-2 text-right">₹{item.rate.toFixed(2)}</td>
                          <td className="border p-2 text-right">{item.discount_percent}%</td>
                          <td className="border p-2 text-right">{item.gst_percent}%</td>
                          <td className="border p-2 text-right">₹{item.cgstAmount.toFixed(2)}</td>
                          <td className="border p-2 text-right">₹{item.sgstAmount.toFixed(2)}</td>
                          <td className="border p-2 text-right font-semibold">₹{item.finalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Subtotal:</span>
                    <div className="font-semibold">₹{selectedBill.subtotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Discount:</span>
                    <div className="font-semibold">₹{selectedBill.total_discount.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total CGST:</span>
                    <div className="font-semibold">₹{selectedBill.total_cgst.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total SGST:</span>
                    <div className="font-semibold">₹{selectedBill.total_sgst.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Tax:</span>
                    <span className="text-lg font-bold">₹{selectedBill.total_tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold text-green-600">
                    <span>Final Amount:</span>
                    <span>₹{selectedBill.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => handlePrintBill(selectedBill)}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDownloadBill(selectedBill)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};



export default Bills;
