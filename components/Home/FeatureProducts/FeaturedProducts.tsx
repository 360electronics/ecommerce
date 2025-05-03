import ProductCardwithoutCart from "@/components/Product/ProductCards/ProductCardwithoutCart";
import { FeaturedProductsData } from "./Data";

const FeaturedProducts: React.FC = () => {
    return (
        <div className="py-12">
            <div className="mx-auto ">
                <div className="mb-8 text-start md:text-center">
                    <h2 className=" text-3xl md:text-4xl font-bold mb-2 nohemi-bold">Featured <span className="text-primary">Products</span></h2>
                </div>

                <div className="relative">
                    <div className="flex overflow-x-auto pb-10 snap-x snap-mandatory minimal-scrollbar">
                        <div className="flex gap-6 pl-1">
                            {FeaturedProductsData.map((product) => (
                                <div key={product.id} className="snap-start flex-shrink-0 w-72">
                                    <ProductCardwithoutCart
                                        image={product.image}
                                        name={product.title}
                                        rating={product.rating}
                                        ourPrice={product.price}
                                        mrp={product.mrp}
                                        discount={product.discount}
                                        slug={product.slug}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturedProducts;