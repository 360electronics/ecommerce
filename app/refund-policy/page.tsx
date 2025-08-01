export default function RefundPolicy() {
    const lastUpdated = "August 1, 2025";
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Refund Policy</h1>
              <p className="text-sm text-gray-600">Last updated: {lastUpdated}</p>
            </div>
  
            {/* Content */}
            <div className="px-6 py-8 space-y-8">
              
              {/* Introduction */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  At 360 Electronics, we strive to ensure customer satisfaction 
                  with every purchase. This Refund Policy outlines the terms and conditions for returns, exchanges, and refunds 
                  for products purchased from our e-commerce platform. By making a purchase, you agree to the terms set forth 
                  in this policy.
                </p>
              </section>
  
              {/* Return Eligibility */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Return Eligibility</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">General Requirements</h3>
                    <div className="space-y-2 text-gray-700 leading-relaxed">
                      <p>To be eligible for a return, items must meet the following conditions:</p>
                      <p>• Item must be in original, unused, and resalable condition</p>
                      <p>• All original packaging, accessories, manuals, and tags must be included</p>
                      <p>• Item must be returned within the specified return period</p>
                      <p>• Valid purchase receipt or order confirmation required</p>
                      <p>• Item must not show signs of wear, damage, or alteration</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Return Timeframes</h3>
                    <div className="space-y-2 text-gray-700 leading-relaxed">
                      <p><strong>Electronics & Gadgets:</strong> 15 days from delivery date</p>
                      <p><strong>Mobile Phones & Accessories:</strong> 10 days from delivery date</p>
                      <p><strong>Computing Devices:</strong> 15 days from delivery date</p>
                      <p><strong>Home Appliances:</strong> 10 days from delivery date</p>
                      <p><strong>Audio & Video Equipment:</strong> 15 days from delivery date</p>
                      <p>Return period starts from the date of delivery confirmation, not the order date.</p>
                    </div>
                  </div>
                </div>
              </section>
  
              {/* Non-Returnable Items */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Non-Returnable Items</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>The following items cannot be returned for hygienic, safety, or technical reasons:</p>
                  <p><strong>Personal Care Items:</strong> Earphones, headphones, personal grooming devices that have been used</p>
                  <p><strong>Software & Digital Products:</strong> Downloaded software, digital codes, activated licenses</p>
                  <p><strong>Customized Products:</strong> Personalized or custom-configured items</p>
                  <p><strong>Consumables:</strong> Batteries, memory cards that have been opened (unless defective)</p>
                  <p><strong>Damaged by Misuse:</strong> Items damaged due to misuse, negligence, or accidents</p>
                  <p><strong>Items Without Original Packaging:</strong> Products returned without original boxes, accessories, or documentation</p>
                  <p><strong>Clearance/Sale Items:</strong> Items marked as final sale or clearance (unless defective)</p>
                </div>
              </section>
  
              {/* Return Process */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Return Process</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Step 1: Initiate Return Request</h3>
                    <div className="space-y-2 text-gray-700 leading-relaxed">
                      <p>Contact our customer service team to initiate a return:</p>
                      <p>• Phone: +91 7558132543 (Mon-Sat, 9:00 AM - 7:00 PM IST)</p>
                      <p>• Email: 360electronicspvtltd@gmail.com</p>
                      <p>• Provide order number, item details, and reason for return</p>
                      <p>Our team will verify eligibility and provide return authorization if approved</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Step 2: Package and Ship</h3>
                    <div className="space-y-2 text-gray-700 leading-relaxed">
                      <p>Once return is authorized:</p>
                      <p>• Pack the item securely in original packaging</p>
                      <p>• Include all accessories, manuals, and original invoice</p>
                      <p>• Use the return shipping label provided (if applicable)</p>
                      <p>• Ship to the address provided by our customer service team</p>
                      <p>• Obtain tracking number and shipping receipt for your records</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Step 3: Inspection and Processing</h3>
                    <div className="space-y-2 text-gray-700 leading-relaxed">
                      <p>Upon receiving your return:</p>
                      <p>• We will inspect the item within 2-5 business days</p>
                      <p>• You will receive email confirmation once inspection is complete</p>
                      <p>• Approved returns will be processed for refund or exchange</p>
                      <p>• Rejected returns will be returned to you at your expense</p>
                    </div>
                  </div>
                </div>
              </section>
  
              {/* Refund Methods and Timeline */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Refund Methods and Timeline</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Refund Methods</h3>
                    <div className="space-y-2 text-gray-700 leading-relaxed">
                      <p>Refunds will be processed using the original payment method:</p>
                      <p><strong>Credit/Debit Cards:</strong> Refunded to the original card used for purchase</p>
                      <p><strong>UPI/Digital Wallets:</strong> Credited back to the original payment source</p>
                      <p><strong>Net Banking:</strong> Refunded to the original bank account</p>
                      <p><strong>Cash on Delivery:</strong> Bank transfer or cheque (account details required)</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Processing Timeline</h3>
                    <div className="space-y-2 text-gray-700 leading-relaxed">
                      <p><strong>Credit/Debit Cards:</strong> 5-10 business days after approval</p>
                      <p><strong>UPI/Digital Wallets:</strong> 3-7 business days after approval</p>
                      <p><strong>Net Banking:</strong> 5-10 business days after approval</p>
                      <p><strong>Bank Transfer (COD orders):</strong> 7-14 business days after providing bank details</p>
                      <p>Please note that actual credit time may vary depending on your bank or payment provider&apos;s processing time.</p>
                    </div>
                  </div>
                </div>
              </section>
  
              {/* Exchanges */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Exchanges</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>We offer exchanges for defective items, wrong items shipped, or size/variant changes where applicable:</p>
                  <p><strong>Defective Items:</strong> Free exchange with return shipping covered by us</p>
                  <p><strong>Wrong Item Shipped:</strong> Free exchange with return shipping covered by us</p>
                  <p><strong>Customer Preference:</strong> Exchange allowed subject to availability and price difference</p>
                  <p><strong>Price Differences:</strong> If the new item costs more, you pay the difference. If it costs less, we refund the difference.</p>
                  <p><strong>Availability:</strong> Exchanges are subject to stock availability. If unavailable, refund will be processed.</p>
                  <p>Exchange requests must be initiated within the same timeframe as returns for each product category.</p>
                </div>
              </section>
  
              {/* Shipping Costs */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Return Shipping Costs</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p><strong>Our Responsibility (Free Return Shipping):</strong></p>
                  <p>• Defective or damaged items</p>
                  <p>• Wrong item shipped by us</p>
                  <p>• Items not matching description</p>
                  <p>• Manufacturing defects within warranty period</p>
                  
                  <p className="mt-4"><strong>Customer Responsibility (You Pay Return Shipping):</strong></p>
                  <p>• Change of mind or preference</p>
                  <p>• Ordered wrong item by mistake</p>
                  <p>• Items damaged due to misuse</p>
                  <p>• Items not eligible for return but returned anyway</p>
                  
                  <p className="mt-4">Return shipping costs typically range from ₹50-₹200 depending on location and item size.</p>
                </div>
              </section>
  
              {/* Damaged or Defective Items */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Damaged or Defective Items</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>If you receive a damaged or defective item:</p>
                  <p><strong>Immediate Action:</strong> Contact us within 48 hours of delivery for priority processing</p>
                  <p><strong>Documentation:</strong> Provide photos of the damaged item and packaging</p>
                  <p><strong>Inspection:</strong> We may arrange for pickup and inspection</p>
                  <p><strong>Resolution Options:</strong> Full refund, free replacement, or store credit (your choice)</p>
                  <p><strong>Timeline:</strong> Expedited processing within 24-48 hours of verification</p>
                  <p><strong>Shipping:</strong> All return and replacement shipping costs covered by us</p>
                  <p>For manufacturing defects covered under warranty, we will facilitate warranty claims with the manufacturer.</p>
                </div>
              </section>
  
              {/* Partial Refunds */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Partial Refunds</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>Partial refunds may be offered in the following situations:</p>
                  <p><strong>Missing Accessories:</strong> If original accessories, manuals, or packaging are missing</p>
                  <p><strong>Minor Damage:</strong> Items with slight signs of use but still functional</p>
                  <p><strong>Return Shipping Costs:</strong> Deducted from refund when customer is responsible</p>
                  <p><strong>Restocking Fee:</strong> 5-15% may be charged for certain electronics returned due to customer preference</p>
                  <p><strong>Late Returns:</strong> Items returned after the specified return period may receive partial refunds</p>
                  <p>The partial refund amount will be clearly communicated before processing.</p>
                </div>
              </section>
  
              {/* International Orders */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">10. International Orders</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>Special conditions apply to international returns:</p>
                  <p><strong>Return Shipping:</strong> Customer responsible for return shipping costs unless item is defective</p>
                  <p><strong>Customs and Duties:</strong> Any customs duties or import taxes are customer&apos;s responsibility</p>
                  <p><strong>Processing Time:</strong> Extended processing time of 10-20 business days due to customs clearance</p>
                  <p><strong>Documentation:</strong> Additional customs documentation may be required</p>
                  <p><strong>Refund Amount:</strong> Original shipping charges are non-refundable for international orders</p>
                  <p>We recommend contacting us before returning international orders to ensure smooth processing.</p>
                </div>
              </section>
  
              {/* Store Credit */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Store Credit</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>In certain cases, we may offer store credit as an alternative to cash refunds:</p>
                  <p><strong>When Offered:</strong> Items returned outside return policy, partial refunds, promotional items</p>
                  <p><strong>Validity:</strong> Store credit is valid for 12 months from issue date</p>
                  <p><strong>Usage:</strong> Can be used for any future purchases on our platform</p>
                  <p><strong>Transferability:</strong> Store credit is non-transferable and tied to your account</p>
                  <p><strong>Combination:</strong> Can be combined with other payment methods</p>
                  <p><strong>Balance Inquiry:</strong> Check your store credit balance in your account dashboard</p>
                </div>
              </section>
  
              {/* Warranty vs Returns */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Warranty vs Returns</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p><strong>Return Policy:</strong> Covers change of mind, unsatisfactory purchases within return period</p>
                  <p><strong>Manufacturer Warranty:</strong> Covers defects and malfunctions for extended periods (6 months to 3+ years)</p>
                  <p><strong>Our Role in Warranty:</strong> We facilitate warranty claims and may provide replacement during warranty period</p>
                  <p><strong>Warranty Service:</strong> Repairs, replacements, or refunds as per manufacturer terms</p>
                  <p><strong>Extended Warranty:</strong> Additional warranty options may be available at purchase</p>
                  <p>For warranty claims beyond our return period, contact us for assistance with manufacturer warranty service.</p>
                </div>
              </section>
  
              {/* Contact for Returns */}
              <section className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
                <div className="space-y-2 text-gray-700">
                  <p>For all return and refund inquiries, please contact us:</p>
                  <p className="mt-4"><strong>Business Name:</strong> 360 Electronics</p>
                  <p><strong>Proprietor:</strong> NOOR MOHAMED MOHAMED USSAN</p>
                  <p><strong>Address:</strong> 173-178, Chinnaswamy Road, New Siddhapudur, Coimbatore, Tamil Nadu 641044, India</p>
                  <p><strong>Phone:</strong> +91 7558132543</p>
                  <p><strong>Email:</strong> 360electronicspvtltd@gmail.com</p>
                  <p><strong>Returns Email:</strong> returns@360electronics.com</p>
                  <p><strong>Business Hours:</strong> Monday to Saturday, 9:00 AM to 7:00 PM IST</p>
                  <p className="mt-4">When contacting us about returns, please have your order number, item details, and reason for return ready. Our customer service team will guide you through the return process and provide updates on your refund status.</p>
                </div>
              </section>
  
              {/* Policy Updates */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Policy Updates</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>We reserve the right to modify this Refund Policy at any time to reflect changes in our business practices or legal requirements.</p>
                  <p>Updates will be posted on our website with a new effective date.</p>
                  <p>Material changes will be communicated via email to registered customers.</p>
                  <p>The policy in effect at the time of your purchase will govern your return rights.</p>
                  <p>We recommend reviewing this policy periodically for any updates.</p>
                </div>
              </section>
  
            </div>
  
            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-500 text-center">
                This Refund Policy is effective as of the last updated date and governs all returns and refunds for purchases made on our platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }