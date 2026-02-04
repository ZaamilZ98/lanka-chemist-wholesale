"use client";

interface OrderItem {
  id: string;
  product_name: string;
  product_generic_name: string | null;
  product_sku: string | null;
  quantity: number;
}

interface PickingListData {
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_business: string | null;
  items: OrderItem[];
}

interface Props {
  order: PickingListData;
}

export default function PickingListPrintView({ order }: Props) {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          @page { margin: 15mm 10mm; }
        }
      `}</style>

      {/* Action bar (hidden in print) */}
      <div className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-dark"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      {/* Printable content */}
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PICKING LIST</h1>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-700">
            <div>
              <span className="font-semibold">Order:</span> {order.order_number}
            </div>
            <div>
              <span className="font-semibold">Date:</span> {orderDate}
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Customer:</span>{" "}
              {order.customer_name}
              {order.customer_business && (
                <span className="text-gray-500"> ({order.customer_business})</span>
              )}
            </div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="py-2 pr-3 text-left font-semibold text-gray-900 w-8">#</th>
              <th className="py-2 px-3 text-left font-semibold text-gray-900">Product</th>
              <th className="py-2 px-3 text-left font-semibold text-gray-900">Generic Name</th>
              <th className="py-2 px-3 text-left font-semibold text-gray-900">SKU</th>
              <th className="py-2 px-3 text-center font-semibold text-gray-900">Qty</th>
              <th className="py-2 pl-3 text-center font-semibold text-gray-900 w-16">Picked</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2.5 pr-3 text-gray-500">{idx + 1}</td>
                <td className="py-2.5 px-3 font-medium text-gray-900">{item.product_name}</td>
                <td className="py-2.5 px-3 text-gray-600">{item.product_generic_name || "—"}</td>
                <td className="py-2.5 px-3 font-mono text-xs text-gray-500">{item.product_sku || "—"}</td>
                <td className="py-2.5 px-3 text-center font-semibold text-gray-900">{item.quantity}</td>
                <td className="py-2.5 pl-3 text-center">
                  <div className="inline-block h-5 w-5 border-2 border-gray-400 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-400">
          <div className="flex items-start justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Total line items:</span> {order.items.length}
              <span className="mx-3 text-gray-300">|</span>
              <span className="font-semibold">Total units:</span> {totalItems}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-12">
            <div>
              <div className="border-b border-gray-400 pb-0.5 mb-1" />
              <p className="text-xs text-gray-500">Picked by (signature)</p>
            </div>
            <div>
              <div className="border-b border-gray-400 pb-0.5 mb-1" />
              <p className="text-xs text-gray-500">Date / Time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
