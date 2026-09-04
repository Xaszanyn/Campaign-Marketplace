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
ALTER TABLE "submission_metric" ADD CONSTRAINT "submission_metric_submission_submission_id_fk" FOREIGN KEY ("submission") REFERENCES "public"."submission"("id") ON DELETE no action ON UPDATE no action;