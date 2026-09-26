const validator = require('validator');

const validateSignupInput = ({ name, email, password, confirmPassword }) => {
  const errors = {};

  if (!name || validator.isEmpty(name.trim())) {
    errors.name = 'Name is required';
  }

  if (!email || !validator.isEmail(email)) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateLoginInput = ({ email, password }) => {
  const errors = {};

  if (!email || !validator.isEmail(email)) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password || validator.isEmpty(password)) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateSignupInput,
  validateLoginInput,
};
