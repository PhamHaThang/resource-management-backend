module.exports = {
  isValidEmail: (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
  },
};
