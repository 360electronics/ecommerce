import EditProductPage from '@/components/Admin/Product/EditProduct'
import { encodeUUID } from '@/utils/Encryption';

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
