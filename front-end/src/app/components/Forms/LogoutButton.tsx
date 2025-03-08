'use client'
import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '../../hooks/authServices';

interface LogoutButtonProps {
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    // Récupérez l'accessToken et le refreshToken du stockage local ou d'un état global
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken) {
      console.error('No access token found');
      // Optionally, redirect to login if no access token is found
    router.push('/contenus/auth/login');
      return;
    }

    try {
      // Utilisez une assertion de type pour accessToken et une vérification pour refreshToken
      const result = await logout(accessToken as string, refreshToken || undefined);
      if (result.success) {
        console.log(result.message);
        // Effacez les tokens du stockage local
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Redirigez l'utilisateur vers la page de connexion ou la page d'accueil
       router.push('/contenus/auth/login');
      } else {
        console.error(result.message);
        // Gérez l'échec de la déconnexion (par exemple, affichez un message d'erreur à l'utilisateur)
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Gérez les erreurs inattendues
    }
  }, [router]);

  return (
    <button
      className={className}
      onClick={handleLogout}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
