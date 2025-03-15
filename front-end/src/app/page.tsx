import Carousel from '@/app/components/Carrousel/Caroussel';
import ProductList from "@/app/components/product/ProductList";
import HomePage from "@/app/components/HomePage";


const carouselItems = [
  {
    image: '/image/carrousel-1.jpg',
    title: "Découvrez nos nouveautés",
    subtitle: "Des produits innovants pour votre quotidien",
    buttonText: "Voir la collection",
    buttonLink: "/nouveautes"
  },
  {
    image: '/image/carrousel-2.jpg',
    title: "Offres spéciales",
    subtitle: "Profitez de nos réductions exceptionnelles",
    buttonText: "Voir les offres",
    buttonLink: "/offres"
  },
  {
    image: '/image/carrousel-3.jpg',
    title: "Collection été",
    subtitle: "Préparez-vous pour la saison estivale",
    buttonText: "Explorer",
    buttonLink: "/collection-ete"
  },
  {
    image: '/image/carrousel-4.jpg',
    title: "Produits éco-responsables",
    subtitle: "Consommez de manière durable",
    buttonText: "Découvrir",
    buttonLink: "/eco-responsable"
  },
];

export default function Home() {

  const products = [
    {
      id: '1',
      name: 'Product 1',
      price: 19.99,
      category: 'Electronics',
      description: 'A high-quality electronic device for everyday use',
      subcategory: 'Smartphones',
      image: '/images/products/product1.jpg'
    },
    {
      id: '2',
      name: 'Product 2',
      price: 29.99,
      category: 'Vêtements et Mode',
      description: 'Comfortable and stylish clothing for all occasions',
      subcategory: 'Hommes',
      image: '/images/products/product2.jpg'
    },
    {
      id: '3',
      name: 'Product 3',
      price: 39.99,
      category: 'Maison et Jardin',
      description: 'Beautiful home decor to enhance your living space',
      subcategory: 'Décoration',
      image: '/images/products/product3.jpg'
    },
    {
      id: '4',
      name: 'Product 4',
      price: 49.99,
      category: 'Beauté et Santé',
      description: 'Premium beauty products for your skincare routine',
      subcategory: 'Soins de la peau',
      image: '/images/products/product4.jpg'
    },
    {
      id: '5',
      name: 'Product 5',
      price: 59.99,
      category: 'Sports et Plein air',
      description: 'High-performance sports equipment for athletes',
      subcategory: 'Fitness',
      image: '/images/products/product5.jpg'
    },
    {
      id: '6',
      name: 'Product 6',
      price: 69.99,
      category: 'Alimentaire',
      description: 'Delicious gourmet food products from local producers',
      subcategory: 'Produits locaux',
      image: '/images/products/product6.jpg'
    }
  ];


  return (
     <main>

       <Carousel items={carouselItems} autoPlayInterval={6000} />
       {/* ... */}

       <ProductList products={products} />
     </main>
  );
}