'use client'
import { AppDispatch, RootState } from '@/app/store/store';
import { categories } from "@/app/contenus/shop/categoriesShop";
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/app/contexts/AuthContext';
import { createShop } from '@/app/store/slices/shopSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaArrowRight, FaSpinner } from 'react-icons/fa';

interface ShopData {
    name: string;
    categories: string[];
    subcategories: string[];
}

const CreateShopPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { user, isLoading, verifyToken, accessToken } = useAuth();

    // Move all useState hooks to the top level, before any conditional logic
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [subcategories, setSubcategories] = useState<string[]>([]);

    // Get shop state from Redux
    // Get shop state from Redux
    const { loading: shopLoading, error: shopError } = useSelector((state: RootState) => state.shop);

    // Initialize the form with react-hook-form
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ShopData>({
        defaultValues: {
            name: '',
            categories: [],
            subcategories: [],
        }
    });

    // Navigation functions
    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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

    // Update subcategories when category changes
    useEffect(() => {
        if (selectedCategory) {
            const categoryData = categories.find(cat => cat.name === selectedCategory);
            if (categoryData && categoryData.subcategories) {
                setSubcategories(categoryData.subcategories);
            } else {
                setSubcategories([]);
            }
        } else {
            setSubcategories([]);
        }
    }, [selectedCategory]);

    if (isLoading) {
        return <div className="text-center">Chargement en cours...</div>;
    }

    const onSubmit = async (data: ShopData) => {
        // Prevent multiple submissions
        if (isSubmitting) return;

        console.log("Fonction onSubmit appelée", data);
        setIsSubmitting(true);

        if (!user || !accessToken) {
            console.log("Utilisateur non défini ou token manquant");
            toast.error("Vous devez être connecté pour créer une boutique");
            router.push('/contenus/auth/login');
            setIsSubmitting(false);
            return;
        }

        // Validation côté client avant envoi
        const validationErrors: string[] = [];

        if (!data.name || data.name.trim().length < 3) {
            validationErrors.push("Le nom de la boutique doit contenir au moins 3 caractères");
        }

        if (!data.categories || data.categories.length === 0) {
            validationErrors.push("Veuillez sélectionner au moins une catégorie");
        }

        if (!data.subcategories || data.subcategories.length === 0) {
            validationErrors.push("Veuillez sélectionner au moins une sous-catégorie");
        }

        if (validationErrors.length > 0) {
            validationErrors.forEach(error => toast.error(error));
            setIsSubmitting(false);
            return;
        }

        try {
            console.log("Préparation des données pour l'envoi");

            // Créer un objet pour l'envoi (pas FormData car on envoie du JSON)
            const shopData = {
                name: data.name,
                categories: data.categories,
                subcategories: data.subcategories
            };
            
            // Dispatch l'action pour créer la boutique// Remplacez les lignes 132-134 par ce code
// Créer un objet FormData
const formData = new FormData();

// Ajouter les données du formulaire à l'objet FormData
formData.append('name', shopData.name);

// Si categories et subcategories sont des tableaux, ajouter le premier élément
if (shopData.categories && shopData.categories.length > 0) {
    formData.append('categories', shopData.categories[0]);
}

if (shopData.subcategories && shopData.subcategories.length > 0) {
    formData.append('subcategories', shopData.subcategories[0]);
}

// Ajouter d'autres champs si nécessaire

// Dispatch l'action pour créer la boutique avec l'objet FormData
const resultAction = await dispatch(createShop({ shopData: formData, accessToken }));
            if (createShop.fulfilled.match(resultAction)) {
                toast.success("Boutique créée avec succès!");
                router.push('/contenus/shop/dashboard'); // Rediriger vers le tableau de bord du vendeur
            } else if (createShop.rejected.match(resultAction)) {
                const errorMessage = resultAction.payload || resultAction.error.message || "Une erreur est survenue lors de la création de la boutique";
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Erreur lors de la création de la boutique:", error);
            toast.error("Une erreur est survenue lors de la création de la boutique");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const category = e.target.value;
        setSelectedCategory(category);
        
        // Mettre à jour les catégories dans le formulaire
        setValue("categories", [category]);
        
        // Réinitialiser les sous-catégories quand la catégorie change
        setValue("subcategories", []);
    };

    const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subcategory = e.target.value;
        setValue("subcategories", [subcategory]);
    };

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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                onChange={handleCategoryChange}
                                value={selectedCategory}
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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                    onChange={handleSubcategoryChange}
                                >
                                    <option value="">Sélectionnez une sous-catégorie</option>
                                    {subcategories.map((subcat) => (
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
                        <div className="mb-4 mt-6">
                            <h3 className="text-lg font-medium text-gray-900">Récapitulatif</h3>
                            <p className="text-sm text-gray-600 mt-2">Veuillez vérifier les informations de votre boutique avant de la créer.</p>
                            <div className="mt-4 bg-gray-50 p-4 rounded-md">
                                <p><strong>Nom:</strong> {watch('name')}</p>
                                <p><strong>Catégorie:</strong> {watch('categories')[0]}</p>
                                <p><strong>Sous-catégorie:</strong> {watch('subcategories')[0]}</p>
                            </div>
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
            {/* Access error from Redux store */}
            {shopError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {shopError}
                </div>
            )}

                      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <span className={`flex-1 border-b-2 ${currentStep >= 1 ? 'border-blue-500' : 'border-gray-300'}`}></span>
                        <span className={`flex-1 border-b-2 ${currentStep >= 2 ? 'border-blue-500' : 'border-gray-300'}`}></span>
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-xs font-medium text-gray-500">Informations</span>
                        <span className="text-xs font-medium text-gray-500">Catégories</span>
                    </div>
                </div>

                <h2 className="text-xl font-semibold mb-4">Créer votre boutique</h2>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    {renderStep()}
                    
                    <div className="flex justify-between mt-6">
                        {currentStep > 1 && (
                            <button 
                                type="button" 
                                onClick={prevStep}
                                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            >
                                <FaArrowLeft className="mr-2" /> Précédent
                            </button>
                        )}
                        
                        {currentStep < 2 ? (
                            <button 
                                type="button" 
                                onClick={nextStep}
                                className="flex items-center ml-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Suivant <FaArrowRight className="ml-2" />
                            </button>
                        ) : (
                            <button 
    type="submit" 
    disabled={isSubmitting || shopLoading}
    className="flex items-center ml-auto px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300"
>
    {isSubmitting || shopLoading ? (
        <>
            <FaSpinner className="animate-spin mr-2" /> Création...
        </>
    ) : (
        <>
            Créer la boutique
        </>
    )}
</button>
                        )}
                    </div>
                </form>
                
                {shopError && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {shopError}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateShopPage;