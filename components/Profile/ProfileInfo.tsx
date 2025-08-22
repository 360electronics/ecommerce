"use client"

import { useEffect, useState } from "react"
import {
  AlertCircle,
  Loader2,
  Pencil,
  UserRoundPlus as UserRoundPen,
  X,
  Shield,
  CheckCircle,
  Phone,
  Mail,
} from "lucide-react"
import { useAuthStore } from "@/store/auth-store"
import { useProfileStore } from "@/store/profile-store"
import toast from "react-hot-toast"

interface Address {
  id: string
  fullName: string
  phoneNumber: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  gst: string
  addressType: "home" | "work" | "other"
}

export default function ProfileInfo() {
  const { user, isLoggedIn, isLoading: authLoading, setAuth } = useAuthStore()
  const { profileData, loadingStates, errors, refetch } = useProfileStore()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [firstName, setFirstName] = useState(profileData.firstName)
  const [lastName, setLastName] = useState(profileData.lastName)
  const [email, setEmail] = useState(profileData.email)
  const [phoneNumber, setPhoneNumber] = useState(profileData.phoneNumber)
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    gst: "",
    addressType: "home" as "home" | "work" | "other",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [verificationLoading, setVerificationLoading] = useState(false)

  useEffect(() => {
    setFirstName(profileData.firstName)
    setLastName(profileData.lastName)
    setEmail(profileData.email)
    setPhoneNumber(profileData.phoneNumber)
  }, [profileData])

  const handleSaveProfile = async () => {
    setError(null)
    setSuccess(null)

    if (!firstName?.trim() || !email?.trim()) {
      setError("First name and email are required.")
      toast.error("First name and email are required.")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, email, phoneNumber }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to update profile")

      setAuth(true, data.user)
      setSuccess("Profile updated successfully")
      toast.success("Profile updated successfully")
      refetch("profile", user?.id || "", true)
      setIsProfileModalOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAddress = async () => {
    setError(null)
    setSuccess(null)

    // Validate required fields (excluding gst)
    const requiredFields: (keyof typeof newAddress)[] = [
      "fullName",
      "phoneNumber",
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
    ]
    const missingFields = requiredFields.filter((field) => !newAddress[field]?.trim())
    if (missingFields.length > 0) {
      const errorMessage = `Please fill in all required fields: ${missingFields
        .map((field) => field.replace(/([A-Z])/g, " $1"))
        .join(", ")}`
      setError(errorMessage)
      toast.error(errorMessage)
      return
    }

    const addressData = { ...newAddress, userId: user?.id }
    const isEditing = !!editingAddress
    const url = isEditing ? `/api/users/addresses/${editingAddress?.id}` : "/api/users/addresses"
    const method = isEditing ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addressData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to ${isEditing ? "update" : "add"} address`)

      setSuccess(`Address ${isEditing ? "updated" : "added"} successfully`)
      toast.success(`Address ${isEditing ? "updated" : "added"} successfully`)
      refetch("profile", user?.id || "", true)
      setNewAddress({
        fullName: "",
        phoneNumber: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        gst: "",
        addressType: "home",
      })
      setEditingAddress(null)
      setIsAddressModalOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : `Error ${isEditing ? "updating" : "adding"} address`
      setError(message)
      toast.error(message)
    } finally {
      setVerificationLoading(false)
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setNewAddress(address)
    setIsAddressModalOpen(true)
  }

  const handleCloseAddressModal = () => {
    setIsAddressModalOpen(false)
    setEditingAddress(null)
    setNewAddress({
      fullName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      gst: "",
      addressType: "home",
    })
  }

  const handleUpgradeAccount = async () => {
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      toast.error("Please fill in your name and email to upgrade your account")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/users/upgrade-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, email, phoneNumber }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to upgrade account")

      setAuth(true, data.user)
      toast.success("Account upgraded successfully! You now have full access.")
      refetch("profile", user?.id || "", true)
      setIsProfileModalOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRequestVerification = async (type: "email" | "phone") => {
    if (!user?.id) return

    setVerificationLoading(true)
    try {
      const response = await fetch("/api/auth/request-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: user.id, type }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to send verification")

      toast.success(`Verification ${type === "email" ? "email" : "SMS"} sent successfully!`)
      setIsVerificationModalOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      toast.error(message)
    } finally {
      setVerificationLoading(false)
    }
  }

  if (authLoading || loadingStates.profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4 text-center">
        <AlertCircle className="h-5 w-5 text-red-400 inline-block mr-2" />
        <span className="text-red-700">Please sign in to view your profile.</span>
      </div>
    )
  }

  const isGuestUser = user.role === "guest"
  const hasUnverifiedContacts = (user.email && !user.emailVerified) || (user.phoneNumber && !user.phoneVerified)

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 nohemi-bold">
        Your <span className="text-primary border-b-3 border-primary">Profile</span>
      </h1>

      {isGuestUser && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Guest Account</h3>
                <p className="text-sm text-blue-700">
                  Complete your profile to unlock full features and secure your account.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      {!isGuestUser && hasUnverifiedContacts && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900">Verification Required</h3>
                <p className="text-sm text-yellow-700">
                  {!user.emailVerified && user.email && "Email verification pending. "}
                  {!user.phoneVerified && user.phoneNumber && "Phone verification pending."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
            >
              Verify Now
            </button>
          </div>
        </div>
      )}

      {(error || errors.profile) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <span className="text-sm text-green-700">{success}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center justify-center gap-1 hover:underline cursor-pointer font-medium text-sm transition-colors"
            aria-label="Manage profile"
          >
            <UserRoundPen className="text-primary" size={20} /> Manage Profile
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-lg font-medium text-gray-900">
              {profileData.firstName || profileData.lastName
                ? `${profileData.firstName ?? ""} ${profileData.lastName ?? ""}`.trim()
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              Email
              {user.emailVerified ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </p>
            <p className="text-lg font-medium text-gray-900">{profileData.email ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              Phone
              {user.phoneVerified ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </p>
            <p className="text-lg font-medium text-gray-900">{profileData.phoneNumber || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Account Type</p>
            <p className="text-lg font-medium text-gray-900 capitalize flex items-center gap-2">
              {user.role}
              {user.role === "guest" && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Limited Access</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
          <button
            onClick={() => setIsAddressModalOpen(true)}
            className="flex items-center justify-center gap-1 hover:underline font-medium text-sm transition-colors"
            aria-label="Manage addresses"
          >
            <Pencil size={20} className="text-primary" /> Manage Addresses
          </button>
        </div>
        {profileData.addresses?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No saved addresses.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileData.addresses?.map((addr) => (
              <div key={addr.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{addr.fullName}</p>
                    <p className="text-sm text-gray-600">{addr.addressLine1}</p>
                    {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                    <p className="text-sm text-gray-600">
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p className="text-sm text-gray-600">{addr.country}</p>
                    <p className="text-sm text-gray-600">{addr.gst}</p>
                    <p className="text-sm text-gray-500 capitalize mt-1">{addr.addressType}</p>
                  </div>
                  <button
                    onClick={() => handleEditAddress(addr)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                    aria-label={`Edit address for ${addr.fullName}`}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[80vh] overflow-auto animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {isGuestUser ? "Complete Your Profile" : "Edit Profile"}
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close profile modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isGuestUser && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Complete your profile to upgrade from guest account and unlock full features.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={firstName ?? ""}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSaving}
                  aria-label="First Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={lastName ?? ""}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSaving}
                  aria-label="Last Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={email ?? ""}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSaving}
                  aria-label="Email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={phoneNumber ?? ""}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isSaving}
                  aria-label="Phone number"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={isSaving}
                  aria-label="Cancel profile edit"
                >
                  Cancel
                </button>
                {isGuestUser ? (
                  <button
                    onClick={handleUpgradeAccount}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg text-white disabled:opacity-50"
                    disabled={isSaving}
                    aria-label="Upgrade account"
                  >
                    {isSaving ? "Upgrading..." : "Upgrade Account"}
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover rounded-lg text-white disabled:opacity-50"
                    disabled={isSaving}
                    aria-label="Save profile changes"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isVerificationModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Verify Your Contacts</h3>
              <button
                onClick={() => setIsVerificationModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close verification modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {user.email && !user.emailVerified && (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Email Verification</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRequestVerification("email")}
                    disabled={verificationLoading}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {verificationLoading ? "Sending..." : "Verify"}
                  </button>
                </div>
              )}
              {user.phoneNumber && !user.phoneVerified && (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Phone Verification</p>
                      <p className="text-xs text-gray-500">{user.phoneNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRequestVerification("phone")}
                    disabled={verificationLoading}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {verificationLoading ? "Sending..." : "Verify"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-auto animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                onClick={handleCloseAddressModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close address modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                "fullName",
                "phoneNumber",
                "addressLine1",
                "addressLine2",
                "city",
                "state",
                "postalCode",
                "country",
                "gst",
              ].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {field.replace(/([A-Z])/g, " $1")}
                    {field === "gst" || field === "addressLine2" ? " (optional)" : ""}
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newAddress[field as keyof typeof newAddress]}
                    onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })}
                    aria-label={field.replace(/([A-Z])/g, " $1")}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700">Address Type</label>
                <select
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newAddress.addressType}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, addressType: e.target.value as "home" | "work" | "other" })
                  }
                  aria-label="Address type"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCloseAddressModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  aria-label="Cancel address edit"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddress}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  aria-label={editingAddress ? "Update address" : "Add address"}
                >
                  {editingAddress ? "Update Address" : "Add Address"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
