import { z } from "zod";

export const user = z.object({
  userId: z.string(),
});
