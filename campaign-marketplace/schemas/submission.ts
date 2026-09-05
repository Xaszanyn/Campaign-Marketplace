import { z } from "zod";

import { platformList, submissionStatusList } from "$/enums";

const id = {
  id: z.string(),
};

export const create = z.object({
  campaign: z.string(),
  postUrl: z.string().url("Invalid URL"),
  platform: z.enum(platformList),
});

export const list = z.object({
  status: z.enum(submissionStatusList).optional(),
});

export const approve = z.object(id);

export const reject = z.object({
  ...id,
  rejectionReason: z.string().min(1),
});
