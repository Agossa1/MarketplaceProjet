'use client'

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createShop } from '@/app/store/slices/shopSlice';
import { AppDispatch, RootState } from '@/app/store/store';
import { ShopData } from '@/app/types/shops';

import { toast } from 'react-toastify';
import { useAuth } from '@/app/contexts/AuthContext';
import { FaSpinner } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import {categories } from "@/app/contenus/shop/categoriesShop";
import { useForm } from 'react-hook-form';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const CreateShopPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.shop);
  const { user, isLoading, verifyToken, accessToken } = useAuth(); // Ajout de accessToken ici
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ShopData>();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await verifyToken();
        if (!isValid) {
          console.log("L'utilisateur n'est pas authentifié après vérification");
          toast.error("Votre session a expiré. Veuillez vous reconnecter.");
          router.push('/contenus/auth/login');
        } else {
          console.log("L'utilisateur est authentifié après vérification");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        toast.error("Une erreur est survenue lors de la vérification de votre authentification");
      }
    };

    if (!isLoading) {
      checkAuth();
    }
  }, [isLoading, verifyToken, router]);

  if (isLoading) {
    return <div className="text-center">Chargement en cours...</div>;
  }

  const onSubmit = async (data: ShopData) => {
    console.log("Fonction onSubmit appelée", data);
    setIsSubmitting(true);

    if (!user || !accessToken) {
      console.log("Utilisateur non défini ou token manquant");
      toast.error("Vous devez être connecté pour créer une boutique");
      router.push('/contenus/auth/login');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Préparation des données pour l'envoi");
      const formData = new FormData();

      // Ajout des fichiers
      if (data.shopLogo instanceof File) {
        formData.append('logo', data.shopLogo); // Changé de 'shopLogo' à 'logo'
      }
      if (data.coverImage instanceof File) {
        formData.append('coverImage', data.coverImage);
      }
      // Gestion des images multiples si présentes
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image, index) => {
          if (image instanceof File) {
            formData.append(`images`, image);
          }
        });
      }

      // Ajout des autres données
      Object.entries(data).forEach(([key, value]) => {
        if (!['shopLogo', 'coverImage', 'images'].includes(key) && value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      // Log du contenu de FormData
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      console.log("Envoi des données au serveur");
      const result = await dispatch(createShop({ shopData: formData, accessToken })).unwrap();

      if (result && result._id) {
        toast.success('Boutique créée avec succès!');
        router.push(`/contenus/shop/dashboard/${result._id}`);
      } else {
        toast.error("La création a réussi, mais il y a eu un problème avec les données retournées");
      }
    } catch (err) {
      console.error('Erreur lors de la création de la boutique:', err);
      handleError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleError = (err: unknown) => {
  console.error('Erreur lors de la création de la boutique:', err);

  if (err instanceof Error) {
    if (err.message.includes('unauthorized') || err.message.includes('token')) {
      toast.error("Votre session a expiré. Veuillez vous reconnecter.");
      router.push('/contenus/auth/login');
    } else {
      toast.error(err.message || "Une erreur est survenue lors de la création de la boutique");
    }
  } else if (typeof err === 'string') {
    toast.error(err);
  } else {
    toast.error("Une erreur inattendue est survenue");
  }

  // Si l'erreur est liée à l'authentification, vous pouvez également mettre à jour l'état de connexion
  if (err instanceof Error && (err.message.includes('unauthorized') || err.message.includes('token'))) {
    // Assurez-vous que la fonction logout est disponible dans votre contexte d'authentification
    // Si ce n'est pas le cas, vous devrez l'ajouter à votre AuthContext
    // logout();
  }
};
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { id, files } = e.target;
  if (files) {
    if (id === 'shopLogo') {
      setValue('shopLogo', files[0]);
    } else if (id === 'images') {
      setValue('images', Array.from(files));
    }
  }
};

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
            <>
              <div className="mb-4">
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700">Nom de la boutique*</label>
                <input
                    type="text"
                    id="shopName"
                    {...register("name", {
                      required: "Le nom de la boutique est requis",
                      minLength: { value: 3, message: "Le nom doit contenir au moins 3 caractères" }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Catégorie*</label>
                <select
                    id="category"
                    {...register("categories", {required: "La catégorie est requise"})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((category) => (
                      <option key={category.name} value={category.name}>{category.name}</option>
                  ))}
                </select>
                {errors.categories && <p className="mt-1 text-sm text-red-600">{errors.categories.message}</p>}
              </div>
              {selectedCategory && (
                  <div className="mb-4">
                    <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">Sous-catégorie*</label>
                    <select
                        id="subcategory"
                        {...register("subcategories", { required: "La sous-catégorie est requise" })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">Sélectionnez une sous-catégorie</option>
                      {categories.find(cat => cat.name === selectedCategory)?.subcategories.map((subcat) => (
                          <option key={subcat} value={subcat}>{subcat}</option>
                      ))}
                    </select>
                    {errors.subcategories && <p className="mt-1 text-sm text-red-600">{errors.subcategories.message}</p>}
                  </div>
              )}
            </>
        );
      case 2:
        return (
            <>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description de la boutique</label>
                <textarea
                    id="description"
                    {...register("description", { maxLength: { value: 500, message: "La description ne doit pas dépasser 500 caractères" } })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                ></textarea>
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Contact email</label>
                <input
                    type="email"
                    id="contactEmail"
                    {...register("contactEmail", { required: "Le contact email est obligatoire" })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                {errors.contactEmail && <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">Contact telephone</label>
                <input
                    type="tel"
                    id="contactPhone"
                    {...register("contactPhone")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </>
        );
      case 3:
        return (
            <>
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse</label>
                <input
                    type="text"
                    id="address"
                    {...register("address")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="socialMedia.facebook" className="block text-sm font-medium text-gray-700">Facebook</label>
                <input
                    type="url"
                    id="socialMedia.facebook"
                    {...register("socialMedia.facebook")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="socialMedia.instagram" className="block text-sm font-medium text-gray-700">Instagram</label>
                <input
                    type="url"
                    id="socialMedia.instagram"
                    {...register("socialMedia.instagram")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="socialMedia.twitter" className="block text-sm font-medium text-gray-700">Twitter</label>
                <input
                    type="url"
                    id="socialMedia.twitter"
                    {...register("socialMedia.twitter")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </>
        );
      case 4:
        return (
            <>
              <div className="mb-4">
                <label htmlFor="shopLogo" className="block text-sm font-medium text-gray-700">Logo*</label>
                <input
                    type="file"
                    id="shopLogo"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {errors.shopLogo && <p className="mt-1 text-sm text-red-600">{errors.shopLogo.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="images" className="block text-sm font-medium text-gray-700">Images de la boutique</label>
                <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setValue('images', files);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images.message}</p>}
              </div>
            </>
        );
      default:
        return null;
    }
  };

  return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-center mb-6">Créer votre boutique</h1>
        {error && <div className="text-red-500">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full md:w-2/3 lg:w-1/2">
          {renderStep()}
          <div className="flex justify-between mt-6">
            {currentStep > 1 && (
                <button
                    type="button"
                    onClick={prevStep}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                >
                  <FaArrowLeft className="mr-2" />
                  Précédent
                </button>
            )}
            {currentStep < 4 ? (
                <button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                >
                  Suivant
                  <FaArrowRight className="ml-2" />
                </button>
            ) : (
                <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
                    disabled={loading}
                >
                  {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Création en cours...
                      </>
                  ) : (
                      'Créer la boutique'
                  )}
                </button>
            )}
          </div>
        </form>
      </div>
  );
};

export default  CreateShopPage;
