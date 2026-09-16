import { createPseHandler } from "./_shared";

const { GET, default: handler } = createPseHandler("energy-prices");

export { GET };
export default handler;
