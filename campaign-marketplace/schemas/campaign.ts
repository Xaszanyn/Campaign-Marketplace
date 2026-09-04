import { z } from "zod";
import { platformList, campaignStatusList } from "$/enums";

const id = {
  id: z.string(),
};

const campaign = z.object({
  title: z.string(),
  platforms: z.enum(platformList).array(),
  payout: z.number().int(),
  budget: z.number().int(),
  status: z.enum(campaignStatusList),
  start: z.coerce.date(),
  end: z.coerce.date().nullable(),
});

export const create = campaign;

export const update = campaign.extend(id);

export const get = z.object(id);

export const list = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
  search: z.string().optional(),
  status: z.enum(campaignStatusList).optional(),
});
