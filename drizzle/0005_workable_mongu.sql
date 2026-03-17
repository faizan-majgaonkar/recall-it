CREATE TABLE "question_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"question_count" integer NOT NULL,
	"generation_status" text DEFAULT 'generated' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_bank_id" uuid NOT NULL,
	"primary_concept_id" uuid NOT NULL,
	"type" text NOT NULL,
	"difficulty" text NOT NULL,
	"prompt" text NOT NULL,
	"correct_explanation" text NOT NULL,
	"source_chunk_ids" text NOT NULL,
	"secondary_concept_ids" text,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"option_key" text NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"explanation" text NOT NULL,
	"distractor_rationale" text,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_bank_id_question_banks_id_fk" FOREIGN KEY ("question_bank_id") REFERENCES "public"."question_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_primary_concept_id_concepts_id_fk" FOREIGN KEY ("primary_concept_id") REFERENCES "public"."concepts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "question_banks_document_id_idx" ON "question_banks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "question_banks_user_id_idx" ON "question_banks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "questions_question_bank_id_idx" ON "questions" USING btree ("question_bank_id");--> statement-breakpoint
CREATE INDEX "questions_primary_concept_id_idx" ON "questions" USING btree ("primary_concept_id");--> statement-breakpoint
CREATE INDEX "questions_order_index_idx" ON "questions" USING btree ("question_bank_id","order_index");--> statement-breakpoint
CREATE INDEX "question_options_question_id_idx" ON "options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "question_options_order_index_idx" ON "options" USING btree ("question_id","order_index");