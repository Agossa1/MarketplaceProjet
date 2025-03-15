export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Cette regex accepte les formats: (123) 456-7890, 123-456-7890, 1234567890
  const phoneRegex = /^(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
  console.log('Validating password:', password);
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const isValid = passwordRegex.test(password);
  console.log('Password validation result:', isValid);
  return isValid;
};

export const validateToken = (token) => {
  console.log('Validating token:', token);

  if (token === undefined) {
    console.log('Token validation failed: token is undefined');
    return false;
  }

  // Vérifiez si le token a une longueur minimale (par exemple, au moins 10 caractères)
  if (token.length < 10) {
    console.log('Token validation failed: too short');
    return false;
  }

  // Vérifiez si le token ne contient que des caractères valides (alphanumériques et certains caractères spéciaux)
  const tokenRegex = /^[a-zA-Z0-9_-]+$/;
  const isValid = tokenRegex.test(token);
  console.log('Token validation result:', isValid);
  return isValid;
};

// Ajouter ces fonctions de validation en haut du fichier
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone) => {
    // Accepte les formats internationaux et nationaux avec ou sans espaces/tirets
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{8,15}$/;
    return phoneRegex.test(phone);
};

export const validateShopData = (data) => {
    const errors = [];

    // Validation du nom
    if (!data.name || data.name.trim() === '') {
        errors.push('Le nom du magasin est requis');
    } else if (data.name.length < 3 || data.name.length > 50) {
        errors.push('Le nom du magasin doit contenir entre 3 et 50 caractères');
    }



    // Validation des catégories
    if (!data.categories || !Array.isArray(data.categories) || data.categories.length === 0) {
        errors.push('Au moins une catégorie est requise');
    }

    // Validation de l'email de contact
    if (!data.contactEmail || !isValidEmail(data.contactEmail)) {
        errors.push('Un email de contact valide est requis');
    }

    // Validation du téléphone de contact - rendue optionnelle
    if (data.contactPhone && !isValidPhone(data.contactPhone)) {
        errors.push('Le numéro de téléphone de contact doit être valide');
    }

    // Validation des horaires d'ouverture - rendue optionnelle
    if (data.openingHours) {
        if (!Array.isArray(data.openingHours) || data.openingHours.length === 0) {
            errors.push('Les horaires d\'ouverture doivent être un tableau non vide');
        } else {
            // Vérifier que chaque jour a un format valide
            for (const day of data.openingHours) {
                if (!day.day || !day.open || !day.close) {
                    errors.push('Chaque jour doit avoir un nom, une heure d\'ouverture et une heure de fermeture');
                }
            }
        }
    }

    return errors;
};