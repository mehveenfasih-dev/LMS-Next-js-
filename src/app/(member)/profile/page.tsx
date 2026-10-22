import type { Metadata } from "next";
import { MemberProfile } from "@/features/library/components/MemberProfile";
import { LocaleText } from "@/components/common/LocaleText";

export const metadata: Metadata = { title: "My profile" };

export default function ProfilePage() {
  return (
    <>
      <div className="page-heading">
        <h1><LocaleText message="My profile" /></h1>
        <p><LocaleText message="Manage your library membership." /></p>
      </div>
      <MemberProfile />
    </>
  );
}
