"use client";
import Header from "@/components/Navigations/Header";

export default function CancellationPolicy() {
  const lastUpdated = "Dec 01, 2025";

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50 pt-12 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page Header */}
          <div className="border-b border-gray-200 px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Cancellation & Refund Policy</h1>
            <p className="text-sm text-gray-600">Last updated: {lastUpdated}</p>
          </div>

          {/* Content */}
          <div className="px-6 py-10 space-y-10">

            {/* Cancellation Policy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Cancellation Policy</h2>

              <div className="space-y-3 text-gray-700 leading-relaxed">

                <p><strong>1.</strong> We have a hassle-free cancellation request option available in the order panel. You can place your cancellation request directly from there, or you can email or call us to cancel your order.</p>

                <p><strong>2.</strong> The convenience fee charged on orders is non-refundable only if the order is cancelled by the buyer. If the order is cancelled by us, the complete order amount will be refunded. This charge applies only when the buyer cancels the order and opts for a refund.</p>

                <p><strong>3.</strong> 
                  <ul className="list-disc pl-6 mt-1">
                    <li>2% will be deducted as a convenience fee for orders cancelled by the buyer before shipping.</li>
                    <li>5% will be deducted if the order has already been shipped and then cancelled by the buyer.</li>
                    <li>3% will be deducted if the buyer wants to modify the order after it has been shipped.</li>
                    <li>No charges apply for modifications before shipping.</li>
                  </ul>
                  These charges will be adjusted from the refund amount. If the buyer opts for a refund, it will be initiated once we receive the product in the same condition in which it was shipped.
                </p>

                <p><strong>4.</strong> The above charges apply only when such requests are initiated by the buyer. No charges are applicable if cancellation or modification steps are initiated by us.</p>

                <p><strong>5.</strong> In case of complaints regarding products that come with a manufacturer&apos;s warranty, please contact the respective brand. 360 Electronics believes in assisting customers as much as possible and follows a liberal cancellation policy, subject to the above terms.</p>
              </div>
            </section>

            {/* Refund / Return Policy */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Return & Refund Policy</h2>

              <div className="space-y-3 text-gray-700 leading-relaxed">

                <p><strong>1.</strong> We accept return and refund requests only if the product delivered by us is in damaged condition, the wrong product was sent, the product is in dead condition, or the product is defective.</p>

                <p>Buyers will have:</p>
                <ul className="list-disc pl-6 mt-1">
                  <li>3 days to report any issues for all products.</li>
                  <li>7 days for complete PC set purchases.</li>
                </ul>
                <p>Bugs must be reported via email (preferred) or phone call.</p>

                <p><strong>2.</strong> For gaming chairs, only part replacement is applicable if the delivered product is defective or damaged. No refunds will be issued for gaming chair orders.</p>

                <p><strong>3.</strong> If the product seal is opened and the product is not faulty, return/refund will not be applicable.</p>

                <p><strong>4.</strong> Return/refund requests will be cancelled if any part or accessory is missing from the product box.</p>

                <p><strong>5.</strong> Packaging material must be retained by the buyer during the return window. Proper packaging helps avoid damage during transit.</p>

                <p><strong>6.</strong> Product must be packed exactly as originally received. Do not apply tapes or glue directly on the product or its box—doing so may lead to cancellation of the return request.</p>

                <p><strong>7.</strong> All accessories included with the original product must be returned in the same condition.</p>

                <p><strong>8.</strong> 
                  If payment was made through our payment gateway, refunds will be processed to the same account.  
                  For **bank transfer or COD orders**, refunds will be made only to the buyer’s bank account.  
                  Refunds typically take **7–10 working days** to reflect in your account.
                </p>

                <p><strong>9.</strong> A 5% deduction applies on orders placed using **Bajaj EMI**, if cancelled by the buyer.</p>

              </div>
            </section>

          </div>

          {/* Footer Note */}
          <div className="border-t border-gray-200 px-6 py-6">
            <p className="text-sm text-gray-500 text-center">
              By purchasing from 360 Electronics, you acknowledge that you have read and agree to this Cancellation & Refund Policy.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
