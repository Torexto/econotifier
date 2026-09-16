import { createPseHandler } from "./_shared";

const { GET, default: handler } = createPseHandler("rce-pln");

export { GET };
export default handler;
