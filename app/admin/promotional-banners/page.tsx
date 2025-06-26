'use client';
import React, { useState, useEffect, ChangeEvent, FormEvent, DragEvent } from 'react';
import { PlusCircle, Calendar, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { EnhancedTable, type ColumnDefinition } from '@/components/Layouts/TableLayout';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Banner {
  id: string;
  title: string;
  imageUrls: {
    default: string;
    sm?: string;
    lg?: string;
  };
  type: BannerType;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
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
  | 'gamers-zone';

interface BannerTypeConfig {
  color: string;
  label: string;
  description: string;
  recommendedSizes: {
    default: string;
    sm: string;
    lg: string;
  };
  dimensions: {
    default: { width: number; height: number };
    sm: { width: number; height: number };
    lg: { width: number; height: number };
  };
  supportsVideo: boolean; // New flag for video support
}

interface FormData {
  title: string;
  type: BannerType;
  images: {
    default: File | null;
    sm: File | null;
    lg: File | null;
  };
  active: boolean;
  startDate: string;
  endDate: string;
}

const bannerTypeConfig: Record<BannerType, BannerTypeConfig> = {
  'hero-main': {
    color: 'bg-purple-100 text-purple-800',
    label: 'Hero Main',
    description: 'Main hero banner',
    recommendedSizes: {
      default: '1200x400px',
      sm: '640x200px',
      lg: '1920x600px',
    },
    dimensions: {
      default: { width: 1200, height: 400 },
      sm: { width: 480, height: 640 },
      lg: { width: 1920, height: 600 },
    },
    supportsVideo: false,
  },
  'hero-secondary': {
    color: 'bg-violet-100 text-violet-800',
    label: 'Hero Secondary',
    description: 'Secondary hero banner (supports images and videos)',
    recommendedSizes: {
      default: '1200x400px or video',
      sm: '640x200px or video',
      lg: '1920x600px or video',
    },
    dimensions: {
      default: { width: 1200, height: 400 },
      sm: { width: 640, height: 200 },
      lg: { width: 1920, height: 600 },
    },
    supportsVideo: true, // Enable video support
  },
  'customise-pc': {
    color: 'bg-teal-100 text-teal-800',
    label: 'Customise PC',
    description: 'PC customization banner',
    recommendedSizes: {
      default: '1200x400px',
      sm: '640x200px',
      lg: '1920x600px',
    },
    dimensions: {
      default: { width: 1200, height: 400 },
      sm: { width: 640, height: 200 },
      lg: { width: 1920, height: 600 },
    },
    supportsVideo: false,
  },
  cta: {
    color: 'bg-pink-100 text-pink-800',
    label: 'CTA',
    description: 'Call to action banner',
    recommendedSizes: {
      default: '1200x400px',
      sm: '640x200px',
      lg: '1920x600px',
    },
    dimensions: {
      default: { width: 1200, height: 400 },
      sm: { width: 640, height: 200 },
      lg: { width: 1920, height: 600 },
    },
    supportsVideo: false,
  },
  all: {
    color: 'bg-red-100 text-red-800',
    label: 'All Categories',
    description: 'Category-wide banner',
    recommendedSizes: {
      default: '1200x400px',
      sm: '640x200px',
      lg: '1920x600px',
    },
    dimensions: {
      default: { width: 1200, height: 400 },
      sm: { width: 640, height: 200 },
      lg: { width: 1920, height: 600 },
    },
    supportsVideo: false,
  },
  register: {
    color: 'bg-red-100 text-red-800',
    label: 'Register',
    description: 'Registration banner',
    recommendedSizes: {
      default: '1200x400px',
      sm: '640x200px',
      lg: '1920x600px',
    },
    dimensions: {
      default: { width: 1200, height: 400 },
      sm: { width: 640, height: 200 },
      lg: { width: 1920, height: 600 },
    },
    supportsVideo: false,
  },
  'new-arrivals': {
    color: 'bg-green-100 text-green-800',
    label: 'New Arrivals',
    description: 'Showcase new products',
    recommendedSizes: {
      default: '1200x400px',
      sm: '640x200px',
      lg: '1920x600px',
    },
    dimensions: {
      default: { width: 1200, height: 400 },
      sm: { width: 640, height: 200 },
      lg: { width: 1920, height: 600 },
    },
    supportsVideo: false,
  },
  'featured-products': {
    color: 'bg-blue-100 text-blue-800',
    label: 'Featured Products',
    description: 'Highlight selected products',
    recommendedSizes: {
      default: '800x300px',
      sm: '480x180px',
      lg: '1200x450px',
    },
    dimensions: {
      default: { width: 800, height: 300 },
      sm: { width: 480, height: 180 },
      lg: { width: 1200, height: 450 },
    },
    supportsVideo: false,
  },
  'gamers-zone': {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Gamers Zone',
    description: 'Gaming products banner',
    recommendedSizes: {
      default: '800x300px',
      sm: '480x180px',
      lg: '1200x450px',
    },
    dimensions: {
      default: { width: 800, height: 300 },
      sm: { width: 480, height: 180 },
      lg: { width: 1200, height: 450 },
    },
    supportsVideo: false,
  },
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PromotionalBannersPage: React.FC = () => {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBanners, setSelectedBanners] = useState<Banner[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    type: 'hero-main',
    images: { default: null, sm: null, lg: null },
    active: true,
    startDate: '',
    endDate: '',
  });
  const [imagePreviews, setImagePreviews] = useState<{
    default: string | null;
    sm: string | null;
    lg: string | null;
  }>({ default: null, sm: null, lg: null });
  const [isDragging, setIsDragging] = useState<{
    default: boolean;
    sm: boolean;
    lg: boolean;
  }>({ default: false, sm: false, lg: false });
  const [imageErrors, setImageErrors] = useState<{
    default: string | null;
    sm: string | null;
    lg: string | null;
  }>({ default: null, sm: null, lg: null });

  useEffect(() => {
    fetchBanners();
    return () => {
      Object.values(imagePreviews).forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [imagePreviews]);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banner');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const { data } = await response.json();
      const transformedBanners: Banner[] = Array.isArray(data)
        ? data.map((item: any) => ({
          id: item.id,
          title: item.title,
          imageUrls: {
            default: item.imageUrls.default,
            sm: item.imageUrls.sm,
            lg: item.imageUrls.lg,
          },
          type: item.type,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          active: item.status === 'active',
          startDate: item.start_date || '',
          endDate: item.end_date || '',
        }))
        : [];
      setBanners(transformedBanners);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load banners');
    }
  };

  const isVideoFile = (file: File): boolean => {
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    return videoTypes.includes(file.type);
  };

  const isVideoUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  };

  const validateFile = async (file: File, variant: 'default' | 'sm' | 'lg'): Promise<boolean> => {
    const { type } = formData;
    const isVideo = isVideoFile(file);
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

    // Check file type
    if (type === 'hero-secondary' && bannerTypeConfig[type].supportsVideo) {
      if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
        setImageErrors((prev) => ({
          ...prev,
          [variant]: 'Please upload a JPEG, PNG, WebP image or MP4, WebM, OGG, MOV, AVI video',
        }));
        return false;
      }
    } else if (!validImageTypes.includes(file.type)) {
      setImageErrors((prev) => ({
        ...prev,
        [variant]: 'Please upload a JPEG, PNG, or WebP image',
      }));
      return false;
    }

    // Validate image dimensions (skip for videos)
    if (!isVideo) {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const { width, height } = bannerTypeConfig[type].dimensions[variant];
          const isValid = img.width >= width && img.height >= height;
          URL.revokeObjectURL(img.src);
          if (!isValid) {
            setImageErrors((prev) => ({
              ...prev,
              [variant]: `Image dimensions must be at least ${width}x${height}px. Current: ${img.width}x${img.height}px`,
            }));
            resolve(false);
          } else {
            setImageErrors((prev) => ({ ...prev, [variant]: null }));
            resolve(true);
          }
        };
        img.onerror = () => {
          setImageErrors((prev) => ({ ...prev, [variant]: 'Failed to load image for validation' }));
          URL.revokeObjectURL(img.src);
          resolve(false);
        };
      });
    } else {
      // Optionally validate video size (e.g., max 50MB)
      const maxSizeMB = 50;
      if (file.size > maxSizeMB * 1024 * 1024) {
        setImageErrors((prev) => ({
          ...prev,
          [variant]: `Video size must be less than ${maxSizeMB}MB`,
        }));
        return false;
      }
      setImageErrors((prev) => ({ ...prev, [variant]: null }));
      return true;
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, files, checked } = e.target as HTMLInputElement;
    if (type === 'file' && files?.[0]) {
      const file = files[0];
      const variant = name as 'default' | 'sm' | 'lg';
      const isValid = await validateFile(file, variant);
      if (isValid) {
        setFormData((prev) => ({
          ...prev,
          images: { ...prev.images, [variant]: file },
        }));
        setImagePreviews((prev) => ({ ...prev, [variant]: URL.createObjectURL(file) }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
      if (name === 'type') {
        for (const variant of ['default', 'sm', 'lg'] as const) {
          if (formData.images[variant]) {
            validateFile(formData.images[variant]!, variant);
          }
        }
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, variant: 'default' | 'sm' | 'lg') => {
    e.preventDefault();
    setIsDragging((prev) => ({ ...prev, [variant]: true }));
  };

  const handleDragLeave = (variant: 'default' | 'sm' | 'lg') => {
    setIsDragging((prev) => ({ ...prev, [variant]: false }));
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, variant: 'default' | 'sm' | 'lg') => {
    e.preventDefault();
    setIsDragging((prev) => ({ ...prev, [variant]: false }));
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const isValid = await validateFile(file, variant);
    if (isValid) {
      setFormData((prev) => ({
        ...prev,
        images: { ...prev.images, [variant]: file },
      }));
      setImagePreviews((prev) => ({ ...prev, [variant]: URL.createObjectURL(file) }));
    }
  };

  const handleRemoveImage = (variant: 'default' | 'sm' | 'lg') => {
    setFormData((prev) => ({
      ...prev,
      images: { ...prev.images, [variant]: null },
    }));
    setImagePreviews((prev) => ({ ...prev, [variant]: null }));
    setImageErrors((prev) => ({ ...prev, [variant]: null }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.type || !formData.images.default) {
      toast.error('Please provide a title, type, and default image/video');
      return;
    }
    if (Object.values(imageErrors).some((error) => error)) {
      toast.error('Please fix file errors');
      return;
    }
  
    setIsLoading(true);
    try {
      const apiFormData = new FormData();
      apiFormData.append('title', formData.title.trim());
      apiFormData.append('type', formData.type);
      apiFormData.append('status', formData.active ? 'active' : 'inactive');
      if (formData.startDate) apiFormData.append('start_date', formData.startDate);
      if (formData.endDate) apiFormData.append('end_date', formData.endDate);
      apiFormData.append('image', formData.images.default);
      if (formData.images.sm) apiFormData.append('imageSm', formData.images.sm);
      if (formData.images.lg) apiFormData.append('imageLg', formData.images.lg);
  
      // Log FormData
      for (const [key, value] of apiFormData.entries()) {
        console.log(`FormData ${key}:`, value);
      }
  
      const response = await fetch('/api/banner', { method: 'POST', body: apiFormData });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.message || 'Failed to create banner');
      }
  
      const { bannerId, imageUrls } = await response.json();
      if (!imageUrls.default) {
        throw new Error('Invalid default file URL returned from server');
      }
  
      const currentDate = new Date().toISOString();
      const newBanner: Banner = {
        id: bannerId,
        title: formData.title,
        imageUrls,
        type: formData.type,
        createdAt: currentDate,
        updatedAt: currentDate,
        active: formData.active,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
  
      setBanners((prev) => [...prev, newBanner]);
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        type: 'hero-main',
        images: { default: null, sm: null, lg: null },
        active: true,
        startDate: '',
        endDate: '',
      });
      setImagePreviews({ default: null, sm: null, lg: null });
      setImageErrors({ default: null, sm: null, lg: null });
      toast.success('Banner created successfully');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBanner = () => {
    setIsAddModalOpen(true);
  };

  const deleteBanner = async (banner: Banner) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/banner', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [banner.id] }),
      });
      if (!response.ok) throw new Error('Failed to delete banner');
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      setSelectedBanners((prev) => prev.filter((b) => b.id !== banner.id));
      toast.success('Banner deleted successfully');
    } catch (error) {
      toast.error('Failed to delete banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async (selectedItems: Banner[]) => {
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} banners?`)) return;
    try {
      const selectedIds = selectedItems.map((item) => item.id);
      const response = await fetch('/api/banner', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!response.ok) throw new Error('Failed to delete banners');
      setBanners((prev) => prev.filter((banner) => !selectedIds.includes(banner.id)));
      setSelectedBanners([]);
      toast.success(`${selectedItems.length} banners deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete banners');
    }
  };

  const handleToggleActive = (id: string) => {
    const banner = banners.find((b) => b.id === id);
    if (!banner) return;
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
    toast.success(`Banner status updated to ${banner.active ? 'inactive' : 'active'}`);
  };

  const bannerColumns: ColumnDefinition<Banner>[] = [
    {
      key: 'imageUrls',
      header: 'Banner',
      width: '150px',
      align: 'left',
      renderCell: (value, banner) => {
        const { default: defaultUrl, sm, lg } = value as Banner['imageUrls'];
        const isVideo = isVideoUrl(defaultUrl);

        return (
          <div className="flex-shrink-0 h-20 w-40 relative items-center justify-center">
            {isVideo ? (
              <video
                src={defaultUrl}
                className="object-cover rounded-md w-full h-full"
                autoPlay
                muted
                loop
                playsInline
                aria-label={`Video preview for ${banner.title}`}
                title={banner.title}
              />
            ) : (
              <picture>
                {lg && <source srcSet={lg} media="(min-width: 1024px)" />}
                {sm && <source srcSet={sm} media="(min-width: 640px)" />}
                <Image
                  src={defaultUrl}
                  alt={banner.title}
                  width={160}
                  height={80}
                  className="object-contain rounded-md"
                  aria-label={`Image preview for ${banner.title}`}
                  priority={false}
                />
              </picture>
            )}
            {isVideo && (
              <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded">
                Video
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      width: '25%',
      align: 'left',
      renderCell: (value) => <div className="text-sm font-medium text-center text-gray-900">{value}</div>,
    },
    {
      key: 'type',
      header: 'Category',
      sortable: true,
      width: '15%',
      align: 'left',
      renderCell: (value) => {
        const type = value as BannerType;
        return (
          <span
            className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${bannerTypeConfig[type].color}`}
          >
            {bannerTypeConfig[type].label}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: '15%',
      align: 'center',
      renderCell: (value) => formatDate(value as string),
    },
    {
      key: 'startDate',
      header: 'Campaign Period',
      width: '20%',
      align: 'left',
      renderCell: (value, banner) =>
        banner.startDate && banner.endDate ? (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>
              {formatDate(banner.startDate)} to {formatDate(banner.endDate)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">No date range set</span>
        ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      width: '10%',
      align: 'left',
      renderCell: (value, banner) => {
        const isActive = value === true;
        return (
          <button
            onClick={() => handleToggleActive(banner.id)}
            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}
            aria-label={`Toggle status to ${isActive ? 'inactive' : 'active'}`}
          >
            {isActive ? 'Active' : 'Scheduled'}
          </button>
        );
      },
    },
  ];

  const bannerCounts = banners.reduce(
    (acc, banner) => {
      acc[banner.type] = (acc[banner.type] || 0) + 1;
      return acc;
    },
    {} as Record<BannerType, number>
  );

  const addBannerFormContent = (
    <form onSubmit={handleSubmit} aria-labelledby="add-banner-title">
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 ">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          aria-required="true"
          placeholder="Enter banner title"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {(['default', 'sm', 'lg'] as const).map((variant) => (
        <div key={variant} className="mb-4">
          <label
            htmlFor={`image-${variant}`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {variant === 'default' ? 'Default Banner' : `${variant.toUpperCase()} Banner`}
            {variant !== 'default' && <span className="text-gray-400"> (Optional)</span>}
          </label>
          <div
            className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${isDragging[variant] ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
            onDragOver={(e) => handleDragOver(e, variant)}
            onDragLeave={() => handleDragLeave(variant)}
            onDrop={(e) => handleDrop(e, variant)}
          >
            <input
              type="file"
              id={`image-${variant}`}
              name={variant}
              onChange={handleChange}
              className="hidden"
              accept={
                formData.type === 'hero-secondary'
                  ? 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo'
                  : 'image/jpeg,image/png,image/webp'
              }
              aria-required={variant === 'default'}
            />
            {imagePreviews[variant] ? (
              <div className="relative w-full h-48">
                {isVideoFile(formData.images[variant]!) ? (
                  <video
                    src={imagePreviews[variant]!}
                    className="object-contain rounded-md w-full h-full"
                    controls
                    aria-label={`${variant} video preview`}
                  />
                ) : (
                  <Image
                    src={imagePreviews[variant]!}
                    alt={`${variant} image preview`}
                    fill
                    className="object-contain rounded-md"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(variant)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                  aria-label={`Remove ${variant} file`}
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Optimized for {variant} screens
                </p>
              </div>
            ) : (
              <label
                htmlFor={`image-${variant}`}
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Drag and drop an {formData.type === 'hero-secondary' ? 'image or video' : 'image'} here, or click to select
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: {bannerTypeConfig[formData.type].recommendedSizes[variant]}
                </p>
              </label>
            )}
            {imageErrors[variant] && (
              <p className="text-sm text-red-600 mt-2">{imageErrors[variant]}</p>
            )}
          </div>
        </div>
      ))}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="active"
          name="active"
          checked={formData.active}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
          aria-checked={formData.active}
        />
        <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
          Active
        </label>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setIsAddModalOpen(false);
            setImagePreviews({ default: null, sm: null, lg: null });
            setImageErrors({ default: null, sm: null, lg: null });
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || Object.values(imageErrors).some((error) => error)}
          aria-label="Submit new banner"
        >
          {isLoading ? 'Adding...' : 'Add Banner'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Banner Management</h1>
        <div className="flex space-x-2">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <span className="text-sm font-semibold text-gray-700">Total: {banners.length}</span>
            <div className="flex mt-2 space-x-2">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
                {banners.filter((b) => b.active).length} Active
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-600">
                {banners.filter((b) => !b.active).length} Scheduled
              </span>
            </div>
          </div>
          <button
            onClick={handleAddBanner}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            aria-label="Add banner"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Banner
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {Object.entries(bannerTypeConfig).map(([type, config]) => (
          <div
            key={type}
            className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center"
          >
            <span className={`px-3 py-1 text-sm font-medium rounded-md mb-2 ${config.color}`}>
              {config.label}
            </span>
            <div className="text-xl font-semibold">{bannerCounts[type as BannerType] || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              {banners.filter((b) => b.type === type && b.active).length} Active
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-50 overflow-y-auto ">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mt-[30%] mb-20">
            <div className="flex justify-between items-center mb-4">
              <h2 id="add-banner-title" className="text-xl font-bold">Add New Banner</h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setImagePreviews({ default: null, sm: null, lg: null });
                  setImageErrors({ default: null, sm: null, lg: null });
                }}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
          selectionKey: 'id',
        }}
        search={{
          enabled: true,
          keys: ['title', 'type'],
          placeholder: 'Search banners...',
        }}
        filters={{ enabled: true }}
        pagination={{
          enabled: true,
          pageSizeOptions: [5, 10, 25, 50],
          defaultPageSize: 10,
        }}
        sorting={{
          enabled: true,
          defaultSortColumn: 'createdAt',
          defaultSortDirection: 'desc',
        }}
        actions={{
          onAdd: handleAddBanner,
          addButtonText: 'Add Banner',
          bulkActions: { delete: handleBulkDelete },
          rowActions: { delete: deleteBanner },
        }}
        customization={{
          zebraStriping: false,
          stickyHeader: true,
        }}
        onRowClick={(banner) => router.push(`/banner/${banner.id}`)}
      />
    </div>
  );
};

export default PromotionalBannersPage;