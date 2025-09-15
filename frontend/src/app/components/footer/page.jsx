import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-50 pt-[100px]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Best Wishes</h3>
            <p className="text-gray-600 text-sm">
              Your one-stop shop for all celebration needs. We provide high-quality products to make your special
              moments memorable.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/balloons" className="text-gray-600 hover:text-gray-900 text-sm">
                  Balloons
                </Link>
              </li>
              <li>
                <Link href="/cards" className="text-gray-600 hover:text-gray-900 text-sm">
                  Cards
                </Link>
              </li>
              <li>
                <Link href="/home-living" className="text-gray-600 hover:text-gray-900 text-sm">
                  Home & Living
                </Link>
              </li>
              <li>
                <Link href="/kitchen-dining" className="text-gray-600 hover:text-gray-900 text-sm">
                  Kitchen & Dining
                </Link>
              </li>
              <li>
                <Link href="/toys-novelties" className="text-gray-600 hover:text-gray-900 text-sm">
                  Toys & Novelties
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-600 hover:text-gray-900 text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-gray-900 text-sm">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-gray-900 text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-600 hover:text-gray-900 text-sm">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-600 hover:text-gray-900 text-sm">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-gray-900 text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">© 2025 Best Wishes. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/cookies" className="text-sm text-gray-600 hover:text-gray-900">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
