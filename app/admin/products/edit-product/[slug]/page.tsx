import EditProductPage from '@/components/Admin/Product/EditProduct'
import { FC } from 'react'

interface PageProps {
  params: {
    slug: string
  }
}

const Page: FC<PageProps> = ({ params }) => {
  return (
    <div>
      <EditProductPage slug={params.slug} />
    </div>
  )
}

export default Page
