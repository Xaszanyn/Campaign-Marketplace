CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected', 'paid');--> statement-breakpoint
CREATE TABLE "submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign" uuid NOT NULL,
	"creator" uuid NOT NULL,
	"post_url" text NOT NULL,
	"platform" "platform" NOT NULL,
	"status" "submission_status" NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_post_url_unique" UNIQUE("campaign","post_url")
);
--> statement-breakpoint
CREATE TABLE "submission_metric" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission" uuid NOT NULL,
	"views" integer NOT NULL,
	"likes" integer NOT NULL,
	"comments" integer NOT NULL,
	"captured_at" date NOT NULL,
	CONSTRAINT "submission_date_unique" UNIQUE("submission","captured_at")
);
--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_campaign_campaign_id_fk" FOREIGN KEY ("campaign") REFERENCES "public"."campaign"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_creator_user_id_fk" FOREIGN KEY ("creator") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_metric" ADD CONSTRAINT "submission_metric_submission_submission_id_fk" FOREIGN KEY ("submission") REFERENCES "public"."submission"("id") ON DELETE no action ON UPDATE no action;