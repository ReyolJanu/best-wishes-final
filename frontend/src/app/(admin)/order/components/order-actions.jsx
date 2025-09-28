"use client"

import { Button } from "@/components/ui/button"
import { Check, X, Package, Printer, Copy } from "lucide-react"

export function OrderActions({
  order,
  onAcceptOrder,
  onRejectOrder,
  onPackingComplete,
  onPrintShippingLabel,
  children,
}) {
  return (
    <div className="flex gap-1 justify-end">
      {/* Accept/Reject buttons for pending orders */}
      {order.status === "pending_acceptance" && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => onAcceptOrder(order.orderId)}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onRejectOrder(order.orderId)}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Packing complete button for accepted orders */}
      {order.status === "accepted" && order.packingStatus !== "packed" && (
        <Button
          variant="ghost"
          size="sm"
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          onClick={() => onPackingComplete(order.orderId)}
        >
          <Package className="h-4 w-4" />
        </Button>
      )}

      {/* Print shipping label */}
      <Button variant="ghost" size="sm" className="hover:bg-blue-50" onClick={() => onPrintShippingLabel([order])}>
        <Printer className="h-4 w-4" />
      </Button>

      {/* Copy order details */}
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-gray-50"
        onClick={() => navigator.clipboard.writeText(`${order.referenceCode} - ${order.customerName}`)}
      >
        <Copy className="h-4 w-4" />
      </Button>

      {/* View details dialog trigger */}
      {children}
    </div>
  )
}
