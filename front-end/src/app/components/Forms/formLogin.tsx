'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa';

interface FormValues {
    email: string;
    password: string;
    rememberMe: boolean;
}

const FormLogin = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormValues>();
    const { login, error, isLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (data: FormValues) => {
        try {
            await login(data.email, data.password);
        } catch (err: unknown) {
            setError('root.serverError', { 
                type: 'server', 
                message: err instanceof Error ? err.message : 'An unknown error occurred' 
            });
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto bg-white p-8 rounded-md shadow-md">
            {error && <div id='error' className='text-red-500 mb-4'>{error}</div>}
            <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="email"
                        id="email"
                        {...register("email", { 
                            required: "Email is required", 
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address"
                            }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 pl-10"
                    />
                </div>
                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
            </div>
            <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        {...register("password", { 
                            required: "Password is required", 
                            minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters'
                            },
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500 pl-10"
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                    >
                        {showPassword ? <FaEyeSlash className="h-5 w-5 text-gray-400" /> : <FaEye className="h-5 w-5 text-gray-400" />}
                    </button>
                </div>
                {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
            </div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        {...register("rememberMe")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                        Se souvenir de moi
                    </label>
                </div>
                <div className="text-sm">
                    <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                        Mot de passe oublié ?
                    </Link>
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-indigo-500 text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-indigo-600 transition duration-300 ease-in-out"
                disabled={isLoading || isSubmitting}
            >
                {isLoading || isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
            <div className="text-sm text-center mt-6">
                <span className="text-gray-600">Pas encore de compte ?</span>{' '}
                <Link href="/contenus/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                    S'inscrire
                </Link>
            </div>
        </form>
    );
};

export default FormLogin;