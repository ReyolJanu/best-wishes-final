"use client"

import ProductForm from "../../../(admin)/prodectmanage/components/ProductForm"

export default function InventoryAddProduct() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-gray-600">Create a new product for the inventory</p>
      </div>
      <ProductForm />
    </div>
  )
}