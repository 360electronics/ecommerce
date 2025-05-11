// components/Profile/ProfileInfo.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useProfileContext } from '@/components/Profile/ProfileContext';

export default function ProfileInfo() {
  const { user, isLoggedIn, isLoading: authLoading, setAuth } = useAuth();
  const { profileData, isLoading, error: contextError, refetch } = useProfileContext();
  const [name, setName] = useState(profileData.name);
  const [email, setEmail] = useState(profileData.email);
  const [phoneNumber, setPhoneNumber] = useState(profileData.phoneNumber);
  const [addresses, setAddresses] = useState(profileData.addresses);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    addressType: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync local state when context data changes
  useEffect(() => {
    setName(profileData.name);
    setEmail(profileData.email);
    setPhoneNumber(profileData.phoneNumber);
    setAddresses(profileData.addresses);
  }, [profileData]);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName: name, email, phoneNumber }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile');

      setAuth(true, data.user);
      setSuccess('Profile updated successfully');
      refetch(); // Refetch data to update context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = async () => {
    try {
      const res = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...newAddress, userId: user?.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add address');

      setAddresses((prev) => [...prev, data]);
      setNewAddress({
        fullName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        addressType: 'home',
      });
      setSuccess('Address added successfully');
      refetch(); // Refetch data to update context
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding address');
    }
  };

  if (authLoading || isLoading) return <div className="text-center">Loading profile...</div>;
  if (!isLoggedIn || !user) return <div className="text-red-600 text-center">Please sign in</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-6">
      <h3 className="text-xl font-semibold">Profile Information</h3>

      {(error || contextError) && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">{error || contextError}</div>
      )}
      {success && <div className="p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            type="text"
            className="input"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="mt-8">
        <h4 className="text-lg font-medium mb-2">Saved Addresses</h4>
        <div className="space-y-2">
          {addresses.length === 0 ? (
            <p className="text-gray-500">No saved addresses.</p>
          ) : (
            addresses.map((addr, idx) => (
              <div key={idx} className="border p-3 rounded bg-gray-50">
                <p className="font-semibold">{addr.fullName}</p>
                <p>
                  {addr.addressLine1}, {addr.addressLine2}
                </p>
                <p>
                  {addr.city}, {addr.state} - {addr.postalCode}
                </p>
                <p>
                  {addr.country} ({addr.addressType})
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8">
        <h4 className="text-lg font-medium mb-2">Add New Address</h4>
        <div className="grid grid-cols-2 gap-4">
          {[
            'fullName',
            'phoneNumber',
            'addressLine1',
            'addressLine2',
            'city',
            'state',
            'postalCode',
            'country',
          ].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium capitalize">
                {field.replace(/([A-Z])/g, ' $1')}
              </label>
              <input
                type="text"
                className="input"
                value={newAddress[field as keyof typeof newAddress]}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, [field]: e.target.value })
                }
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium">Address Type</label>
            <select
              className="input"
              value={newAddress.addressType}
              onChange={(e) =>
                setNewAddress({ ...newAddress, addressType: e.target.value })
              }
            >
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleAddAddress}
          className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Address
        </button>
      </div>
    </div>
  );
}