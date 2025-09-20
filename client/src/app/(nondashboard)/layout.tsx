import type { Metadata } from "next";
import NonDashboardNavbar from "@/components/NonDashboardNavbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse courses",
};

export default function NonDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="nondashboard-layout">
      <NonDashboardNavbar />
      <main className="nondashboard-layout__main">{children}</main>
      <Footer />
    </div>
  );
}


