import { createPseHandler } from "./_shared";

const { GET, default: handler } = createPseHandler("his-gen-pal");

export { GET };
export default handler;
