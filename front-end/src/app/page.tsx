import Carousel from "./components/Carrousel/Caroussel"

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
  return (
     <main>
       <Carousel items={carouselItems} autoPlayInterval={6000} />
     </main>
  );
}