import Header from "@/components/Navigations/Header";

export default function TermsAndConditions() {
  const lastUpdated = "Dec 01, 2025";

  return (
    <>
      <Header />
      <div className="min-h-screen  pb-10 ">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
              <p className="text-sm text-gray-600">Last updated: {lastUpdated}</p>
            </div>

            {/* Content */}
            <div className="px-6 py-8 space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  These Terms and Conditions govern your use of our e-commerce platform and services.
                  By accessing or using our website, you agree to be bound by these terms.
                  &quot;We,&quot; &quot;us,&quot; or &quot;our&quot; refers to 360 Electronics <strong>(Computer Garage 360)</strong>, operating from
                  173-178, Chinnaswamy Road, New Siddhapudur, Coimbatore, Tamil Nadu 641044, India.
                  &quot;You&quot; or &quot;your&quot; refers to any individual or entity using our services.
                </p>
              </section>

              {/* Account Terms */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Account Registration</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>You must provide accurate and complete information when creating an account.</p>
                  <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
                  <p>You must notify us immediately of any unauthorized use of your account.</p>
                  <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
                </div>
              </section>

              {/* Products and Services */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Products and Services</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>All product descriptions, images, and specifications are provided for informational purposes.</p>
                  <p>We strive for accuracy but do not guarantee that all information is error-free.</p>
                  <p>Product availability is subject to change without notice.</p>
                  <p>We reserve the right to modify or discontinue products at any time.</p>
                </div>
              </section>

              {/* Orders and Payment */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Orders and Payment</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>All orders are subject to acceptance and availability.</p>
                  <p>Prices are displayed in Indian Rupees (INR) and include applicable taxes unless stated otherwise.</p>
                  <p>Payment must be completed at the time of order placement.</p>
                  <p>We accept various payment methods as displayed during checkout.</p>
                  <p>We reserve the right to cancel orders due to pricing errors, product unavailability, or suspected fraudulent activity.</p>
                  <p>Card transactions are subject to validation by your card issuer and preset limits agreed with our acquiring bank.</p>
                </div>
              </section>

              {/* Shipping and Delivery */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Shipping and Delivery</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p><strong>International Orders:</strong> Orders for international buyers are shipped and delivered through registered international courier companies and/or international speed post only.</p>
                  <p><strong>Domestic Orders:</strong> Orders for domestic buyers are shipped through registered domestic courier companies and/or speed post only.</p>
                  <p><strong>Processing Time:</strong> Orders are shipped within 0-7 days from the date of order confirmation and payment, or as per the delivery date agreed at the time of order confirmation.</p>
                  <p><strong>Delivery Timeline:</strong> Delivery of shipments is subject to courier company/post office norms and timelines.</p>
                  <p><strong>Delivery Address:</strong> All orders will be delivered to the address provided by the buyer during checkout.</p>
                  <p><strong>Service Confirmation:</strong> Delivery of our services will be confirmed via email to the address specified during registration.</p>
                  <p><strong>Liability:</strong> 360 Electronics is not liable for any delay in delivery by the courier company or postal authorities. We guarantee to hand over the consignment to the courier company or postal authorities within 0-7 days from the date of order and payment, or as per the agreed delivery date.</p>
                  <p><strong>Support:</strong> For any issues regarding shipping or our services, contact our helpdesk at 7558132543 or email us at 360electronicsofficial@gmail.com</p>
                </div>
              </section>

              {/* Returns and Refunds */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Returns and Refunds</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>Returns must be initiated within the specified return period for each product category.</p>
                  <p>Products must be in original condition with all packaging and accessories.</p>
                  <p>Certain items may be non-returnable for hygiene or safety reasons.</p>
                  <p>Refunds will be processed to the original payment method within 7-10 business days.</p>
                  <p>Return shipping costs may be deducted from refunds unless the return is due to our error.</p>
                </div>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>All content on our website, including text, graphics, logos, and software, is our property or licensed to us.</p>
                  <p>You may not reproduce, distribute, or create derivative works without our written consent.</p>
                  <p>Trademarks and brand names belong to their respective owners.</p>
                </div>
              </section>

              {/* User Conduct */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. User Conduct</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>You agree not to use our platform for any unlawful or prohibited activities.</p>
                  <p>You may not interfere with the proper functioning of our website or services.</p>
                  <p>Reviews and comments must be truthful and not violate any third-party rights.</p>
                  <p>We reserve the right to remove content that violates these terms.</p>
                </div>
              </section>

              {/* Privacy and Data Protection */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Privacy and Data Protection</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>Your privacy is important to us. Please review our Privacy Policy for details on data collection and use.</p>
                  <p>We implement appropriate security measures to protect your personal information.</p>
                  <p>By using our services, you consent to the collection and use of information as described in our Privacy Policy.</p>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>We provide our services &quot;as is&quot; without warranties of any kind.</p>
                  <p>We are not liable for any indirect, incidental, or consequential damages.</p>
                  <p>Our total liability shall not exceed the amount paid by you for the specific product or service.</p>
                  <p>We exclude liability for inaccuracies or errors to the fullest extent permitted by law.</p>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Governing Law and Disputes</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>These terms are governed by the laws of India.</p>
                  <p>Any disputes arising from your use of our services shall be subject to the jurisdiction of Indian courts.</p>
                  <p>We encourage resolving disputes through direct communication before pursuing legal action.</p>
                </div>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
                <div className="space-y-3 text-gray-700 leading-relaxed">
                  <p>We reserve the right to modify these terms at any time.</p>
                  <p>Changes will be effective immediately upon posting on our website.</p>
                  <p>Continued use of our services constitutes acceptance of modified terms.</p>
                  <p>We recommend reviewing these terms periodically for updates.</p>
                </div>
              </section>

              {/* Contact Information */}
              <section className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Business Name:</strong> 360 Electronics (a.k.a Computer Garage 360)</p>
                  <p><strong>Address:</strong> 173-178, Chinnaswamy Road, New Siddhapudur, Coimbatore, Tamil Nadu 641044, India</p>
                  <p><strong>Phone:</strong> 7558132543</p>
                  <p><strong>Email:</strong> 360electronicsofficial@gmail.com</p>
                  <p className="mt-4">For questions regarding these terms, shipping inquiries, or any service-related issues, please contact us through the above channels.</p>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-500 text-center">
                By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}