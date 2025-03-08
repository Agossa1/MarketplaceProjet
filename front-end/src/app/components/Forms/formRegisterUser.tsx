'use client';

import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { registerUser, loginUser } from '../../hooks/authServices';
import { RegisterResponse, LoginResponse, UserData } from '../../types/user';
import Link from 'next/link';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface FormValues {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

const RegisterSchema = Yup.object().shape({
    fullName: Yup.string().required('Votre nom complet est requis'),
    email: Yup.string().email('L\'adresse e-mail n\'est pas valide').required('Votre adresse e-mail est requise'),
    phone: Yup.string().required('Votre numéro de téléphone est requis'),
    password: Yup.string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .matches(/[a-zA-Z]/, 'Le mot de passe doit contenir au moins une lettre')
        .matches(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
        .required('Choisissez un mot de passe'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas')
        .required('Confirmez votre mot de passe'),
});

const RegisterForm: React.FC = () => {
    const { login } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (values: FormValues, { setSubmitting, setStatus }: FormikHelpers<FormValues>) => {
        try {
            const response: RegisterResponse = await registerUser(values);
            if (response.success && response.user) {
                const loginResponse: LoginResponse = await loginUser(response.user.email, values.password);
                if (loginResponse.user && loginResponse.accessToken && loginResponse.refreshToken) {
                    const userData: UserData = {
                        id: loginResponse.user.id,
                        email: loginResponse.user.email,
                        fullName: loginResponse.user.fullName || "",
                        phone: loginResponse.user.phone || "",
                        role: loginResponse.user.role || [],
                        verifiedEmail: loginResponse.user.verifiedEmail,
                        lastLogin: loginResponse.user.lastLogin,
                        accessToken: loginResponse.accessToken,
                        refreshToken: loginResponse.refreshToken,
                    };
                    login(userData);
                    setStatus("Votre compte a bien été créé ! Vous allez être redirigé(e) vers votre profil.");
                    setTimeout(() => {
                        router.push('/contenus/auth/profile');
                    }, 2000);
                } else {
                    setStatus(loginResponse.message || "Une erreur inattendue est survenue lors de la connexion. Veuillez réessayer.");
                }
            } else {
                setStatus(response.error || response.message || "Une erreur inattendue est survenue lors de l'inscription. Veuillez vérifier vos informations et réessayer.");
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription:", error);
            if(error instanceof Error){
                if (error.message.includes("already in use")) {
                    if(error.message.includes("email")){
                        setStatus("Adresse email déjà utilisée.");
                    } else if(error.message.includes("phone")){
                        setStatus("Numéro de téléphone déjà utilisé.");
                    }
                }else {
                    setStatus(error.message);
                }

            }
        } finally {
            setSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (

        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="bg-white p-8   w-96">
                <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Rejoignez-nous !</h2>
                <p className="text-gray-600 mb-6 text-center">Créez votre compte et commencez à profiter de tous nos services !</p>
                <Formik<FormValues>
                    initialValues={{ fullName: '', email: '', phone: '', password: '', confirmPassword: '' }}
                    validationSchema={RegisterSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, status }) => (
                        <Form className="space-y-4">
                            {status && (
                                <p className={`px-4 py-3 rounded relative ${status.includes("réussie") ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"}`} role="alert">
                                    <span className="block sm:inline">{status}</span>
                                </p>
                            )}
                            <div className="mb-4">
                                <label htmlFor="fullName" className="block mb-2">Votre nom complet</label>
                                <Field id="fullName" name="fullName" type="text" placeholder="Votre nom complet" className="w-full p-2 border rounded" aria-label="Votre nom complet" />
                                <ErrorMessage name="fullName" component="p" className="text-red-500 text-sm" />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="email" className="block mb-2">Votre adresse e-mail</label>
                                <Field id="email" name="email" type="email" placeholder="Votre adresse e-mail" className="w-full p-2 border rounded" aria-label="Votre adresse e-mail" />
                                <ErrorMessage name="email" component="p" className="text-red-500 text-sm" />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="phone" className="block mb-2">Votre numéro de téléphone</label>
                                <Field id="phone" name="phone" type="tel" placeholder="Votre numéro de téléphone" className="w-full p-2 border rounded" aria-label="Votre numéro de téléphone"/>
                                <ErrorMessage name="phone" component="p" className="text-red-500 text-sm" />
                            </div>

                            <div className="mb-4 relative">
                                <label htmlFor="password" className="block mb-2">Choisissez un mot de passe</label>
                                <Field id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Choisissez un mot de passe" className="w-full p-2 border rounded pr-10" aria-label="Choisissez un mot de passe"/>
                                <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-9" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                                <ErrorMessage name="password" component="p" className="text-red-500 text-sm" />
                            </div>

                            <div className="mb-4 relative">
                                <label htmlFor="confirmPassword" className="block mb-2">Confirmez votre mot de passe</label>
                                <Field id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirmez votre mot de passe" className="w-full p-2 border rounded pr-10" aria-label="Confirmez votre mot de passe"/>
                                <button type="button" onClick={toggleConfirmPasswordVisibility} className="absolute right-3 top-9" aria-label={showConfirmPassword ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"}>
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                                <ErrorMessage name="confirmPassword" component="p" className="text-red-500 text-sm" />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 shadow-md text-white p-2 rounded transition duration-300">
                                {isSubmitting ? 'Inscription en cours...' : 'Créer mon compte'}
                            </button>
                            <div className="text-center mt-4">
                                Déjà un compte ? <Link href="/contenus/auth/login" className="text-blue-500 hover:text-blue-800">Se connecter</Link>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default RegisterForm;