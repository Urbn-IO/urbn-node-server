import { GenericResponse, UserInputs } from "./graphqlTypes";

export const validatePassword = (input: UserInputs): GenericResponse => {
  if (input.password.length < 8) {
    return { errorMessage: "Password must be at least 8 characters long!" };
  }
  return { success: "success" };
};

export const validateEmail = (input: string) => {
  const regexp = new RegExp(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  return regexp.test(input);
};
