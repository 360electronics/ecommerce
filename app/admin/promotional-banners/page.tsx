'use client'
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import {
    PlusCircle,
    Calendar,
    Link as LinkIcon,
} from 'lucide-react'
import Image from 'next/image'
import { EnhancedTable, type ColumnDefinition } from '@/components/Layouts/TableLayout'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface Banner {
    id: string
    title: string
    imageUrl: string
    type: BannerType
    createdAt: string
    updatedAt: string
    active?: boolean
    link?: string
    startDate?: string
    endDate?: string
}

type BannerType =
    | 'hero-main'
    | 'hero-secondary'
    | 'customise-pc'
    | 'cta'
    | 'register'
    | 'all'
    | 'new-arrivals'
    | 'featured-products'
    | 'gamers-zone'
    | 'laptops'
    | 'monitors'
    | 'processor'
    | 'storage'
    | 'cabinets'
    | 'graphics-card'
    | 'accessories'

interface FormData {
    title: string
    type: BannerType
    image: File | null
    active: boolean
    startDate: string
    endDate: string
    link: string
}

const bannerTypeConfig: Record<BannerType, { color: string; label: string; description: string; recommendedSize: string }> = {
    'hero-main': { color: 'bg-purple-100 text-purple-800', label: 'Hero Main', description: 'Banner displayed on Hero Section Main', recommendedSize: '1200x400px' },
    'hero-secondary': { color: 'bg-violet-100 text-violet-800', label: 'Hero Secondary', description: 'Banner displayed on Hero section small', recommendedSize: '1200x400px' },
    'customise-pc': { color: 'bg-teal-100 text-teal-800', label: 'Customise PC', description: 'Banner displayed on Hero section small', recommendedSize: '1200x400px' },
    cta: { color: 'bg-pink-100 text-pink-800', label: 'CTA', description: 'Banner displayed cta section', recommendedSize: '1200x400px' },
    all: { color: 'bg-red-100 text-red-800', label: 'All Categories', description: 'Banner displayed across all categories', recommendedSize: '1200x400px' },
    register: { color: 'bg-red-100 text-red-800', label: 'Register', description: 'Banner displayed across all categories', recommendedSize: '1200x400px' },
    'new-arrivals': { color: 'bg-green-100 text-green-800', label: 'New Arrivals', description: 'Showcase newly added products', recommendedSize: '1200x400px' },
    'featured-products': { color: 'bg-blue-100 text-blue-800', label: 'Featured Products', description: 'Highlight specially selected products', recommendedSize: '800x300px' },
    'gamers-zone': { color: 'bg-yellow-100 text-yellow-800', label: 'Gamers Zone', description: 'Gaming products and promotions', recommendedSize: '800x300px' },
    laptops: { color: 'bg-purple-100 text-purple-800', label: 'Laptops', description: 'Laptop category banners', recommendedSize: '600x200px' },
    monitors: { color: 'bg-indigo-100 text-indigo-800', label: 'Monitors', description: 'Desktop category banners', recommendedSize: '600x200px' },
    processor: { color: 'bg-yellow-100 text-yellow-800', label: 'Processor', description: 'PC component category banners', recommendedSize: '600x200px' },
    storage: { color: 'bg-pink-100 text-pink-800', label: 'Storage', description: 'Computer peripherals category banners', recommendedSize: '600x200px' },
    cabinets: { color: 'bg-pink-100 text-pink-800', label: 'Cabinets', description: 'Computer peripherals category banners', recommendedSize: '600x200px' },
    'graphics-card': { color: 'bg-pink-100 text-pink-800', label: 'Graphics Card', description: 'Computer peripherals category banners', recommendedSize: '600x200px' },
    accessories: { color: 'bg-orange-100 text-orange-800', label: 'Accessories', description: 'Computer accessories category banners', recommendedSize: '600x200px' }
}

const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const PromotionalBannersPage: React.FC = () => {
    const router = useRouter()
    const [banners, setBanners] = useState<Banner[]>([])
    const [selectedBanners, setSelectedBanners] = useState<Banner[]>([])
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [formData, setFormData] = useState<FormData>({
        title: '',
        type: 'hero-main',
        image: null,
        active: true,
        startDate: '',
        endDate: '',
        link: ''
    })

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        try {
            const response = await fetch('/api/banner')
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const responseData = await response.json()
            const transformedBanners: Banner[] = Array.isArray(responseData.data)
                ? responseData.data.map((item: any) => ({
                      id: item.id,
                      title: item.title,
                      imageUrl: item.imageUrl,
                      type: item.type,
                      createdAt: item.createdAt,
                      updatedAt: item.updatedAt,
                      active: item.status === 'active',
                      startDate: item.start_date || '',
                      endDate: item.end_date || '',
                      link: item.link || ''
                  }))
                : []
            setBanners(transformedBanners)
        } catch (error) {
            console.error('Error fetching banners:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to load banners')
        }
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked
        const files = (e.target as HTMLInputElement).files

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'file' ? files?.[0] ?? null : value
        }))
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const apiFormData = new FormData()
            apiFormData.append('title', formData.title)
            apiFormData.append('type', formData.type)
            apiFormData.append('status', formData.active ? 'active' : 'inactive')
            if (formData.startDate) apiFormData.append('start_date', formData.startDate)
            if (formData.endDate) apiFormData.append('end_date', formData.endDate)
            if (formData.link) apiFormData.append('link', formData.link)
            if (formData.image) {
                apiFormData.append('image', formData.image)
            } else {
                throw new Error('Banner image is required')
            }

            const response = await fetch('/api/banner', {
                method: 'POST',
                body: apiFormData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to create banner')
            }

            const result = await response.json()
            const currentDate = new Date().toISOString()
            const newBanner: Banner = {
                id: result.bannerId,
                title: formData.title,
                imageUrl: result.imageUrl,
                type: formData.type,
                createdAt: currentDate,
                updatedAt: currentDate,
                active: formData.active,
                startDate: formData.startDate,
                endDate: formData.endDate,
                link: formData.link
            }

            setBanners(prev => [...prev, newBanner])
            setIsAddModalOpen(false)
            toast.success('Banner created successfully')
            setFormData({
                title: '',
                type: 'hero-main',
                image: null,
                active: true,
                startDate: '',
                endDate: '',
                link: ''
            })
        } catch (error) {
            console.error('Error creating banner:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create banner')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddBanner = () => {
        setIsAddModalOpen(true)
    }

    const deleteBanner = (banner: Banner) => {
        if (window.confirm('Are you sure you want to delete this banner?')) {
            setIsLoading(true)
            fetch('/api/banner', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: [banner.id] })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete banner')
                    }
                    setBanners(prev => prev.filter(b => b.id !== banner.id))
                    setSelectedBanners(prev => prev.filter(b => b.id !== banner.id))
                    toast.success(`${selectedBanners.length} banners deleted successfully`)
                })
                .catch(error => {
                    console.error('Error deleting banner:', error)
                    toast.error('Failed to delete banner')
                })
                .finally(() => setIsLoading(false))
        }
    }

    const handleBulkDelete = async (selectedItems: Banner[]) => {
        if (window.confirm(`Are you sure you want to delete ${selectedItems.length} banners?`)) {
            try {
                const selectedIds = selectedItems.map(item => item.id)
                const response = await fetch('/api/banner', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ids: selectedIds })
                })

                if (!response.ok) {
                    throw new Error('Failed to delete banners')
                }

                setBanners(prev => prev.filter(banner => !selectedIds.includes(banner.id)))
                setSelectedBanners([])
                toast.success(`${selectedBanners.length} banners deleted successfully`)

            } catch (error) {
                console.error('Error bulk deleting banners:', error)
                toast.error('Failed to delete banners')
            }
        }
    }

    const handleToggleActive = (id: string) => {
        const banner = banners.find(b => b.id === id)
        if (!banner) return

        // Note: This is a UI-only toggle for demo purposes. In a real app, this would call the API.
        setBanners(prev =>
            prev.map(b =>
                b.id === id ? { ...b, active: !b.active } : b
            )
        )
        toast.success(`Banner status updated to ${banner.active ? 'inactive' : 'active'}`)
    }

    const addBannerFormContent = (
        <form onSubmit={handleSubmit} aria-labelledby="add-banner-title">
            <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                </label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    aria-required="true"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                </label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    aria-required="true"
                    aria-describedby="type-description"
                >
                    {Object.entries(bannerTypeConfig).map(([type, config]) => (
                        <option key={type} value={type}>
                            {config.label}
                        </option>
                    ))}
                </select>
                <p id="type-description" className="mt-1 text-sm text-gray-500">
                    {bannerTypeConfig[formData.type].description}
                </p>
            </div>
            <div className="mb-4">
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
                    Link (Optional)
                </label>
                <input
                    type="url"
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://example.com"
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
            </div>
            <div className="mb-4">
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Image
                </label>
                <div className="flex items-center space-x-4">
                    <input
                        type="file"
                        id="image"
                        name="image"
                        onChange={handleChange}
                        className="flex-1  px-3 py-2 border border-gray-300 rounded-md"
                        accept="image/*"
                        required
                        aria-required="true"
                        aria-describedby="image-description"
                    />
                    <div id="image-description" className="text-sm text-gray-500">
                        {`Recommended: ${bannerTypeConfig[formData.type].recommendedSize}`}
                    </div>
                </div>
                {formData.image && (
                    <div className="mt-2">
                        <p className="text-sm text-green-600">Image selected: {formData.image.name}</p>
                    </div>
                )}
            </div>
            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded"
                    aria-checked={formData.active}
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                    Active
                </label>
            </div>
            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={isLoading}
                    aria-label="Cancel adding banner"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={isLoading}
                    aria-label="Submit new banner"
                >
                    {isLoading ? 'Adding...' : 'Add Banner'}
                </button>
            </div>
        </form>
    )

    const isVideoUrl = (url: string | undefined | null): boolean => {
        if (typeof url !== 'string') return false
    
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi']
        return videoExtensions.some(ext => url.toLocaleLowerCase().endsWith(ext))
    }
    

    const bannerColumns: ColumnDefinition<Banner>[] = [
        {
            key: 'imageUrl',
            header: 'Banner',
            width: '150px',
            align: 'left',
            renderCell: (value, banner) => {
                const url = value as string
                const isVideo = isVideoUrl(url)
    
                return (
                    <div className="flex-shrink-0 h-20 w-40 relative">
                        {isVideo ? (
                            <video
                                src={url}
                                className="object-cover rounded-md w-full h-full"
                                autoPlay={true}
                                muted
                                loop
                                playsInline
                                aria-label={`Video preview for ${banner.title}`}
                                title={banner.title}
                            />
                        ) : (
                            <Image
                                src={url || '/api/placeholder/600/200'}
                                alt={banner.title}
                                fill
                                className="object-contain max-w-2xs rounded-md"
                                aria-label={`Image preview for ${banner.title}`}
                            />
                        )}
                        {isVideo && (
                            <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded">
                                Video
                            </div>
                        )}
                    </div>
                )
            }
        },
        {
            key: 'title',
            header: 'Title',
            sortable: true,
            width: '20%',
            align: 'left',
            renderCell: (value, banner) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{value}</div>
                    {banner.link && (
                        <a
                            href={banner.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center"
                            aria-label={`Visit banner link for ${banner.title}`}
                        >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            Link
                        </a>
                    )}
                </div>
            )
        },
        {
            key: 'type',
            header: 'Category',
            sortable: true,
            width: '15%',
            align: 'left',
            renderCell: (value) => {
                const type = value as BannerType
                return (
                    <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bannerTypeConfig[type].color}`}
                    >
                        {bannerTypeConfig[type].label}
                    </span>
                )
            }
        },
        {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            width: '15%',
            align: 'left',
            renderCell: (value) => formatDate(value as string)
        },
        {
            key: 'startDate',
            header: 'Campaign Period',
            width: '20%',
            align: 'left',
            renderCell: (value, banner) => (
                banner.startDate && banner.endDate ? (
                    <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                            {formatDate(banner.startDate)} to {formatDate(banner.endDate)}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-gray-400">No date range set</span>
                )
            )
        },
        {
            key: 'active',
            header: 'Status',
            sortable: true,
            width: '10%',
            align: 'left',
            renderCell: (value) => {
                const isActive = value === true
                return (
                    <button
                        onClick={() => handleToggleActive((value as any).id)}
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                        aria-label={`Toggle status to ${isActive ? 'inactive' : 'active'}`}
                    >
                        {isActive ? 'Active' : 'Scheduled'}
                    </button>
                )
            }
        }
    ]

    const bannerCounts = banners.reduce((acc, banner) => {
        acc[banner.type] = (acc[banner.type] || 0) + 1
        return acc
    }, {} as Record<BannerType, number>)

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Banner Management</h1>
                <div className="flex space-x-2">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Total: {banners.length}</span>
                        <div className="flex mt-1 space-x-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {banners.filter(b => b.active).length} Active
                            </span>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {banners.filter(b => !b.active).length} Scheduled
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleAddBanner}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
                        aria-label="Add new banner"
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Banner
                    </button>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-3 md:grid-cols-5 gap-4">
                {Object.entries(bannerTypeConfig).slice(0, 5).map(([type, config]) => (
                    <div
                        key={type}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center"
                    >
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full mb-2 ${config.color}`}>
                            {config.label}
                        </span>
                        <div className="text-2xl font-bold">
                            {bannerCounts[type as BannerType] || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {banners.filter(b => b.type === type && b.active).length} active
                        </div>
                    </div>
                ))}
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
                        <h2 id="add-banner-title" className="text-xl font-semibold mb-4">Add New Banner</h2>
                        {addBannerFormContent}
                    </div>
                </div>
            )}

            <EnhancedTable
                id="banners-table"
                data={banners}
                columns={bannerColumns}
                selection={{
                    enabled: true,
                    onSelectionChange: setSelectedBanners,
                    selectionKey: 'id'
                }}
                search={{
                    enabled: true,
                    keys: ['title', 'type'],
                    placeholder: 'Search banners...'
                }}
                filters={{
                    enabled: true
                }}
                pagination={{
                    enabled: true,
                    pageSizeOptions: [5, 10, 25, 50],
                    defaultPageSize: 10
                }}
                sorting={{
                    enabled: true,
                    defaultSortColumn: 'createdAt',
                    defaultSortDirection: 'desc'
                }}
                actions={{
                    onAdd: handleAddBanner,
                    addButtonText: 'Add Banner',
                    bulkActions: {
                        delete: handleBulkDelete
                    },
                    rowActions: {
                        delete: deleteBanner
                    }
                }}
                customization={{
                    rowHoverEffect: true,
                    zebraStriping: false,
                    stickyHeader: true
                }}
                onRowClick={(banner) => router.push(`/banner/${banner.id}`)}
            />
        </div>
    )
}

export default PromotionalBannersPage