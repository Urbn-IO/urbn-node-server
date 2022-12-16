import { validate } from 'class-validator';

export const validateInput = async (obj: any) => {
  const validationMessage = await validate(obj, { forbidUnknownValues: true });
  if (validationMessage.length > 0) {
    let message;
    const constraints = validationMessage[0].constraints;
    for (const key in constraints) message = constraints[key];
    return message;
  }
  return undefined;
};
