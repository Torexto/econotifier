import { useEffect, useState } from "react";

export function useTheme() {
   const [isDark, setIsDark] = useState(() => {
      const savedTheme = localStorage.getItem("econotifier-theme");
      return savedTheme
         ? savedTheme === "dark"
         : window.matchMedia("(prefers-color-scheme: dark)").matches;
   });

   useEffect(() => {
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      localStorage.setItem("econotifier-theme", isDark ? "dark" : "light");
      document
         .querySelector('meta[name="theme-color"]')
         ?.setAttribute("content", isDark ? "#111814" : "#f5f7f3");
   }, [isDark]);

   const toggleTheme = () => setIsDark((current) => !current);

   return { isDark, toggleTheme };
}
