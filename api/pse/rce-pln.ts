import { createPseHandler } from "./_shared.js";

const { GET, default: handler } = createPseHandler("rce-pln");

export { GET };
export default handler;
