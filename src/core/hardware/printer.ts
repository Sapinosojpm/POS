import type { Order, OrderItem } from '../../types';
import { useSettingsStore } from '../../store/useSettingsStore';

export class ThermalPrinterService {
  public bluetoothDevice: any = null;

  /**
   * Request Bluetooth ESC/POS printer connection
   */
  async connectBluetooth(): Promise<boolean> {
    try {
      if (!('bluetooth' in navigator)) {
        alert('Web Bluetooth is not supported in this browser. Please use Chrome on Android or Desktop.');
        return false;
      }

      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb']
      });

      await device.gatt.connect();
      this.bluetoothDevice = device;
      console.log('Bluetooth Thermal Printer Connected:', device.name);
      return true;
    } catch (err) {
      console.warn('Bluetooth connection cancelled or failed:', err);
      return false;
    }
  }

  /**
   * Formats receipt text for 58mm / 80mm thermal paper
   */
  formatReceipt(order: Order, items: OrderItem[]): string {
    const settings = useSettingsStore.getState().settings;
    const is80mm = settings.paperWidth === '80mm';
    const lineWidth = is80mm ? 42 : 32;
    const divider = '-'.repeat(lineWidth);
    const doubleDivider = '='.repeat(lineWidth);
    const dateStr = new Date(order.createdAt).toLocaleString();
    const cur = settings.currency || '₱';

    const center = (str: string) => {
      const pad = Math.max(0, Math.floor((lineWidth - str.length) / 2));
      return ' '.repeat(pad) + str;
    };

    const isTaxEnabled = (settings as any).enableTax !== false;
    const receiptTitle = isTaxEnabled
      ? (settings.receiptHeader || 'OFFICIAL RECEIPT')
      : 'ACKNOWLEDGEMENT RECEIPT / NON-VAT';

    let text = `
${center(settings.storeName.toUpperCase())}
${center(settings.branchName)}
${center(settings.storeAddress)}
${center(`TIN: ${settings.tin}${!isTaxEnabled ? ' (NON-VAT)' : ''}`)}
${center(`Tel: ${settings.storePhone}`)}
${divider}
${center(receiptTitle)}
Date: ${dateStr}
Order No: ${order.orderNumber}
Cashier:  ${order.cashierName}
${divider}
QTY  ITEM                  TOTAL
`;

    items.forEach(item => {
      const nameLen = is80mm ? 26 : 18;
      const name = item.productName.substring(0, nameLen).padEnd(nameLen, ' ');
      const qty = `${item.quantity}x`.padEnd(4, ' ');
      const price = `${cur}${item.subtotal.toFixed(2)}`.padStart(8, ' ');
      text += `${qty} ${name} ${price}\n`;
    });

    const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);
    text += `${divider}
TOTAL ITEMS:                     ${totalQty}
GROSS SUBTOTAL:             ${cur}${order.subtotal.toFixed(2)}
`;

    if (order.vatExemptAmount && order.vatExemptAmount > 0) {
      text += `LESS 12% VAT EXEMPT:       -${cur}${order.vatExemptAmount.toFixed(2)}\n`;
    }

    if (order.discount && order.discount > 0) {
      const discTag = order.discountType === 'SENIOR'
        ? 'LESS 20% SC DISC:'
        : order.discountType === 'PWD'
        ? 'LESS 20% PWD DISC:'
        : 'LESS DISCOUNT:    ';
      text += `${discTag.padEnd(28, ' ')}-${cur}${order.discount.toFixed(2)}\n`;
    }

    if (isTaxEnabled) {
      text += `TAX/VAT (${settings.taxRate}%):             ${cur}${order.tax.toFixed(2)}\n`;
    }

    text += `${doubleDivider}
TOTAL AMOUNT DUE:           ${cur}${order.total.toFixed(2)}
${doubleDivider}
TENDERED (${order.paymentMethod}):          ${cur}${order.amountTendered.toFixed(2)}
CHANGE:                     ${cur}${order.changeDue.toFixed(2)}
${divider}
`;

    if (order.discountIdNumber || order.discountCustomerName) {
      text += `SC/PWD ID:  ${order.discountIdNumber || 'N/A'}\n`;
      if (order.discountCustomerName) {
        text += `Customer:   ${order.discountCustomerName}\n`;
      }
      text += `Signature:  ______________________\n${divider}\n`;
    }

    text += `${settings.receiptFooter.split('\n').map(line => center(line)).join('\n')}
\n\n\n`;

    return text;
  }

  /**
   * Prints the receipt (simulated window popup or ESC/POS output)
   */
  async printReceipt(order: Order, items: OrderItem[]): Promise<void> {
    const formatted = this.formatReceipt(order, items);
    console.log('--- THERMAL RECEIPT OUTPUT ---');
    console.log(formatted);

    // Standard print dialogue fallback for testing on any device
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${order.orderNumber}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 13px; white-space: pre; margin: 15px; }
            </style>
          </head>
          <body>${formatted}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }
}

export const printerService = new ThermalPrinterService();
