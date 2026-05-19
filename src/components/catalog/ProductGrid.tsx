import ProductCard from './ProductCard';
import { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  cols?: 2 | 3;
}

export default function ProductGrid({ products, cols = 2 }: ProductGridProps) {
  return (
    <div className={`grid gap-3 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
