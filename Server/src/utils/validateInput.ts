import { UserInputs, UserResponse } from "./graphqlTypes";

export const validateInput = (input: UserInputs): UserResponse | null => {
  const regexp = new RegExp(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
  const validEmail = regexp.test(input.email);

  if (!validEmail) {
    return {
      errors: [{ field: "email", errorMessage: "Invalid email format" }],
    };
  }

  if (input.password.length < 8) {
    return {
      errors: [
        {
          field: "password",
          errorMessage: "Password must be at least 8 characters long!",
        },
      ],
    };
  }

  return null;
};
