import { z } from "zod";

import { platformList, submissionStatusList } from "$/enums";

const id = {
  id: z.string(),
};

export const create = z.object({
  campaign: z.string(),
  creator: z.string(),
  postURL: z.string().url(),
  platform: z.enum(platformList),
});

export const list = z.object({
  creator: z.string(),
  status: z.enum(submissionStatusList).optional(),
});

export const approve = z.object(id);

export const reject = z.object({
  ...id,
  rejectionReason: z.string().min(1),
});
