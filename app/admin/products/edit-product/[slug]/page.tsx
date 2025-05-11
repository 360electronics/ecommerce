import EditProductPage from '@/components/Admin/Product/EditProduct'

type Params = Promise<{slug: string}>;

const Page = async({ params }: {params: Params}) => {

  const { slug } = await params;

  return (
    <div>
      <EditProductPage slug={slug} />
    </div>
  )
}

export default Page
