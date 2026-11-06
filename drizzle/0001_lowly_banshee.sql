CREATE TABLE "admin_message_recipients" (
	"message_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"read_at" bigint,
	CONSTRAINT "admin_message_recipients_message_id_user_id_pk" PRIMARY KEY("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "admin_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"audience" text NOT NULL,
	"target_user_id" integer,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_recipients" (
	"poll_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "poll_recipients_poll_id_user_id_pk" PRIMARY KEY("poll_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"poll_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"option_index" integer NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "poll_votes_poll_id_user_id_pk" PRIMARY KEY("poll_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" integer NOT NULL,
	"audience" text NOT NULL,
	"target_user_id" integer,
	"question" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"options" jsonb NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"closes_at" bigint,
	"created_at" bigint NOT NULL,
	"closed_at" bigint
);
