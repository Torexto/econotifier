import { createPseHandler } from "./_shared";

const { GET, default: handler } = createPseHandler("kse-load");

export { GET };
export default handler;
