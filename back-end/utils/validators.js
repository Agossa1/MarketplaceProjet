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