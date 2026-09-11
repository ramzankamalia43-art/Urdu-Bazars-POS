import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  Sparkles,
  Layers,
  GraduationCap,
  Plus,
  Check,
  AlertTriangle,
  QrCode,
  BookOpen,
  Filter,
  RefreshCw,
  Zap
} from 'lucide-react';
import type { Book, Customer, POSCartItem, ParkedCart, ShopSettings, Sale, PaymentMethod, PaymentDetails } from '../../../shared/types';
import { POSCart } from '../cart/POSCart';
import { POSCheckoutModal } from '../checkout/POSCheckoutModal';
import { POSCustomerModal } from '../customers/POSCustomerModal';
import { POSPrintableReceipt } from '../receipt/POSPrintableReceipt';

interface POSTerminalProps {
  books: Book[];
  customers: Customer[];
  settings?: ShopSettings;
  cashierName: string;
  onRefreshBooks: () => Promise<void>;
  onSaleCompleted: (sale: Sale) => void;
}

export const POSTerminal: React.FC<POSTerminalProps> = ({
  books,
  customers,
  settings,
  cashierName,
  onRefreshBooks,
  onSaleCompleted
}) => {
  const currency = settings?.currency || 'Rs.';

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cartItems, setCartItems] = useState<POSCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [billDiscountPercent, setBillDiscountPercent] = useState<number>(0);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(settings?.taxEnabled || false);
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([]);

  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Focus search input on mount and on F1
  useEffect(() => {
    searchInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F2' && cartItems.length > 0 && !showCheckoutModal) {
        e.preventDefault();
        setShowCheckoutModal(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleClearCart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, showCheckoutModal]);

  // Handle Barcode scanning buffer
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleBarcodeKeyPress = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 100) {
        barcodeBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 4) {
          matchAndAddBarcode(barcodeBuffer.trim());
          barcodeBuffer = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleBarcodeKeyPress);
    return () => window.removeEventListener('keydown', handleBarcodeKeyPress);
  }, [books, cartItems]);

  const matchAndAddBarcode = (code: string) => {
    const clean = code.toLowerCase().trim();
    const matched = books.find(
      (b) =>
        b.barcode === code ||
        b.isbn === code ||
        b.id === code ||
        (Array.isArray(b.keywords) && b.keywords.some((k) => k.toLowerCase() === clean)) ||
        b.title.toLowerCase() === clean ||
        b.title.toLowerCase().includes(clean)
    );

    if (matched) {
      handleAddToCart(matched);
    }
  };

  // Add book to cart with stock validation
  const handleAddToCart = (book: Book) => {
    if (book.availableStock <= 0) {
      alert(`Cannot add "${book.title}": Product is completely out of stock.`);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((it) => it.book.id === book.id);
      if (existing) {
        if (existing.quantity >= book.availableStock) {
          alert(`Cannot add more "${book.title}": Only ${book.availableStock} available in stock.`);
          return prev;
        }
        return prev.map((it) =>
          it.book.id === book.id
            ? {
                ...it,
                quantity: it.quantity + 1,
                subtotal: (it.unitPrice - (it.discount || 0)) * (it.quantity + 1)
              }
            : it
        );
      } else {
        return [
          ...prev,
          {
            book,
            quantity: 1,
            unitPrice: book.salePrice,
            discount: 0,
            subtotal: book.salePrice
          }
        ];
      }
    });
  };

  const handleUpdateQuantity = (bookId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.book.id === bookId) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > it.book.availableStock) {
              alert(`Cannot exceed available physical stock (${it.book.availableStock})`);
              return it;
            }
            return {
              ...it,
              quantity: newQty,
              subtotal: (it.unitPrice - (it.discount || 0)) * newQty
            };
          }
          return it;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  const handleSetItemDiscount = (bookId: string, discountPkr: number) => {
    setCartItems((prev) =>
      prev.map((it) =>
        it.book.id === bookId
          ? {
              ...it,
              discount: discountPkr,
              subtotal: (it.unitPrice - discountPkr) * it.quantity
            }
          : it
      )
    );
  };

  const handleRemoveItem = (bookId: string) => {
    setCartItems((prev) => prev.filter((it) => it.book.id !== bookId));
  };

  const handleClearCart = () => {
    if (cartItems.length > 0 && confirm('Clear all items from active sale ticket?')) {
      setCartItems([]);
      setBillDiscount(0);
      setBillDiscountPercent(0);
    }
  };

  const handleParkCart = () => {
    if (cartItems.length === 0) return;
    const newParked: ParkedCart = {
      id: `parked-${Date.now()}`,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in',
      customerId: selectedCustomer?.id,
      items: [...cartItems],
      itemDiscount: 0,
      billDiscount,
      timestamp: new Date().toISOString()
    };
    setParkedCarts((prev) => [...prev, newParked]);
    setCartItems([]);
    setSelectedCustomer(null);
    setBillDiscount(0);
    setBillDiscountPercent(0);
  };

  const handleResumeParkedCart = (cartId: string) => {
    const found = parkedCarts.find((pc) => pc.id === cartId);
    if (!found) return;

    if (cartItems.length > 0) {
      if (!confirm('Active cart has items. Resuming this ticket will replace current items. Continue?')) {
        return;
      }
    }

    setCartItems(found.items);
    setBillDiscount(found.billDiscount);
    if (found.customerId) {
      const cust = customers.find((c) => c.id === found.customerId);
      setSelectedCustomer(cust || null);
    }
    setParkedCarts((prev) => prev.filter((pc) => pc.id !== cartId));
  };

  const handleConfirmSale = async (paymentData: {
    paymentMethod: PaymentMethod;
    paidAmount: number;
    remainingAmount: number;
    paymentDetails?: PaymentDetails;
    notes?: string;
  }) => {
    const rawSubtotal = cartItems.reduce((sum, it) => sum + it.book.salePrice * it.quantity, 0);
    const itemDiscountTotal = cartItems.reduce((sum, it) => sum + (it.discount || 0) * it.quantity, 0);

    let effectiveBillDiscount = billDiscount;
    if (billDiscountPercent > 0) {
      effectiveBillDiscount = Math.round(((rawSubtotal - itemDiscountTotal) * billDiscountPercent) / 100);
    }

    const subtotalAfterDiscounts = Math.max(0, rawSubtotal - itemDiscountTotal - effectiveBillDiscount);
    const taxRate = settings?.taxRate || 0;
    const calculatedTax = taxEnabled ? Math.round((subtotalAfterDiscounts * taxRate) / 100) : 0;
    const grandTotal = subtotalAfterDiscounts + calculatedTax;

    const payload = {
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone || '',
      items: cartItems.map((it) => ({
        bookId: it.book.id,
        title: it.book.title,
        urduTitle: it.book.urduTitle,
        isbn: it.book.isbn,
        barcode: it.book.barcode,
        purchasePrice: it.book.purchasePrice,
        salePrice: it.book.salePrice,
        quantity: it.quantity,
        discount: it.discount || 0,
        subtotal: (it.book.salePrice - (it.discount || 0)) * it.quantity
      })),
      subtotal: rawSubtotal,
      itemDiscount: itemDiscountTotal,
      billDiscount: effectiveBillDiscount,
      tax: calculatedTax,
      taxRate: taxEnabled ? taxRate : 0,
      grandTotal,
      paidAmount: paymentData.paidAmount,
      remainingAmount: paymentData.remainingAmount,
      paymentMethod: paymentData.paymentMethod,
      paymentDetails: paymentData.paymentDetails,
      notes: paymentData.notes,
      cashierName
    };

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete sale transaction');
    }

    const createdSale: Sale = await res.json();

    // Reset cart and update parent
    setCartItems([]);
    setSelectedCustomer(null);
    setBillDiscount(0);
    setBillDiscountPercent(0);
    setShowCheckoutModal(false);

    // Refresh stock from backend
    await onRefreshBooks();
    onSaleCompleted(createdSale);

    // Display receipt
    setCompletedSale(createdSale);
  };

  const QUICK_KEYWORD_CHIPS = [
    { label: '⚡ All', query: '' },
    { label: '⚡ M-9', query: 'm-9', hint: 'Math 9th' },
    { label: '⚡ M-10', query: 'm-10', hint: 'Math 10th' },
    { label: '⚡ P-10', query: 'p-10', hint: 'Physics 10th' },
    { label: '⚡ P-12', query: 'p-12', hint: 'Physics 12th' },
    { label: '⚡ C-12', query: 'c-12', hint: 'Chemistry 12th' },
    { label: '⚡ B-9', query: 'b-9', hint: 'Biology 9th' },
    { label: '⚡ PTB Board', query: 'ptb', hint: 'Punjab Board' },
    { label: '⚡ SNC Series', query: 'snc', hint: 'Single Curriculum' },
    { label: '⚡ F.Sc / Inter', query: 'fsc', hint: 'Intermediate' },
    { label: '⚡ Matric', query: 'matric', hint: 'Matriculation' },
    { label: '⚡ Urdu Novel', query: 'novel', hint: 'Novels & Lit' },
    { label: '⚡ Stationery', query: 'stationery', hint: 'Notebooks/Pens' }
  ];

  // Filter books with smart multi-token and keyword search
  const filteredBooks = books.filter((b) => {
    if (!b.isActive) return false;
    if (selectedClass !== 'All' && b.class !== selectedClass) return false;
    if (selectedCategory !== 'All' && b.category !== selectedCategory) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);

      const titleLower = b.title.toLowerCase();
      const urduLower = (b.urduTitle || '').toLowerCase();
      const barcodeLower = (b.barcode || '').toLowerCase();
      const isbnLower = (b.isbn || '').toLowerCase();
      const authorLower = (b.author || '').toLowerCase();
      const pubLower = (b.publisher || '').toLowerCase();
      const subjLower = (b.subject || '').toLowerCase();
      const shelfLower = (b.rackShelf || '').toLowerCase();
      const classLower = (b.class || '').toLowerCase();
      const catLower = (b.category || '').toLowerCase();
      const kwList = Array.isArray(b.keywords) ? b.keywords : [];
      const kwString = kwList.join(' ').toLowerCase();

      // Check full string match in any field or keyword
      if (
        titleLower.includes(q) ||
        urduLower.includes(q) ||
        barcodeLower.includes(q) ||
        isbnLower.includes(q) ||
        authorLower.includes(q) ||
        pubLower.includes(q) ||
        subjLower.includes(q) ||
        shelfLower.includes(q) ||
        kwList.some((k) => k.toLowerCase() === q || k.toLowerCase().includes(q))
      ) {
        return true;
      }

      // Check all tokens in corpus
      const corpus = `${titleLower} ${urduLower} ${authorLower} ${subjLower} ${pubLower} ${isbnLower} ${barcodeLower} ${shelfLower} ${classLower} ${catLower} ${kwString}`;
      return tokens.every((tok) => corpus.includes(tok));
    }
    return true;
  });

  const categories = [
    'All',
    'Textbook',
    'Notes',
    'Guide',
    'Model Papers',
    'Solved Papers',
    'Stationery',
    'Urdu Literature',
    'Islamic',
    'Novel'
  ];

  const classes = [
    'All',
    'Playgroup',
    'Nursery',
    'Prep',
    '1st',
    '2nd',
    '3rd',
    '4th',
    '5th',
    '6th',
    '7th',
    '8th',
    '9th',
    '10th',
    '11th',
    '12th',
    'O/A-Level',
    'General'
  ];

  // Calculations for Checkout
  const rawSubtotal = cartItems.reduce((acc, item) => acc + item.book.salePrice * item.quantity, 0);
  const itemDiscountsTotal = cartItems.reduce((acc, item) => acc + (item.discount || 0) * item.quantity, 0);
  const subtotalAfterItemDiscounts = Math.max(0, rawSubtotal - itemDiscountsTotal);
  let calculatedBillDiscount = billDiscount;
  if (billDiscountPercent > 0) {
    calculatedBillDiscount = Math.round((subtotalAfterItemDiscounts * billDiscountPercent) / 100);
  }
  const subtotalAfterAllDiscounts = Math.max(0, subtotalAfterItemDiscounts - calculatedBillDiscount);
  const taxRate = settings?.taxRate || 0;
  const calculatedTax = taxEnabled ? Math.round((subtotalAfterAllDiscounts * taxRate) / 100) : 0;
  const grandTotal = subtotalAfterAllDiscounts + calculatedTax;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F8FAFC]">
      {/* LEFT / MAIN CATALOG AREA */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
        {/* Search & Fast Filters Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Search Input with Shortcut F1 */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Title, Urdu name, Barcode, ISBN, Subject, Publisher... (F1)"
                className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm font-medium border border-slate-300 rounded-xl bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#082B4C] focus:border-transparent transition-all"
              />
              <div className="absolute right-3 top-2.5 flex items-center gap-1">
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                  F1
                </span>
                <Barcode className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => onRefreshBooks()}
              title="Refresh inventory from database"
              className="p-2.5 text-slate-600 hover:text-[#082B4C] hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Cat:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#082B4C] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Class Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              Class:
            </span>
            {classes.map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-[#F47700] text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Sales Manager Quick Keyword & Fast Codes Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs select-none border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 shrink-0 mr-1 flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
              <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
              Quick:
            </span>
            {QUICK_KEYWORD_CHIPS.map((chip) => {
              const isActive = chip.query === '' ? searchTerm === '' : searchTerm.toLowerCase() === chip.query.toLowerCase();
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setSearchTerm(chip.query)}
                  title={chip.hint || chip.label}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-2xs font-bold'
                      : 'bg-amber-50/60 text-amber-900 border border-amber-200/50 hover:bg-amber-100/80'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Books Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredBooks.map((book) => {
              const isOutOfStock = book.availableStock <= 0;
              const isLowStock = book.availableStock > 0 && book.availableStock <= (book.minStockAlert || 5);
              const inCartItem = cartItems.find((it) => it.book.id === book.id);

              return (
                <div
                  key={book.id}
                  onClick={() => !isOutOfStock && handleAddToCart(book)}
                  className={`bg-white rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer select-none group relative ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                      : inCartItem
                      ? 'border-[#082B4C] ring-2 ring-[#082B4C]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Card Header & Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                        {book.class} • {book.category}
                      </span>

                      {/* Stock indicator badge */}
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Low: {book.availableStock}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Stock: {book.availableStock}
                        </span>
                      )}
                    </div>

                    {/* Book Title */}
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#082B4C] leading-snug line-clamp-2">
                      {book.title}
                    </h3>

                    {/* Urdu Title */}
                    {book.urduTitle && (
                      <p className="font-urdu text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {book.urduTitle}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {book.publisher || book.author}
                    </p>

                    {/* Fast Search Keyword Badges */}
                    {Array.isArray(book.keywords) && book.keywords.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {book.keywords.slice(0, 3).map((kw, i) => (
                          <span
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchTerm(kw);
                            }}
                            className="text-[9px] font-mono bg-slate-100/90 hover:bg-amber-100 hover:text-amber-900 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/80 transition-colors cursor-pointer"
                            title={`Quick tag: "${kw}" - click to search`}
                          >
                            #{kw}
                          </span>
                        ))}
                        {book.keywords.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-medium" title={`${book.keywords.length} total keywords indexed for fast search`}>
                            +{book.keywords.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price & Add Action */}
                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                      <span className="text-sm sm:text-base font-extrabold text-[#082B4C]">
                        {currency} {book.salePrice.toLocaleString()}
                      </span>
                    </div>

                    {inCartItem ? (
                      <div className="bg-[#082B4C] text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>In Cart ({inCartItem.quantity})</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-[#F47700] group-hover:text-white'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBooks.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No books found</p>
              <p className="text-xs text-slate-400">
                Try searching with a different keyword or resetting the class/category filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: INTEGRATED CART & CHECKOUT CONTROLS */}
      <div className="w-full md:w-80 lg:w-96 shrink-0 h-auto md:h-full">
        <POSCart
          items={cartItems}
          customer={selectedCustomer}
          settings={settings}
          billDiscount={billDiscount}
          billDiscountPercent={billDiscountPercent}
          taxRate={settings?.taxRate || 0}
          taxEnabled={taxEnabled}
          parkedCarts={parkedCarts}
          onUpdateQuantity={handleUpdateQuantity}
          onSetItemDiscount={handleSetItemDiscount}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onOpenCustomerModal={() => setShowCustomerModal(true)}
          onSetBillDiscount={(amt, isPct) => {
            if (isPct) {
              setBillDiscountPercent(amt);
              setBillDiscount(0);
            } else {
              setBillDiscount(amt);
              setBillDiscountPercent(0);
            }
          }}
          onToggleTax={() => setTaxEnabled(!taxEnabled)}
          onParkCart={handleParkCart}
          onResumeParkedCart={handleResumeParkedCart}
          onOpenCheckout={() => setShowCheckoutModal(true)}
        />
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <POSCustomerModal
          customers={customers}
          selectedCustomer={selectedCustomer}
          currency={currency}
          onSelectCustomer={(cust) => setSelectedCustomer(cust)}
          onCustomerAdded={(newCust) => {
            // customers list handled in parent
          }}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <POSCheckoutModal
          subtotal={rawSubtotal}
          discount={itemDiscountsTotal + calculatedBillDiscount}
          tax={calculatedTax}
          grandTotal={grandTotal}
          itemCount={cartItems.reduce((acc, it) => acc + it.quantity, 0)}
          customer={selectedCustomer}
          settings={settings}
          cashierName={cashierName}
          onConfirmSale={handleConfirmSale}
          onClose={() => setShowCheckoutModal(false)}
        />
      )}

      {/* Printable Receipt Modal */}
      {completedSale && (
        <POSPrintableReceipt
          sale={completedSale}
          settings={settings}
          onClose={() => setCompletedSale(null)}
          onNewSale={() => {
            setCompletedSale(null);
            searchInputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};
