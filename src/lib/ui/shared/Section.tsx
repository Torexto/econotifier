import { SectionHeading, type SectionHeadingProps } from "./SectionHeading";

export function Section({
   children,
   ...props
}: SectionHeadingProps & { children: React.ReactNode }) {
   return (
      <section className="scroll-mt-20">
         <SectionHeading {...props} />
         {children}
      </section>
   );
}
