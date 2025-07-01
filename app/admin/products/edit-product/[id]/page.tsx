import EditProductPage from '@/components/Admin/Product/EditProduct'

type Params = Promise<{id: string}>;

const Page = async({ params }: {params: Params}) => {

  const { id } = await params;


  return (
    <div>
      <EditProductPage id={id} />
    </div>
  )
}

export default Page
