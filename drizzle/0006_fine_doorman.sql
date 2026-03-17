CREATE TABLE "quiz_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_bank_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"total_questions" integer NOT NULL,
	"correct_count" integer,
	"score" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option_id" uuid NOT NULL,
	"is_correct" boolean NOT NULL,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_question_bank_id_question_banks_id_fk" FOREIGN KEY ("question_bank_id") REFERENCES "public"."question_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_selected_option_id_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_sessions_question_bank_id_idx" ON "quiz_sessions" USING btree ("question_bank_id");--> statement-breakpoint
CREATE INDEX "quiz_sessions_user_id_idx" ON "quiz_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_session_id_idx" ON "quiz_answers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_question_id_idx" ON "quiz_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_session_question_idx" ON "quiz_answers" USING btree ("session_id","question_id");