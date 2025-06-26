'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white shadow-xl rounded-3xl p-8 sm:p-10 text-center border border-gray-200 animate-fadeIn">
        <div className="flex justify-center mb-4 text-red-500">
          <AlertTriangle className="w-14 h-14" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2">
          Oops! Something went wrong
        </h1>

        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          We encountered an unexpected error. Try refreshing the page or come back later.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary-dark transition focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 transition"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4" /> Hide Error Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Show Error Details
              </>
            )}
          </button>

          {showDetails && (
            <pre className="mt-4 max-h-64 overflow-auto text-left text-sm bg-gray-100 text-red-600 p-4 rounded-xl border">
              {error.stack || 'No error stack available.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
