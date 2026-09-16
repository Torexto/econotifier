import { createPseHandler } from "./_shared.js";

const { GET, default: handler } = createPseHandler("energy-prices");

export { GET };
export default handler;
