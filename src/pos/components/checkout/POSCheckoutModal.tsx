import React, { useState } from 'react';
import {
  Banknote,
  CreditCard,
  QrCode,
  BookOpen,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Customer, PaymentMethod, PaymentDetails, Sale, ShopSettings } from '../../../shared/types';
import { paymentService } from '../../../shared/services/paymentService';
import { QRPaymentModal } from './QRPaymentModal';

interface POSCheckoutModalProps {
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  itemCount: number;
  customer?: Customer | null;
  settings?: ShopSettings;
  cashierName: string;
  onConfirmSale: (paymentData: {
    paymentMethod: PaymentMethod;
    paidAmount: number;
    remainingAmount: number;
    paymentDetails?: PaymentDetails;
    notes?: string;
  }) => Promise<Sale | void>;
  onClose: () => void;
}

export const POSCheckoutModal: React.FC<POSCheckoutModalProps> = ({
  subtotal,
  discount,
  tax,
  grandTotal,
  itemCount,
  customer,
  settings,
  cashierName,
  onConfirmSale,
  onClose
}) => {
  const currency = settings?.currency || 'Rs.';

  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [cashReceived, setCashReceived] = useState<string>(grandTotal.toString());
  const [cardTerminal, setCardTerminal] = useState<string>('Terminal 01 - Meezan POS');
  const [cardType, setCardType] = useState<string>('PayPak');
  const [cardRef, setCardRef] = useState<string>('');
  const [cardAuthCode, setCardAuthCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // QR Payment specific state
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);
  const [qrScannedData, setQrScannedData] = useState<{
    rawPayload: string;
    referenceId: string;
    provider: 'Raast' | 'JazzCash' | 'Easypaisa' | 'Bank' | 'Generic';
    verificationStatus: 'Verified' | 'Pending_Verification';
    notes?: string;
  } | null>(null);

  const numCashReceived = parseFloat(cashReceived) || 0;
  const changeDue = Math.max(0, numCashReceived - grandTotal);
  const cashShortage = Math.max(0, grandTotal - numCashReceived);

  // Quick cash addition chips
  const addCashAmount = (additional: number) => {
    setCashReceived((prev) => {
      const current = parseFloat(prev) || 0;
      return (current + additional).toString();
    });
  };

  const setExactCash = () => {
    setCashReceived(grandTotal.toString());
  };

  const handleQRCompleted = (scanned: {
    rawPayload: string;
    referenceId: string;
    provider: 'Raast' | 'JazzCash' | 'Easypaisa' | 'Bank' | 'Generic';
    verificationStatus: 'Verified' | 'Pending_Verification';
    notes?: string;
  }) => {
    setQrScannedData(scanned);
    setShowQRScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      let paidAmount = grandTotal;
      let remainingAmount = 0;
      let paymentDetails: PaymentDetails | undefined = undefined;

      if (method === 'Cash') {
        if (numCashReceived < grandTotal) {
          setError(`Cash received (Rs. ${numCashReceived}) is less than total bill (Rs. ${grandTotal}).`);
          setIsProcessing(false);
          return;
        }
        paidAmount = grandTotal;
        remainingAmount = 0;
        paymentDetails = {
          method: 'Cash',
          amount: grandTotal,
          receivedAmount: numCashReceived,
          changeAmount: changeDue,
          verificationStatus: 'Verified',
          verifiedAt: new Date().toISOString()
        };
      } else if (method === 'Card') {
        const ref = cardRef.trim() || `POS-${Math.floor(100000 + Math.random() * 900000)}`;
        paidAmount = grandTotal;
        remainingAmount = 0;
        paymentDetails = {
          method: 'Card',
          amount: grandTotal,
          terminalId: cardTerminal,
          cardType,
          referenceId: ref,
          authCode: cardAuthCode.trim() || Math.floor(100000 + Math.random() * 900000).toString(),
          verificationStatus: 'Verified',
          verifiedAt: new Date().toISOString()
        };
      } else if (method === 'QR') {
        if (!qrScannedData) {
          setError('Please scan or simulate customer QR payment code first.');
          setIsProcessing(false);
          return;
        }
        paidAmount = grandTotal;
        remainingAmount = 0;
        paymentDetails = {
          method: 'QR',
          amount: grandTotal,
          qrPayload: qrScannedData.rawPayload,
          qrProvider: qrScannedData.provider,
          referenceId: qrScannedData.referenceId,
          verificationStatus: qrScannedData.verificationStatus,
          verifiedAt: new Date().toISOString(),
          notes: qrScannedData.notes
        };
      } else if (method === 'Udhaar') {
        if (!customer) {
          setError('Khata / Credit payment requires selecting a registered customer.');
          setIsProcessing(false);
          return;
        }
        paidAmount = 0;
        remainingAmount = grandTotal;
        paymentDetails = {
          method: 'Udhaar',
          amount: grandTotal,
          verificationStatus: 'Verified',
          notes: `Charged to Khata ledger of ${customer.name}`
        };
      }

      await onConfirmSale({
        paymentMethod: method,
        paidAmount,
        remainingAmount,
        paymentDetails,
        notes: notes.trim() || undefined
      });

      // Fire celebratory confetti on completed POS sale
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {
        // ignore if canvas blocked
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to complete transaction.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col my-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#082B4C] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">POS Checkout & Payment</h2>
              <p className="text-xs text-amber-200/90 font-medium">
                Cashier: {cashierName} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Breakdown Summary Bar */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-slate-500 block">Subtotal:</span>
            <span className="font-semibold text-slate-800">{currency} {subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div>
              <span className="text-slate-500 block">Discount:</span>
              <span className="font-semibold text-amber-600">-{currency} {discount.toLocaleString()}</span>
            </div>
          )}
          {tax > 0 && (
            <div>
              <span className="text-slate-500 block">Sales Tax:</span>
              <span className="font-semibold text-slate-700">+{currency} {tax.toLocaleString()}</span>
            </div>
          )}
          <div className="text-right">
            <span className="text-slate-500 block font-medium">Payable Amount:</span>
            <span className="text-base font-black text-[#082B4C]">
              {currency} {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {/* Cash */}
              <button
                type="button"
                onClick={() => setMethod('Cash')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                  method === 'Cash'
                    ? 'border-[#082B4C] bg-[#082B4C] text-white shadow-md ring-2 ring-[#082B4C]/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-400" />
                <span>Cash (F6)</span>
              </button>

              {/* Card */}
              <button
                type="button"
                onClick={() => setMethod('Card')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                  method === 'Card'
                    ? 'border-[#082B4C] bg-[#082B4C] text-white shadow-md ring-2 ring-[#082B4C]/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-5 h-5 text-sky-400" />
                <span>Card (F7)</span>
              </button>

              {/* QR Scanner */}
              <button
                type="button"
                onClick={() => {
                  setMethod('QR');
                  if (!qrScannedData) setShowQRScanner(true);
                }}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                  method === 'QR'
                    ? 'border-[#082B4C] bg-[#082B4C] text-white shadow-md ring-2 ring-[#082B4C]/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-5 h-5 text-amber-400" />
                <span>QR Code (F8)</span>
              </button>

              {/* Khata / Udhaar */}
              <button
                type="button"
                onClick={() => setMethod('Udhaar')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
                  method === 'Udhaar'
                    ? 'border-[#082B4C] bg-[#082B4C] text-white shadow-md ring-2 ring-[#082B4C]/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-5 h-5 text-purple-400" />
                <span>Khata / Credit</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: CASH PAYMENT DETAILS */}
          {method === 'Cash' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Cash Received from Customer</label>
                <button
                  type="button"
                  onClick={setExactCash}
                  className="text-xs text-[#F47700] hover:underline font-semibold cursor-pointer"
                >
                  Exact Amount ({currency} {grandTotal})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">{currency}</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-lg font-bold text-slate-800 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#082B4C]"
                  autoFocus
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-[11px] text-slate-500 self-center">Add quick cash:</span>
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => addCashAmount(amt)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    +{currency} {amt}
                  </button>
                ))}
              </div>

              {/* Change / Shortage Banner */}
              <div className="pt-2 border-t border-slate-200">
                {numCashReceived >= grandTotal ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                    <span className="text-xs font-medium">Change to Return to Customer:</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      {currency} {changeDue.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900">
                    <span className="text-xs font-medium">Insufficient Cash:</span>
                    <span className="text-sm font-bold text-rose-700">
                      Short by {currency} {cashShortage.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: CARD PAYMENT DETAILS */}
          {method === 'Card' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">POS Terminal</label>
                  <select
                    value={cardTerminal}
                    onChange={(e) => setCardTerminal(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium bg-white"
                  >
                    <option value="Terminal 01 - Meezan POS">Terminal 01 - Meezan POS</option>
                    <option value="Terminal 02 - HBL Swipe">Terminal 02 - HBL Swipe</option>
                    <option value="Terminal 03 - Alfalah Smart">Terminal 03 - Alfalah Smart</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Card Network</label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium bg-white"
                  >
                    <option value="PayPak">PayPak (1Link Domestic)</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="UnionPay">UnionPay</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Terminal Auth Code (Slip)</label>
                  <input
                    type="text"
                    placeholder="e.g. 842109"
                    value={cardAuthCode}
                    onChange={(e) => setCardAuthCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">POS Reference / Batch #</label>
                  <input
                    type="text"
                    placeholder="e.g. 0048291"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: QR PAYMENT DETAILS */}
          {method === 'QR' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              {qrScannedData ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-emerald-900 flex items-center gap-2">
                        <span>{qrScannedData.provider} Digital QR Verified</span>
                        <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                          {qrScannedData.verificationStatus}
                        </span>
                      </div>
                      <p className="text-emerald-700 mt-0.5">Reference: <span className="font-mono font-bold">{qrScannedData.referenceId}</span></p>
                      <p className="text-slate-500 text-[11px] mt-1">{qrScannedData.notes || 'QR scanned and validated successfully.'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="text-xs font-semibold text-[#082B4C] hover:underline cursor-pointer"
                  >
                    Rescan
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-slate-600">
                    No QR code scanned yet. Open the camera scanner to read customer's Raast, JazzCash, or EasyPaisa QR code.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="bg-[#F47700] hover:bg-[#D46600] text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Open Camera QR Scanner</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: KHATA / CREDIT DETAILS */}
          {method === 'Udhaar' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              {customer ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-purple-950">
                    <UserCheck className="w-4 h-4 text-purple-700" />
                    <span>Customer: {customer.name} ({customer.phone})</span>
                  </div>
                  <div className="flex justify-between text-purple-900 pt-1">
                    <span>Current Khata Balance:</span>
                    <span className="font-bold">{currency} {customer.remainingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-950 font-bold pt-1 border-t border-purple-200">
                    <span>New Balance After Sale:</span>
                    <span>{currency} {(customer.remainingBalance + grandTotal).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>No customer selected. Please select or add a customer to enable Khata billing.</span>
                </div>
              )}
            </div>
          )}

          {/* Customer Association reminder */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span>Customer: <strong>{customer ? customer.name : 'Walk-in Customer'}</strong></span>
            {customer && <span className="text-slate-500 font-mono text-[11px]">{customer.phone}</span>}
          </div>

          {/* Sale Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Special order discount, verified by manager..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isProcessing || (method === 'Cash' && numCashReceived < grandTotal) || (method === 'Udhaar' && !customer)}
              className="px-6 py-2.5 bg-[#082B4C] hover:bg-[#051C33] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Processing Sale...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Complete Sale & Print Receipt ({currency} {grandTotal.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sub-modal: Live QR Scanner */}
      {showQRScanner && (
        <QRPaymentModal
          amount={grandTotal}
          currency={currency}
          onScanComplete={handleQRCompleted}
          onCancel={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};
