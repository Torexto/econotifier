import { createPseHandler } from "./_shared.js";

const { GET, default: handler } = createPseHandler("kse-load");

export { GET };
export default handler;
