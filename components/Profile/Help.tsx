'use client';
export default function Help() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Help & Support</h3>
      <p className="text-gray-600">Contact us for assistance.</p>
      <div className="mt-4">
        <p className="font-medium">Email: support@example.com</p>
        <p className="font-medium">Phone: +1 (800) 123-4567</p>
        <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Live Chat
        </button>
      </div>
    </div>
  );
}
