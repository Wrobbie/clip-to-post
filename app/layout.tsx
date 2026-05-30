"use client"; // Ensure this is at the top if you are using client side hooks here

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import "./globals.css"; // Or whatever your global CSS import is

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Define which routes should NOT show the global top navbar
  // We hide it on the landing page ("/") and the login page ("/login")
  const hideNavbarRoutes = ["/", "/login"];
  const shouldShowNavbar = !hideNavbarRoutes.includes(pathname);

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {/* Only show the global navbar if we aren't on a public landing page */}
        {shouldShowNavbar && <Navbar />}
        
        <main>{children}</main>
      </body>
    </html>
  );
}