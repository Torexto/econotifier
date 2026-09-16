import { createPseHandler } from "./_shared";

const { GET, default: handler } = createPseHandler("gen-jw");

export { GET };
export default handler;
