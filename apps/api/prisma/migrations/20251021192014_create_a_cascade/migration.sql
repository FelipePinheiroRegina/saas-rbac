-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_user_Id_fkey";

-- DropForeignKey
ALTER TABLE "public"."members" DROP CONSTRAINT "members_user_id_fkey";

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_Id_fkey" FOREIGN KEY ("user_Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
