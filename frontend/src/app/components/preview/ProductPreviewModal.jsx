"use client"

import { useState } from "react"
import {
  X,
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Calendar,
  Gift,
  Users,
  Palette,
  Tag,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react"
import { format, addDays } from "date-fns"

import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Card, CardContent } from "../../../components/ui/card"
import { Separator } from "../../../components/ui/separator"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Calendar as CalendarComponent } from "../../../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { cn } from "../../../lib/utils"

export default function ProductPreviewModal({ product, categories, occasions, recipients, themes, onClose }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [personalizationText, setPersonalizationText] = useState("")
  const [selectedDate, setSelectedDate] = useState(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const discountPercentage = Math.round(((product.retailPrice - product.salePrice) / product.retailPrice) * 100)
  const estimatedDelivery = addDays(new Date(), 5)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold">Product Preview</h2>
            <p className="text-sm text-muted-foreground">How customers will see this product</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Product Preview Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square rounded-lg overflow-hidden border bg-gray-50">
                <img
                  src={product.images[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "w-20 h-20 rounded-md overflow-hidden border-2 transition-colors",
                      selectedImage === index ? "border-primary" : "border-gray-200",
                    )}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Product Features */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On orders over £50</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Quality Guarantee</p>
                  <p className="text-xs text-muted-foreground">Premium materials</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs font-medium">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">30-day policy</p>
                </div>
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="space-y-6">
              {/* Product Title & Rating */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {product.featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline">In Stock</Badge>
                </div>
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                {product.subtitle && <p className="text-lg text-muted-foreground mb-3">{product.subtitle}</p>}

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">(127 reviews)</span>
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">£{product.salePrice}</span>
                  <span className="text-xl text-muted-foreground line-through">£{product.retailPrice}</span>
                  <Badge variant="destructive">{discountPercentage}% OFF</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Save ${(product.retailPrice - product.salePrice).toFixed(2)} • Sale ends in 3 days
                </p>
              </div>

              {/* Categories & Tags */}
              <div className="space-y-3">
                {categories.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {categories.map((category) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}

                {occasions.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Perfect for:</span>
                    {occasions.map((occasion) => (
                      <Badge key={occasion} variant="secondary" className="text-xs">
                        {occasion}
                      </Badge>
                    ))}
                  </div>
                )}

                {recipients.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Great for:</span>
                    {recipients.map((recipient) => (
                      <Badge key={recipient} variant="secondary" className="text-xs">
                        {recipient}
                      </Badge>
                    ))}
                  </div>
                )}

                {themes.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Style:</span>
                    {themes.map((theme) => (
                      <Badge key={theme} variant="outline" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Personalization Section */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Personalize Your Gift</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="personalization">Custom Text</Label>
                      <Textarea
                        id="personalization"
                        placeholder="Enter your personalization text here..."
                        value={personalizationText}
                        onChange={(e) => setPersonalizationText(e.target.value)}
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{personalizationText.length}/100 characters</p>
                    </div>

                    <div>
                      <Label>Special Date (Optional)</Label>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground",
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Select a special date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date)
                              setIsCalendarOpen(false)
                            }}
                            initialFocus
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quantity & Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3"
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                        className="border-0 text-center w-16"
                        min="1"
                      />
                      <Button variant="ghost" size="sm" onClick={() => setQuantity(quantity + 1)} className="px-3">
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {product.stockQuantity > 10 ? (
                        <span className="text-green-600">✓ In Stock ({product.stockQuantity} available)</span>
                      ) : (
                        <span className="text-orange-600">⚠ Only {product.stockQuantity} left!</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Estimated delivery: {format(estimatedDelivery, "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1" size="lg">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart - ${(product.salePrice * quantity).toFixed(2)}
                  </Button>
                  <Button variant="outline" size="lg">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="lg">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <div className="prose max-w-none">
                  <p className="text-lg mb-4">{product.shortDescription}</p>
                  <div className="text-muted-foreground whitespace-pre-line">{product.fullDescription}</div>
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Product Details</h4>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">SKU:</dt>
                        <dd className="font-medium">{product.sku}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Weight:</dt>
                        <dd className="font-medium">{product.weight} kg</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Dimensions:</dt>
                        <dd className="font-medium">
                          {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Material:</dt>
                        <dd className="font-medium">Premium Ceramic</dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Care Instructions</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Dishwasher safe</li>
                      <li>• Microwave safe</li>
                      <li>• Hand wash recommended for longevity</li>
                      <li>• Avoid abrasive cleaners</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Shipping Options</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Standard Shipping</p>
                          <p className="text-sm text-muted-foreground">5-7 business days</p>
                        </div>
                        <span className="font-medium">Free</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Express Shipping</p>
                          <p className="text-sm text-muted-foreground">2-3 business days</p>
                        </div>
                        <span className="font-medium">$9.99</span>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Next Day Delivery</p>
                          <p className="text-sm text-muted-foreground">Order by 2 PM</p>
                        </div>
                        <span className="font-medium">$19.99</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Return Policy</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• 30-day return window</p>
                      <p>• Free returns on orders over $50</p>
                      <p>• Items must be in original condition</p>
                      <p>• Personalized items cannot be returned unless defective</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">4.8</div>
                      <div className="flex justify-center mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground">127 reviews</div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-3">{rating}</span>
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{
                                width: `${rating === 5 ? 70 : rating === 4 ? 20 : rating === 3 ? 5 : rating === 2 ? 3 : 2}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">
                            {rating === 5 ? 89 : rating === 4 ? 25 : rating === 3 ? 7 : rating === 2 ? 4 : 2}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        name: "Sarah M.",
                        rating: 5,
                        date: "2 days ago",
                        comment:
                          "Absolutely love this mug! The personalization came out perfect and the quality is excellent. Fast shipping too!",
                      },
                      {
                        name: "Mike R.",
                        rating: 5,
                        date: "1 week ago",
                        comment:
                          "Bought this for my wife's birthday and she was thrilled. The design is beautiful and it's very well made.",
                      },
                      {
                        name: "Emma L.",
                        rating: 4,
                        date: "2 weeks ago",
                        comment:
                          "Great mug, good quality. Only minor issue was the packaging could be better, but the product itself is fantastic.",
                      },
                    ].map((review, index) => (
                      <div key={index} className="border-b pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{review.name}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "w-3 h-3",
                                  star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">{review.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
