import { config } from "../config/env";

const devOnly = (...args: unknown[]) => {
  if (!config.isProduction) {
    console.log(...args);
  }
};

export const logger = {
  info: (...args: unknown[]) => devOnly(...args),
  warn: (...args: unknown[]) => devOnly(...args),
  error: (...args: unknown[]) => devOnly(...args),
};
