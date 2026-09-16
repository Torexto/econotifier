import { createPseHandler } from "./_shared.js";

const { GET, default: handler } = createPseHandler("gen-jw");

export { GET };
export default handler;
